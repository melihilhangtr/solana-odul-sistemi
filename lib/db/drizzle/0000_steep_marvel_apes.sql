CREATE TABLE "system_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snapshot_holders" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_id" integer NOT NULL,
	"wallet_address" text NOT NULL,
	"raw_amount" text NOT NULL,
	"ui_amount" text NOT NULL,
	"is_qualified" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"mint" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"qualified_count" integer NOT NULL,
	"active_holders" integer NOT NULL,
	"total_raw_accounts" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_distributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"vault_address" text NOT NULL,
	"total_lamports" text DEFAULT '0' NOT NULL,
	"distributed_lamports" text DEFAULT '0' NOT NULL,
	"qualified_holder_count" integer DEFAULT 0 NOT NULL,
	"tx_count" integer DEFAULT 0 NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "reward_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"distribution_id" integer NOT NULL,
	"wallet_address" text NOT NULL,
	"lamports" text NOT NULL,
	"tx_signature" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "snapshot_holders" ADD CONSTRAINT "snapshot_holders_snapshot_id_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_distributions" ADD CONSTRAINT "reward_distributions_snapshot_id_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_payments" ADD CONSTRAINT "reward_payments_distribution_id_reward_distributions_id_fk" FOREIGN KEY ("distribution_id") REFERENCES "public"."reward_distributions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "snapshot_holders_snapshot_id_idx" ON "snapshot_holders" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "reward_payments_distribution_id_idx" ON "reward_payments" USING btree ("distribution_id");