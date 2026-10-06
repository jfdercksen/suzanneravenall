import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Durable automation queue (n8n migration step 0). Applied by
 * `medusa db:migrate`, which the medusa container runs on every start
 * (apps/medusa/Dockerfile CMD), so a deploy creates the tables. Idempotent
 * (IF NOT EXISTS). Purely additive: no existing table is touched.
 */
export class Migration20261006130000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "automation_job" (` +
        `"id" text not null, ` +
        `"automation" text not null, ` +
        `"idempotency_key" text not null, ` +
        `"order_id" text null, ` +
        `"payload" jsonb not null default '{}'::jsonb, ` +
        `"state" jsonb null, ` +
        `"result" jsonb null, ` +
        `"status" text not null default 'pending', ` +
        `"attempts" integer not null default 0, ` +
        `"next_attempt_at" timestamptz not null default now(), ` +
        `"locked_until" timestamptz null, ` +
        `"last_error" text null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "automation_job_pkey" primary key ("id"), ` +
        `constraint "automation_job_status_check" check ("status" in ('pending', 'running', 'done', 'dead')));`
    )
    // Full (not partial) unique index: INSERT ... ON CONFLICT ("idempotency_key") relies on it.
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_automation_job_idempotency_key_unique" ` +
        `ON "automation_job" ("idempotency_key");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_automation_job_due" ` +
        `ON "automation_job" ("status", "next_attempt_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_automation_job_order_id" ` +
        `ON "automation_job" ("order_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_automation_job_deleted_at" ` +
        `ON "automation_job" (deleted_at) WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "automation_mode_state" (` +
        `"automation" text not null, ` +
        `"mode" text not null, ` +
        `"since" timestamptz not null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "automation_mode_state_pkey" primary key ("automation"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_automation_mode_state_deleted_at" ` +
        `ON "automation_mode_state" (deleted_at) WHERE deleted_at IS NULL;`
    )
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "automation_mode_state";`)
    this.addSql(`drop table if exists "automation_job";`)
  }
}
