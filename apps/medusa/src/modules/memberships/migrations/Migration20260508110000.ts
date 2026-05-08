import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260508110000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "membership_subscription" (` +
        `"id" text not null, ` +
        `"customer_id" text not null, ` +
        `"tier_id" text not null, ` +
        `"status" text not null default 'active', ` +
        `"started_at" timestamptz not null, ` +
        `"expires_at" timestamptz null, ` +
        `"medusa_order_id" text null, ` +
        `"supabase_user_id" text null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "membership_subscription_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_membership_subscription_deleted_at" ` +
        `ON "membership_subscription" (deleted_at) WHERE deleted_at IS NULL;`
    )
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "membership_subscription";`)
  }
}
