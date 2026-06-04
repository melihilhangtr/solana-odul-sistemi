import { pgTable, serial, text, integer, timestamp, numeric, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { snapshotsTable } from "./snapshots";

export const rewardDistributionsTable = pgTable("reward_distributions", {
  id: serial("id").primaryKey(),
  snapshotId: integer("snapshot_id")
    .notNull()
    .references(() => snapshotsTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: text("status").notNull().default("pending"),
  vaultAddress: text("vault_address").notNull(),
  totalLamports: text("total_lamports").notNull().default("0"),
  distributedLamports: text("distributed_lamports").notNull().default("0"),
  qualifiedHolderCount: integer("qualified_holder_count").notNull().default(0),
  txCount: integer("tx_count").notNull().default(0),
  errorMessage: text("error_message"),
});

export const rewardPaymentsTable = pgTable(
  "reward_payments",
  {
    id: serial("id").primaryKey(),
    distributionId: integer("distribution_id")
      .notNull()
      .references(() => rewardDistributionsTable.id, { onDelete: "cascade" }),
    walletAddress: text("wallet_address").notNull(),
    lamports: text("lamports").notNull(),
    txSignature: text("tx_signature"),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("reward_payments_distribution_id_idx").on(t.distributionId)]
);

export const insertRewardDistributionSchema = createInsertSchema(rewardDistributionsTable).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});
export const insertRewardPaymentSchema = createInsertSchema(rewardPaymentsTable).omit({
  id: true,
  createdAt: true,
});

export type RewardDistribution = typeof rewardDistributionsTable.$inferSelect;
export type RewardPayment = typeof rewardPaymentsTable.$inferSelect;
