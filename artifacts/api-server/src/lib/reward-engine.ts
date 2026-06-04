import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { db } from "@workspace/db";
import {
  snapshotsTable,
  snapshotHoldersTable,
  rewardDistributionsTable,
  rewardPaymentsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getVaultKeypair } from "./vault";
import { logger } from "./logger";

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const TRANSFERS_PER_TX = 10;
export const FEE_RESERVE_LAMPORTS = BigInt(0.05 * LAMPORTS_PER_SOL);
const MIN_PAYOUT_LAMPORTS = BigInt(5000);

export const FEE_RESERVE_PREFIX = "FEE_RESERVE_LOW:";
export const INSUFFICIENT_BALANCE_PREFIX = "INSUFFICIENT_BALANCE:";

export interface DistributeResult {
  distributionId: number;
  snapshotId: number;
  vaultAddress: string;
  totalLamports: bigint;
  distributedLamports: bigint;
  qualifiedHolderCount: number;
  txCount: number;
  status: string;
}

export async function distributeRewards(
  snapshotId: number,
  budgetLamports?: bigint
): Promise<DistributeResult> {
  const vault = getVaultKeypair();
  const vaultAddress = vault.publicKey.toBase58();
  const connection = new Connection(RPC_ENDPOINT, "confirmed");

  const snapshot = await db
    .select()
    .from(snapshotsTable)
    .where(eq(snapshotsTable.id, snapshotId))
    .limit(1);

  if (snapshot.length === 0) {
    throw new Error(`Snapshot ${snapshotId} not found`);
  }

  const qualifiedHolders = await db
    .select()
    .from(snapshotHoldersTable)
    .where(
      and(
        eq(snapshotHoldersTable.snapshotId, snapshotId),
        eq(snapshotHoldersTable.isQualified, 1)
      )
    );

  if (qualifiedHolders.length === 0) {
    throw new Error("No qualified holders found in this snapshot");
  }

  const vaultBalance = await connection.getBalance(vault.publicKey);
  const totalLamports = BigInt(vaultBalance);

  if (totalLamports <= FEE_RESERVE_LAMPORTS) {
    throw new Error(
      `${FEE_RESERVE_PREFIX} Vault balance (${(vaultBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL) is at or below the 0.05 SOL fee reserve — distribution halted to protect transaction fees`
    );
  }

  const maxDistributable = totalLamports - FEE_RESERVE_LAMPORTS;

  // If a budget is set, ensure vault can cover it
  if (budgetLamports !== undefined && budgetLamports > BigInt(0)) {
    if (maxDistributable < budgetLamports) {
      const vaultSOL = (vaultBalance / LAMPORTS_PER_SOL).toFixed(4);
      const budgetSOL = (Number(budgetLamports) / LAMPORTS_PER_SOL).toFixed(4);
      throw new Error(
        `${INSUFFICIENT_BALANCE_PREFIX} Vault balance (${vaultSOL} SOL) is below the configured reward amount (${budgetSOL} SOL) plus fee reserve`
      );
    }
  }

  const distributableLamports =
    budgetLamports !== undefined && budgetLamports > BigInt(0)
      ? budgetLamports
      : maxDistributable;

  const totalQualifiedRaw = qualifiedHolders.reduce(
    (sum, h) => sum + BigInt(h.rawAmount),
    BigInt(0)
  );

  const payouts: { walletAddress: string; lamports: bigint }[] = [];
  for (const holder of qualifiedHolders) {
    const share =
      (BigInt(holder.rawAmount) * distributableLamports) / totalQualifiedRaw;
    if (share >= MIN_PAYOUT_LAMPORTS) {
      payouts.push({ walletAddress: holder.walletAddress, lamports: share });
    }
  }

  const [distribution] = await db
    .insert(rewardDistributionsTable)
    .values({
      snapshotId,
      status: "running",
      vaultAddress,
      totalLamports: totalLamports.toString(),
      distributedLamports: "0",
      qualifiedHolderCount: payouts.length,
      txCount: 0,
    })
    .returning();

  let txCount = 0;
  let distributedLamports = BigInt(0);

  try {
    for (let i = 0; i < payouts.length; i += TRANSFERS_PER_TX) {
      const batch = payouts.slice(i, i + TRANSFERS_PER_TX);

      const paymentInserts = batch.map((p) => ({
        distributionId: distribution.id,
        walletAddress: p.walletAddress,
        lamports: p.lamports.toString(),
        status: "pending" as const,
      }));
      const insertedPayments = await db
        .insert(rewardPaymentsTable)
        .values(paymentInserts)
        .returning();

      const tx = new Transaction();
      for (const p of batch) {
        tx.add(
          SystemProgram.transfer({
            fromPubkey: vault.publicKey,
            toPubkey: new PublicKey(p.walletAddress),
            lamports: p.lamports,
          })
        );
      }

      let signature: string;
      try {
        signature = await sendAndConfirmTransaction(connection, tx, [vault], {
          commitment: "confirmed",
        });

        for (const payment of insertedPayments) {
          await db
            .update(rewardPaymentsTable)
            .set({ txSignature: signature, status: "confirmed" })
            .where(eq(rewardPaymentsTable.id, payment.id));
        }

        distributedLamports += batch.reduce((s, p) => s + p.lamports, BigInt(0));
        txCount++;

        logger.info(
          { distributionId: distribution.id, signature, batchSize: batch.length },
          "Reward batch sent"
        );
      } catch (txErr) {
        logger.error({ err: txErr, batch }, "Batch transfer failed");
        for (const payment of insertedPayments) {
          await db
            .update(rewardPaymentsTable)
            .set({ status: "failed" })
            .where(eq(rewardPaymentsTable.id, payment.id));
        }
      }
    }

    await db
      .update(rewardDistributionsTable)
      .set({
        status: "completed",
        completedAt: new Date(),
        distributedLamports: distributedLamports.toString(),
        txCount,
      })
      .where(eq(rewardDistributionsTable.id, distribution.id));

    return {
      distributionId: distribution.id,
      snapshotId,
      vaultAddress,
      totalLamports,
      distributedLamports,
      qualifiedHolderCount: payouts.length,
      txCount,
      status: "completed",
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await db
      .update(rewardDistributionsTable)
      .set({ status: "failed", errorMessage: errMsg })
      .where(eq(rewardDistributionsTable.id, distribution.id));
    throw err;
  }
}
