import { Router, type IRouter } from "express";
import { getScannerState } from "../lib/scanner";
import { getSchedulerState } from "../lib/scheduler";
import { getActiveMint, getRewardAmountSol, getDistributionEnabled } from "../lib/runtime-config";
import { db } from "@workspace/db";
import { rewardDistributionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const router: IRouter = Router();

router.get("/stats", async (_req, res) => {
  const scanner = getScannerState();
  const scheduler = getSchedulerState();

  let totalDistributedSOL = "0.000000000";
  let distributionCount = 0;
  try {
    const dists = await db
      .select()
      .from(rewardDistributionsTable)
      .where(eq(rewardDistributionsTable.status, "completed"));
    const totalLamports = dists.reduce((s, d) => s + BigInt(d.distributedLamports), BigInt(0));
    totalDistributedSOL = (Number(totalLamports) / LAMPORTS_PER_SOL).toFixed(9);
    distributionCount = dists.length;
  } catch {
    // non-fatal
  }

  res.json({
    activeMint: getActiveMint(),
    rewardAmountSol: getRewardAmountSol(),
    distributionEnabled: getDistributionEnabled(),
    scanner: {
      running: scanner.running,
      scanning: scanner.scanning,
      qualifiedCount: scanner.qualifiedCount,
      activeHolders: scanner.activeHolders,
      totalRawAccounts: scanner.totalRawAccounts,
      lastScanAt: scanner.lastScanAt,
      lastScanDurationMs: scanner.lastScanDurationMs,
      lastError: scanner.lastError,
    },
    scheduler: {
      running: scheduler.running,
      cronExpression: scheduler.cronExpression,
      lastRunAt: scheduler.lastRunAt,
      lastSnapshotId: scheduler.lastSnapshotId,
      lastDistributionId: scheduler.lastDistributionId,
      lastError: scheduler.lastError,
      insufficientBalance: scheduler.insufficientBalance,
      feeReserveWarning: scheduler.feeReserveWarning,
    },
    rewards: {
      totalDistributedSOL,
      distributionCount,
    },
  });
});

export default router;
