import { pgTable, serial, text, integer, timestamp, bigint, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const snapshotsTable = pgTable("snapshots", {
  id: serial("id").primaryKey(),
  mint: text("mint").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  qualifiedCount: integer("qualified_count").notNull(),
  activeHolders: integer("active_holders").notNull(),
  totalRawAccounts: integer("total_raw_accounts").notNull(),
});

export const snapshotHoldersTable = pgTable(
  "snapshot_holders",
  {
    id: serial("id").primaryKey(),
    snapshotId: integer("snapshot_id")
      .notNull()
      .references(() => snapshotsTable.id, { onDelete: "cascade" }),
    walletAddress: text("wallet_address").notNull(),
    rawAmount: text("raw_amount").notNull(),
    uiAmount: text("ui_amount").notNull(),
    isQualified: integer("is_qualified").notNull().default(0),
  },
  (t) => [index("snapshot_holders_snapshot_id_idx").on(t.snapshotId)]
);

export const insertSnapshotSchema = createInsertSchema(snapshotsTable).omit({ id: true, createdAt: true });
export const insertSnapshotHolderSchema = createInsertSchema(snapshotHoldersTable).omit({ id: true });

export type InsertSnapshot = z.infer<typeof insertSnapshotSchema>;
export type Snapshot = typeof snapshotsTable.$inferSelect;
export type InsertSnapshotHolder = z.infer<typeof insertSnapshotHolderSchema>;
export type SnapshotHolder = typeof snapshotHoldersTable.$inferSelect;
