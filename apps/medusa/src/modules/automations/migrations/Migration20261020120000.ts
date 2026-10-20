import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Abandoned-cart reminder sequences (n8n migration step 4). Applied by
 * `medusa db:migrate` on container start, like Migration20261006130000.
 * Idempotent (IF NOT EXISTS). Purely additive: no existing table is touched.
 */
export class Migration20261020120000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "cart_recovery" (` +
        `"id" text not null, ` +
        `"cart_id" text not null, ` +
        `"email" text not null, ` +
        `"first_name" text null, ` +
        `"step" integer not null default 0, ` +
        `"next_send_at" timestamptz null, ` +
        `"last_activity_at" timestamptz not null, ` +
        `"status" text not null default 'active', ` +
        `"stop_reason" text null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "cart_recovery_pkey" primary key ("id"), ` +
        `constraint "cart_recovery_step_check" check ("step" between 0 and 3), ` +
        `constraint "cart_recovery_status_check" check ("status" in ('active', 'completed', 'stopped')));`
    )
    // Full (not partial) unique index: INSERT ... ON CONFLICT ("cart_id") relies on it.
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cart_recovery_cart_id_unique" ON "cart_recovery" ("cart_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_cart_recovery_due" ` +
        `ON "cart_recovery" ("next_send_at") WHERE status = 'active' AND deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_cart_recovery_deleted_at" ` +
        `ON "cart_recovery" (deleted_at) WHERE deleted_at IS NULL;`
    )
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "cart_recovery";`)
  }
}
