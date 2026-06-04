import { Router, type IRouter } from "express";
import {
  startScheduler,
  stopScheduler,
  triggerNow,
  getSchedulerState,
} from "../lib/scheduler";

const router: IRouter = Router();

router.get("/scheduler", (_req, res) => {
  res.json(getSchedulerState());
});

router.post("/scheduler/start", (req, res) => {
  try {
    const cron = req.body?.cron as string | undefined;
    const state = startScheduler(cron);
    res.json({ message: "Scheduler started", ...state });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/scheduler/stop", (_req, res) => {
  const state = stopScheduler();
  res.json({ message: "Scheduler stopped", ...state });
});

router.post("/scheduler/trigger", (_req, res) => {
  try {
    triggerNow();
    res.json({ message: "Cycle triggered manually — running in background" });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
