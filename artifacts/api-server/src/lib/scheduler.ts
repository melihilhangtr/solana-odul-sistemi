import cron, { type ScheduledTask } from "node-cron";
import { db } from "@workspace/db";
import { snapshotsTable, snapshotHoldersTable } from "@workspace/db";
import { fetchParsedAccounts, invalidateCache, MIN_QUALIFIED_RAW } from "../routes/qualified-count";
import { distributeRewards, INSUFFICIENT_BALANCE_PREFIX, FEE_RESERVE_PREFIX } from "./reward-engine";
import { isVaultConfigured } from "./vault";
import { getActiveMint, getRewardAmountSol, getDistributionEnabled } from "./runtime-config";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { logger } from "./logger";

const DEFAULT_CRON = process.env["REWARD_INTERVAL_CRON"] ?? "*/3 * * * *";

export interface SchedulerState {
  running: boolean;
  cronExpression: string;
  mint: string;
  lastRunAt: string | null;
  lastSnapshotId: number | null;
  lastDistributionId: number | null;
  lastError: string | null;
  insufficientBalance: boolean;
  feeReserveWarning: boolean;
}

let task: ScheduledTask | null = null;
const state: SchedulerState = {
  running: false,
  cronExpression: DEFAULT_CRON,
  mint: "",
  lastRunAt: null,
  lastSnapshotId: null,
  lastDistributionId: null,
  lastError: null,
  insufficientBalance: false,
  feeReserveWarning: false,
};

export function updateSchedulerMint(mint: string): void {
  state.mint = mint;
}

async function runCycle(): Promise<void> {
  const mint = getActiveMint();
  state.mint = mint;
  state.lastRunAt = new Date().toISOString();
  state.lastError = null;
  state.insufficientBalance = false;
  state.feeReserveWarning = false;

  if (!mint) {
    logger.info("Reward scheduler: no mint configured — skipping cycle");
    return;
  }

  logger.info({ mint }, "Reward scheduler: starting cycle");

  try {
    const { all, active, qualified } = await fetchParsedAccounts(mint);

    const [snapshot] = await db
      .insert(snapshotsTable)
      .values({ mint, qualifiedCount: qualified.length, activeHolders: active.length, totalRawAccounts: all.length })
      .returning();

    if (active.length > 0) {
      const holderRows = active.map((acc) => ({
        snapshotId: snapshot.id,
        walletAddress: acc.walletAddress,
        rawAmount: acc.rawAmount.toString(),
        uiAmount: (Number(acc.rawAmount) / 1e6).toFixed(6),
        isQualified: acc.rawAmount >= MIN_QUALIFIED_RAW ? 1 : 0,
      }));
      const BATCH = 500;
      for (let i = 0; i < holderRows.length; i += BATCH) {
        await db.insert(snapshotHoldersTable).values(holderRows.slice(i, i + BATCH));
      }
    }

    invalidateCache(mint);
    state.lastSnapshotId = snapshot.id;
    logger.info({ snapshotId: snapshot.id, qualifiedCount: qualified.length }, "Reward scheduler: snapshot saved");

    // Global kill switch
    if (!getDistributionEnabled()) {
      logger.info("Reward scheduler: distribution disabled globally — skipping");
      return;
    }

    if (!isVaultConfigured()) {
      logger.warn("Reward scheduler: VAULT_PRIVATE_KEY not set — skipping distribution");
      return;
    }

    if (qualified.length === 0) {
      logger.info("Reward scheduler: no qualified holders — skipping distribution");
      return;
    }

    // Skip if no reward amount configured
    const rewardSol = getRewardAmountSol();
    if (rewardSol <= 0) {
      logger.info("Reward scheduler: reward amount not set (0) — skipping distribution");
      return;
    }

    const budgetLamports = BigInt(Math.floor(rewardSol * LAMPORTS_PER_SOL));

    const result = await distributeRewards(snapshot.id, budgetLamports);
    state.lastDistributionId = result.distributionId;
    logger.info(
      { distributionId: result.distributionId, txCount: result.txCount, budgetSOL: rewardSol },
      "Reward scheduler: distribution done"
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    state.lastError = msg;

    if (msg.startsWith(FEE_RESERVE_PREFIX)) {
      state.feeReserveWarning = true;
      logger.warn({ msg }, "Reward scheduler: vault at/below fee reserve — distribution halted");
    } else if (msg.startsWith(INSUFFICIENT_BALANCE_PREFIX)) {
      state.insufficientBalance = true;
      logger.warn({ msg }, "Reward scheduler: insufficient vault balance — distribution skipped");
    } else {
      logger.error({ err }, "Reward scheduler: cycle failed");
    }
  }
}

export function startScheduler(cronExpr?: string): SchedulerState {
  if (task) { task.stop(); task = null; }

  const expr = cronExpr ?? state.cronExpression;
  if (!cron.validate(expr)) throw new Error(`Invalid cron expression: "${expr}"`);

  state.cronExpression = expr;
  state.mint = getActiveMint();
  state.running = true;

  task = cron.schedule(expr, () => {
    runCycle().catch((err) => logger.error({ err }, "Reward scheduler: unhandled error"));
  });

  logger.info({ cron: expr, mint: state.mint }, "Reward scheduler started");
  return getSchedulerState();
}

export function stopScheduler(): SchedulerState {
  if (task) { task.stop(); task = null; }
  state.running = false;
  logger.info("Reward scheduler stopped");
  return getSchedulerState();
}

export function triggerNow(): void {
  runCycle().catch((err) => logger.error({ err }, "Reward scheduler: manual trigger failed"));
}

export function getSchedulerState(): SchedulerState {
  return { ...state, mint: getActiveMint() };
}
