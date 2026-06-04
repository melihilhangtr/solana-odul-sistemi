import { db } from "@workspace/db";
import { systemConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { DEFAULT_MINT } from "../routes/qualified-count";
import { logger } from "./logger";

const CONFIG_KEY_MINT = "active_mint";
const CONFIG_KEY_REWARD_SOL = "reward_amount_sol";
const CONFIG_KEY_DIST_ENABLED = "distribution_enabled";

let _activeMint: string = process.env["SNAPSHOT_MINT"] ?? DEFAULT_MINT;
let _rewardAmountSol: number = 0;
let _distributionEnabled: boolean = true;

export async function loadConfigFromDb(): Promise<void> {
  try {
    const rows = await db.select().from(systemConfigTable);
    for (const row of rows) {
      if (row.key === CONFIG_KEY_MINT) {
        _activeMint = row.value;
      } else if (row.key === CONFIG_KEY_REWARD_SOL) {
        const parsed = parseFloat(row.value);
        if (!isNaN(parsed) && parsed >= 0) _rewardAmountSol = parsed;
      } else if (row.key === CONFIG_KEY_DIST_ENABLED) {
        _distributionEnabled = row.value !== "false";
      }
    }
    logger.info(
      { mint: _activeMint, rewardAmountSol: _rewardAmountSol, distributionEnabled: _distributionEnabled },
      "Runtime config loaded from DB"
    );
  } catch (err) {
    logger.warn({ err }, "Could not load runtime config from DB — using defaults");
  }
}

export function getActiveMint(): string {
  return _activeMint;
}

export async function setActiveMint(mint: string): Promise<void> {
  _activeMint = mint;
  try {
    await db
      .insert(systemConfigTable)
      .values({ key: CONFIG_KEY_MINT, value: mint, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemConfigTable.key,
        set: { value: mint, updatedAt: new Date() },
      });
    logger.info({ mint }, "Active mint updated in DB");
  } catch (err) {
    logger.warn({ err }, "Could not persist mint to DB — updated in-memory only");
  }
}

export function getRewardAmountSol(): number {
  return _rewardAmountSol;
}

export async function setRewardAmountSol(sol: number): Promise<void> {
  _rewardAmountSol = sol;
  try {
    await db
      .insert(systemConfigTable)
      .values({ key: CONFIG_KEY_REWARD_SOL, value: sol.toString(), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemConfigTable.key,
        set: { value: sol.toString(), updatedAt: new Date() },
      });
    logger.info({ rewardAmountSol: sol }, "Reward amount updated in DB");
  } catch (err) {
    logger.warn({ err }, "Could not persist reward amount to DB — updated in-memory only");
  }
}

export function getDistributionEnabled(): boolean {
  return _distributionEnabled;
}

export async function setDistributionEnabled(enabled: boolean): Promise<void> {
  _distributionEnabled = enabled;
  try {
    await db
      .insert(systemConfigTable)
      .values({ key: CONFIG_KEY_DIST_ENABLED, value: enabled ? "true" : "false", updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemConfigTable.key,
        set: { value: enabled ? "true" : "false", updatedAt: new Date() },
      });
    logger.info({ distributionEnabled: enabled }, "Distribution enabled flag updated in DB");
  } catch (err) {
    logger.warn({ err }, "Could not persist distribution flag to DB — updated in-memory only");
  }
}
