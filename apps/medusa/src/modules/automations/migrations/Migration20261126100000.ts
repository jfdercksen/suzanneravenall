import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Sage link tables (docs/golive/sage-link-README.md). Applied by
 * `medusa db:migrate` on container start. Idempotent (IF NOT EXISTS) and purely
 * additive. Tokens are stored encrypted (AES-256-GCM) by modules/sage/store.ts.
 */
export class Migration20261126100000 extends Migration {
  async up(): Promise<void> {
    const base =
      `"id" text not null, ` +
      `"created_at" timestamptz not null default now(), ` +
      `"updated_at" timestamptz not null default now(), ` +
      `"deleted_at" timestamptz null`

    this.addSql(
      `create table if not exists "sage_oauth_token" (${base}, ` +
        `"access_token" text not null, "refresh_token" text not null, "expires_at" timestamptz not null, "scope" text null, ` +
        `constraint "sage_oauth_token_pkey" primary key ("id"));`
    )
    this.addSql(
      `create table if not exists "sage_oauth_state" (${base}, ` +
        `"state_hash" text not null, "expires_at" timestamptz not null, "consumed_at" timestamptz null, ` +
        `constraint "sage_oauth_state_pkey" primary key ("id"));`
    )
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_sage_oauth_state_hash_unique" ON "sage_oauth_state" ("state_hash");`)
    this.addSql(
      `create table if not exists "sage_customer_map" (${base}, ` +
        `"email" text not null, "sage_customer_id" text not null, ` +
        `constraint "sage_customer_map_pkey" primary key ("id"));`
    )
    // Full unique index: INSERT ... ON CONFLICT ("email") relies on it. Emails are stored lower case.
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_sage_customer_map_email_unique" ON "sage_customer_map" ("email");`)
    this.addSql(
      `create table if not exists "sage_item_cache" (${base}, ` +
        `"item_code" text not null, "sage_item_id" text not null, ` +
        `constraint "sage_item_cache_pkey" primary key ("id"));`
    )
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_sage_item_cache_code_unique" ON "sage_item_cache" ("item_code");`)
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "sage_item_cache";`)
    this.addSql(`drop table if exists "sage_customer_map";`)
    this.addSql(`drop table if exists "sage_oauth_state";`)
    this.addSql(`drop table if exists "sage_oauth_token";`)
  }
}
