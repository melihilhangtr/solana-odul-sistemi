import { Router, type IRouter } from "express";
import healthRouter from "./health";
import qualifiedCountRouter from "./qualified-count";
import snapshotRouter from "./snapshot";
import rewardRouter from "./reward";
import schedulerRouter from "./scheduler-route";
import totalRewardsRouter from "./total-rewards";
import configRouter from "./config-route";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(qualifiedCountRouter);
router.use(snapshotRouter);
router.use(rewardRouter);
router.use(schedulerRouter);
router.use(totalRewardsRouter);
router.use(configRouter);
router.use(statsRouter);

export default router;
