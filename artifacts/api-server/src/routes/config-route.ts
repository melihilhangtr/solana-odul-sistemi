import { Router, type IRouter } from "express";
import { PublicKey } from "@solana/web3.js";
import {
  getActiveMint, setActiveMint,
  getRewardAmountSol, setRewardAmountSol,
  getDistributionEnabled, setDistributionEnabled,
} from "../lib/runtime-config";
import { invalidateCache } from "./qualified-count";
import { updateSchedulerMint, startScheduler, stopScheduler, getSchedulerState } from "../lib/scheduler";

const router: IRouter = Router();

router.get("/config", (_req, res) => {
  res.json({
    activeMint: getActiveMint(),
    rewardAmountSol: getRewardAmountSol(),
    distributionEnabled: getDistributionEnabled(),
    scheduler: getSchedulerState(),
  });
});

router.post("/config/mint", async (req, res) => {
  const mint = req.body?.mint as string | undefined;

  if (!mint) {
    res.status(400).json({ error: "mint is required in request body" });
    return;
  }

  try {
    new PublicKey(mint);
  } catch {
    res.status(400).json({ error: "Invalid Solana mint address" });
    return;
  }

  try {
    const oldMint = getActiveMint();
    await setActiveMint(mint);
    invalidateCache(oldMint);
    invalidateCache(mint);

    const wasRunning = getSchedulerState().running;
    updateSchedulerMint(mint);

    if (wasRunning) {
      stopScheduler();
      startScheduler();
    }

    res.json({ success: true, activeMint: mint, schedulerRestarted: wasRunning });
  } catch (err) {
    req.log.error({ err }, "Failed to update mint config");
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/config/reward-amount", async (req, res) => {
  const raw = req.body?.sol;
  const sol = typeof raw === "string" ? parseFloat(raw) : typeof raw === "number" ? raw : NaN;

  if (isNaN(sol) || sol < 0) {
    res.status(400).json({ error: "sol must be a non-negative number" });
    return;
  }

  if (sol > 1000) {
    res.status(400).json({ error: "sol value seems unreasonably large (max 1000)" });
    return;
  }

  try {
    await setRewardAmountSol(sol);
    res.json({ success: true, rewardAmountSol: sol });
  } catch (err) {
    req.log.error({ err }, "Failed to update reward amount");
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/config/distribution-enabled", async (req, res) => {
  const raw = req.body?.enabled;
  if (typeof raw !== "boolean") {
    res.status(400).json({ error: "enabled must be a boolean" });
    return;
  }

  try {
    await setDistributionEnabled(raw);
    req.log.info({ distributionEnabled: raw }, "Distribution enabled flag changed");
    res.json({ success: true, distributionEnabled: raw });
  } catch (err) {
    req.log.error({ err }, "Failed to update distribution enabled flag");
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
