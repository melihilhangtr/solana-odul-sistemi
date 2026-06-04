import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { rewardDistributionsTable, rewardPaymentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { distributeRewards } from "../lib/reward-engine";
import { isVaultConfigured, getVaultKeypair } from "../lib/vault";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

const router: IRouter = Router();
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";

router.get("/reward/vault", async (_req, res) => {
  if (!isVaultConfigured()) {
    res.status(503).json({ error: "VAULT_PRIVATE_KEY is not configured" });
    return;
  }
  try {
    const vault = getVaultKeypair();
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    const balance = await connection.getBalance(vault.publicKey);
    res.json({
      vaultAddress: vault.publicKey.toBase58(),
      balanceLamports: balance,
      balanceSOL: (balance / LAMPORTS_PER_SOL).toFixed(9),
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/reward/distribute", async (req, res) => {
  if (!isVaultConfigured()) {
    res.status(503).json({ error: "VAULT_PRIVATE_KEY is not configured" });
    return;
  }

  const snapshotId = parseInt((req.query.snapshotId ?? req.body?.snapshotId) as string, 10);
  if (isNaN(snapshotId)) {
    res.status(400).json({ error: "snapshotId is required" });
    return;
  }

  try {
    const result = await distributeRewards(snapshotId);
    res.status(201).json({
      distributionId: result.distributionId,
      snapshotId: result.snapshotId,
      vaultAddress: result.vaultAddress,
      totalSOL: (Number(result.totalLamports) / LAMPORTS_PER_SOL).toFixed(9),
      distributedSOL: (Number(result.distributedLamports) / LAMPORTS_PER_SOL).toFixed(9),
      qualifiedHolderCount: result.qualifiedHolderCount,
      txCount: result.txCount,
      status: result.status,
    });
  } catch (err) {
    req.log.error({ err }, "Distribution failed");
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/reward/distributions", async (req, res) => {
  const limitParam = parseInt((req.query.limit as string | undefined) ?? "20", 10);
  const limit = Math.min(Math.max(1, limitParam), 100);
  try {
    const distributions = await db
      .select()
      .from(rewardDistributionsTable)
      .orderBy(desc(rewardDistributionsTable.createdAt))
      .limit(limit);
    res.json({ distributions });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch distributions");
    res.status(502).json({ error: "Failed to fetch distributions" });
  }
});

router.get("/reward/distributions/:id/payments", async (req, res) => {
  const distributionId = parseInt(req.params.id, 10);
  if (isNaN(distributionId)) {
    res.status(400).json({ error: "Invalid distribution id" });
    return;
  }
  try {
    const payments = await db
      .select()
      .from(rewardPaymentsTable)
      .where(eq(rewardPaymentsTable.distributionId, distributionId));
    res.json({
      distributionId,
      paymentCount: payments.length,
      payments: payments.map((p) => ({
        walletAddress: p.walletAddress,
        lamports: p.lamports,
        sol: (Number(p.lamports) / LAMPORTS_PER_SOL).toFixed(9),
        txSignature: p.txSignature,
        status: p.status,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch payments");
    res.status(502).json({ error: "Failed to fetch payments" });
  }
});

export default router;
