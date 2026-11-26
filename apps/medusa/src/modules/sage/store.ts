/**
 * Storage for the Sage link, behind small interfaces so tests run on the
 * Memory* classes and production on the Pg* classes (raw SQL on Medusa's
 * Postgres, same style as ../automations/pg-store.ts). The tables are created
 * by ../automations/migrations/Migration20261126100000.ts.
 *
 *   sage_oauth_token   one row: the access and refresh token, AES-256-GCM encrypted
 *   sage_oauth_state   one-time OAuth state values (hash only), 10 minute expiry
 *   sage_customer_map  buyer email (lower case) to Sage customer id
 *   sage_item_cache    Sage item code to Sage item id
 */

import { createHash, randomUUID } from "node:crypto"
import type { RawSql } from "../automations/pg-store"
import { decryptSecret, encryptSecret, encryptionKey } from "./crypto"

export type SageTokens = {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  scope: string | null
}

export interface SageTokenStore {
  load(): Promise<SageTokens | null>
  /** Refuses (SageConfigError) when SAGE_TOKEN_ENCRYPTION_KEY is unset or invalid. */
  save(tokens: SageTokens): Promise<void>
  saveState(state: string, expiresAt: Date): Promise<void>
  /** True once, for a stored, unexpired, unused state; false every other time. */
  consumeState(state: string, now: Date): Promise<boolean>
}

export interface CustomerMapStore {
  get(email: string): Promise<number | null>
  put(email: string, sageCustomerId: number): Promise<void>
}

export interface ItemCacheStore {
  get(code: string): Promise<number | null>
  put(code: string, sageItemId: number): Promise<void>
}

export const normaliseEmail = (email: string): string => email.trim().toLowerCase()
const hashState = (state: string): string => createHash("sha256").update(state).digest("hex")
const newId = (): string => `sage_${randomUUID().replace(/-/g, "")}`

async function rows(db: RawSql, sql: string, bindings: unknown[] = []): Promise<Record<string, unknown>[]> {
  const res = await db.raw(sql, bindings)
  if (Array.isArray(res)) return res
  return res?.rows ?? []
}

const toDate = (v: unknown): Date => (v instanceof Date ? v : new Date(String(v)))

// ---------------------------------------------------------------------------
// Postgres
// ---------------------------------------------------------------------------

export class PgSageTokenStore implements SageTokenStore {
  constructor(
    private readonly db: RawSql,
    private readonly env: Record<string, string | undefined> = process.env,
  ) {}

  async load(): Promise<SageTokens | null> {
    const r = (await rows(this.db, `SELECT * FROM sage_oauth_token WHERE id = 'sage_oauth_default' AND deleted_at IS NULL LIMIT 1`))[0]
    if (!r) return null
    const key = encryptionKey(this.env)
    return {
      accessToken: decryptSecret(String(r.access_token), key),
      refreshToken: decryptSecret(String(r.refresh_token), key),
      expiresAt: toDate(r.expires_at),
      scope: (r.scope as string | null) ?? null,
    }
  }

  async save(tokens: SageTokens): Promise<void> {
    const key = encryptionKey(this.env) // throws before anything is written
    await rows(
      this.db,
      `INSERT INTO sage_oauth_token (id, access_token, refresh_token, expires_at, scope, created_at, updated_at) ` +
        `VALUES ('sage_oauth_default', ?, ?, ?, ?, now(), now()) ` +
        `ON CONFLICT (id) DO UPDATE SET access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token, ` +
        `expires_at = EXCLUDED.expires_at, scope = EXCLUDED.scope, updated_at = now(), deleted_at = NULL`,
      [encryptSecret(tokens.accessToken, key), encryptSecret(tokens.refreshToken, key), tokens.expiresAt, tokens.scope],
    )
  }

  async saveState(state: string, expiresAt: Date): Promise<void> {
    await rows(this.db, `DELETE FROM sage_oauth_state WHERE expires_at < now() - interval '1 day'`)
    await rows(
      this.db,
      `INSERT INTO sage_oauth_state (id, state_hash, expires_at, created_at, updated_at) VALUES (?, ?, ?, now(), now())`,
      [newId(), hashState(state), expiresAt],
    )
  }

  async consumeState(state: string, now: Date): Promise<boolean> {
    const done = await rows(
      this.db,
      `UPDATE sage_oauth_state SET consumed_at = ?, updated_at = now() ` +
        `WHERE state_hash = ? AND consumed_at IS NULL AND expires_at > ? AND deleted_at IS NULL RETURNING id`,
      [now, hashState(state), now],
    )
    return done.length === 1
  }
}

export class PgCustomerMapStore implements CustomerMapStore {
  constructor(private readonly db: RawSql) {}

  async get(email: string): Promise<number | null> {
    const r = (await rows(this.db, `SELECT sage_customer_id FROM sage_customer_map WHERE email = ? AND deleted_at IS NULL LIMIT 1`, [normaliseEmail(email)]))[0]
    return r ? Number(r.sage_customer_id) : null
  }

  async put(email: string, sageCustomerId: number): Promise<void> {
    await rows(
      this.db,
      `INSERT INTO sage_customer_map (id, email, sage_customer_id, created_at, updated_at) VALUES (?, ?, ?, now(), now()) ` +
        `ON CONFLICT (email) DO UPDATE SET sage_customer_id = EXCLUDED.sage_customer_id, updated_at = now(), deleted_at = NULL`,
      [newId(), normaliseEmail(email), String(sageCustomerId)],
    )
  }
}

export class PgItemCacheStore implements ItemCacheStore {
  constructor(private readonly db: RawSql) {}

  async get(code: string): Promise<number | null> {
    const r = (await rows(this.db, `SELECT sage_item_id FROM sage_item_cache WHERE item_code = ? AND deleted_at IS NULL LIMIT 1`, [code]))[0]
    return r ? Number(r.sage_item_id) : null
  }

  async put(code: string, sageItemId: number): Promise<void> {
    await rows(
      this.db,
      `INSERT INTO sage_item_cache (id, item_code, sage_item_id, created_at, updated_at) VALUES (?, ?, ?, now(), now()) ` +
        `ON CONFLICT (item_code) DO UPDATE SET sage_item_id = EXCLUDED.sage_item_id, updated_at = now(), deleted_at = NULL`,
      [newId(), code, String(sageItemId)],
    )
  }
}

// ---------------------------------------------------------------------------
// Memory (tests, dry runs)
// ---------------------------------------------------------------------------

export class MemorySageTokenStore implements SageTokenStore {
  tokens: SageTokens | null = null
  private readonly states = new Map<string, { expiresAt: Date; used: boolean }>()
  constructor(private readonly env: Record<string, string | undefined> = process.env) {}

  async load(): Promise<SageTokens | null> {
    return this.tokens
  }
  async save(tokens: SageTokens): Promise<void> {
    encryptionKey(this.env) // same refusal as the Pg store
    this.tokens = tokens
  }
  async saveState(state: string, expiresAt: Date): Promise<void> {
    this.states.set(hashState(state), { expiresAt, used: false })
  }
  async consumeState(state: string, now: Date): Promise<boolean> {
    const s = this.states.get(hashState(state))
    if (!s || s.used || s.expiresAt <= now) return false
    s.used = true
    return true
  }
}

export class MemoryCustomerMapStore implements CustomerMapStore {
  readonly map = new Map<string, number>()
  async get(email: string): Promise<number | null> {
    return this.map.get(normaliseEmail(email)) ?? null
  }
  async put(email: string, id: number): Promise<void> {
    this.map.set(normaliseEmail(email), id)
  }
}

export class MemoryItemCacheStore implements ItemCacheStore {
  readonly map = new Map<string, number>()
  async get(code: string): Promise<number | null> {
    return this.map.get(code) ?? null
  }
  async put(code: string, id: number): Promise<void> {
    this.map.set(code, id)
  }
}
