import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { rewardDistributionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getActiveMint } from "../lib/runtime-config";

const router: IRouter = Router();

router.get("/total-rewards", async (req, res) => {
  const mint = (req.query.mint as string | undefined) ?? getActiveMint();

  try {
    const distributions = await db
      .select()
      .from(rewardDistributionsTable)
      .where(eq(rewardDistributionsTable.status, "completed"));

    let totalLamports = BigInt(0);
    let totalTxCount = 0;
    let distributionCount = 0;

    for (const d of distributions) {
      totalLamports += BigInt(d.distributedLamports);
      totalTxCount += d.txCount;
      distributionCount++;
    }

    res.json({
      mint,
      totalDistributedLamports: totalLamports.toString(),
      totalDistributedSOL: (Number(totalLamports) / LAMPORTS_PER_SOL).toFixed(9),
      distributionCount,
      totalTxCount,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch total rewards");
    res.status(502).json({ error: "Failed to fetch total rewards" });
  }
});

export default router;
