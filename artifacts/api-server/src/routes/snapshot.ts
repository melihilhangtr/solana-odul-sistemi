import { Router, type IRouter } from "express";
import { PublicKey } from "@solana/web3.js";
import { db } from "@workspace/db";
import { snapshotsTable, snapshotHoldersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  fetchParsedAccounts,
  invalidateCache,
  TOKEN_DECIMALS,
  MIN_QUALIFIED_AMOUNT,
  MIN_ACTIVE_AMOUNT,
  DEFAULT_MINT,
  MIN_QUALIFIED_RAW,
  MIN_ACTIVE_RAW,
} from "./qualified-count";

const router: IRouter = Router();

router.post("/snapshot", async (req, res) => {
  const mint = (req.query.mint as string | undefined) ?? DEFAULT_MINT;

  try {
    new PublicKey(mint);
  } catch {
    res.status(400).json({ error: "Invalid mint address" });
    return;
  }

  try {
    const { all, active, qualified } = await fetchParsedAccounts(mint);

    const [snapshot] = await db
      .insert(snapshotsTable)
      .values({
        mint,
        qualifiedCount: qualified.length,
        activeHolders: active.length,
        totalRawAccounts: all.length,
      })
      .returning();

    if (active.length > 0) {
      const holderRows = active.map((acc) => ({
        snapshotId: snapshot.id,
        walletAddress: acc.walletAddress,
        rawAmount: acc.rawAmount.toString(),
        uiAmount: (Number(acc.rawAmount) / 10 ** TOKEN_DECIMALS).toFixed(TOKEN_DECIMALS),
        isQualified: acc.rawAmount >= MIN_QUALIFIED_RAW ? 1 : 0,
      }));

      const BATCH = 500;
      for (let i = 0; i < holderRows.length; i += BATCH) {
        await db.insert(snapshotHoldersTable).values(holderRows.slice(i, i + BATCH));
      }
    }

    invalidateCache(mint);

    res.status(201).json({
      snapshotId: snapshot.id,
      mint,
      createdAt: snapshot.createdAt,
      qualifiedCount: qualified.length,
      activeHolders: active.length,
      totalRawAccounts: all.length,
      minTokenAmount: MIN_QUALIFIED_AMOUNT,
      minActiveAmount: MIN_ACTIVE_AMOUNT,
      decimals: TOKEN_DECIMALS,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create snapshot");
    res.status(502).json({ error: "Failed to create snapshot" });
  }
});

router.get("/snapshot", async (req, res) => {
  const mint = (req.query.mint as string | undefined) ?? DEFAULT_MINT;
  const limitParam = parseInt((req.query.limit as string | undefined) ?? "10", 10);
  const limit = Math.min(Math.max(1, limitParam), 100);

  try {
    const snapshots = await db
      .select()
      .from(snapshotsTable)
      .where(eq(snapshotsTable.mint, mint))
      .orderBy(desc(snapshotsTable.createdAt))
      .limit(limit);

    res.json({ mint, snapshots });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch snapshots");
    res.status(502).json({ error: "Failed to fetch snapshots" });
  }
});

router.get("/snapshot/:id/holders", async (req, res) => {
  const snapshotId = parseInt(req.params.id, 10);
  if (isNaN(snapshotId)) {
    res.status(400).json({ error: "Invalid snapshot id" });
    return;
  }

  const qualifiedOnly = req.query.qualified === "true";

  try {
    const snapshot = await db
      .select()
      .from(snapshotsTable)
      .where(eq(snapshotsTable.id, snapshotId))
      .limit(1);

    if (snapshot.length === 0) {
      res.status(404).json({ error: "Snapshot not found" });
      return;
    }

    const holders = await db
      .select()
      .from(snapshotHoldersTable)
      .where(eq(snapshotHoldersTable.snapshotId, snapshotId));

    const filtered = qualifiedOnly
      ? holders.filter((h) => h.isQualified === 1)
      : holders;

    res.json({
      snapshotId,
      mint: snapshot[0].mint,
      createdAt: snapshot[0].createdAt,
      holderCount: filtered.length,
      holders: filtered.map((h) => ({
        walletAddress: h.walletAddress,
        uiAmount: h.uiAmount,
        isQualified: h.isQualified === 1,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch snapshot holders");
    res.status(502).json({ error: "Failed to fetch snapshot holders" });
  }
});

export default router;
