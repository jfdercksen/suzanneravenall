/**
 * Storage for the cart_recovery rows (n8n migration step 4): PgCartRecoveryStore
 * on Medusa's Postgres, MemoryCartRecoveryStore for tests, both with the same
 * rules:
 *
 * - recordActivity upserts on cart_id. A new row starts at step 0, due at
 *   firstSendAt. An existing active row at step 0 moves its due time to the
 *   later of the two (so the first reminder counts from the LAST activity);
 *   once a reminder has gone, activity no longer moves the schedule. A row
 *   stopped because the cart was emptied ("cart_empty") is reopened, due at
 *   firstSendAt, when the cart has items again; other completed or stopped
 *   rows are never reopened.
 * - markSent only advances from the step it expects (step = template - 1 and
 *   active), so a replayed or late send can never skip or repeat a step.
 */

import type { RawSql } from "./pg-store"

export type CartRecoveryStatus = "active" | "completed" | "stopped"

export type CartRecoveryRecord = {
  id: string
  cart_id: string
  email: string
  first_name: string | null
  step: number
  next_send_at: Date | null
  last_activity_at: Date
  status: CartRecoveryStatus
  stop_reason: string | null
  created_at: Date
  updated_at: Date
}

export type CartActivity = {
  id: string
  cartId: string
  email: string
  firstName: string | null
  now: Date
  firstSendAt: Date
}

export interface CartRecoveryStore {
  recordActivity(input: CartActivity): Promise<{ record: CartRecoveryRecord; created: boolean }>
  get(cartId: string): Promise<CartRecoveryRecord | null>
  /** Active rows whose next reminder is due, oldest first. */
  listDue(now: Date, limit: number): Promise<CartRecoveryRecord[]>
  /**
   * Records reminder `template` as sent: step = template, next_send_at =
   * nextSendAt, or status stopped ("sequence_done") when nextSendAt is null.
   * False when the row was not at step template - 1 or not active.
   */
  markSent(cartId: string, template: number, nextSendAt: Date | null): Promise<boolean>
  finish(cartId: string, status: Exclude<CartRecoveryStatus, "active">, reason: string): Promise<void>
}

export const SEQUENCE_DONE = "sequence_done"
export const CART_EMPTY = "cart_empty"

// Upsert conditions on the existing row (every CASE reads the pre-update values).
const REOPEN = `(cart_recovery.status = 'stopped' AND cart_recovery.stop_reason = '${CART_EMPTY}')`
const OPEN = `(cart_recovery.status = 'active' OR ${REOPEN})`

export class PgCartRecoveryStore implements CartRecoveryStore {
  constructor(private readonly db: RawSql) {}

  private async rows(sql: string, bindings: unknown[] = []): Promise<Record<string, unknown>[]> {
    const res = await this.db.raw(sql, bindings)
    if (Array.isArray(res)) return res
    return res?.rows ?? []
  }

  async recordActivity(input: CartActivity): Promise<{ record: CartRecoveryRecord; created: boolean }> {
    const rows = await this.rows(
      `INSERT INTO cart_recovery (id, cart_id, email, first_name, step, next_send_at, last_activity_at, status, created_at, updated_at) ` +
        `VALUES (?, ?, ?, ?, 0, ?, ?, 'active', now(), now()) ` +
        `ON CONFLICT (cart_id) DO UPDATE SET ` +
        `email = CASE WHEN ${OPEN} THEN EXCLUDED.email ELSE cart_recovery.email END, ` +
        `first_name = CASE WHEN ${OPEN} THEN COALESCE(EXCLUDED.first_name, cart_recovery.first_name) ELSE cart_recovery.first_name END, ` +
        `last_activity_at = GREATEST(cart_recovery.last_activity_at, EXCLUDED.last_activity_at), ` +
        `next_send_at = CASE WHEN ${REOPEN} THEN EXCLUDED.next_send_at ` +
        `WHEN cart_recovery.status = 'active' AND cart_recovery.step = 0 ` +
        `THEN GREATEST(cart_recovery.next_send_at, EXCLUDED.next_send_at) ELSE cart_recovery.next_send_at END, ` +
        `status = CASE WHEN ${REOPEN} THEN 'active' ELSE cart_recovery.status END, ` +
        `stop_reason = CASE WHEN ${REOPEN} THEN NULL ELSE cart_recovery.stop_reason END, ` +
        `updated_at = now() ` +
        `RETURNING *, (xmax = 0) AS inserted`,
      [input.id, input.cartId, input.email, input.firstName, input.firstSendAt, input.now]
    )
    const row = rows[0]
    if (!row) throw new Error(`cart_recovery upsert for ${input.cartId} returned nothing`)
    return { record: toRecord(row), created: row.inserted === true || row.inserted === "t" }
  }

  async get(cartId: string): Promise<CartRecoveryRecord | null> {
    const rows = await this.rows(`SELECT * FROM cart_recovery WHERE cart_id = ? AND deleted_at IS NULL LIMIT 1`, [cartId])
    return rows[0] ? toRecord(rows[0]) : null
  }

  async listDue(now: Date, limit: number): Promise<CartRecoveryRecord[]> {
    const rows = await this.rows(
      `SELECT * FROM cart_recovery WHERE deleted_at IS NULL AND status = 'active' AND next_send_at <= ? ` +
        `ORDER BY next_send_at ASC LIMIT ?`,
      [now, limit]
    )
    return rows.map(toRecord)
  }

  async markSent(cartId: string, template: number, nextSendAt: Date | null): Promise<boolean> {
    const rows = await this.rows(
      `UPDATE cart_recovery SET step = ?, next_send_at = ?, ` +
        `status = CASE WHEN ?::timestamptz IS NULL THEN 'stopped' ELSE 'active' END, ` +
        `stop_reason = CASE WHEN ?::timestamptz IS NULL THEN '${SEQUENCE_DONE}' ELSE NULL END, updated_at = now() ` +
        `WHERE cart_id = ? AND status = 'active' AND step = ? AND deleted_at IS NULL RETURNING id`,
      [template, nextSendAt, nextSendAt, nextSendAt, cartId, template - 1]
    )
    return rows.length > 0
  }

  async finish(cartId: string, status: Exclude<CartRecoveryStatus, "active">, reason: string): Promise<void> {
    await this.rows(
      `UPDATE cart_recovery SET status = ?, stop_reason = ?, next_send_at = NULL, updated_at = now() ` +
        `WHERE cart_id = ? AND status = 'active' AND deleted_at IS NULL`,
      [status, reason, cartId]
    )
  }
}

export class MemoryCartRecoveryStore implements CartRecoveryStore {
  readonly rows = new Map<string, CartRecoveryRecord>()

  async recordActivity(input: CartActivity): Promise<{ record: CartRecoveryRecord; created: boolean }> {
    const existing = this.rows.get(input.cartId)
    if (!existing) {
      const record: CartRecoveryRecord = {
        id: input.id,
        cart_id: input.cartId,
        email: input.email,
        first_name: input.firstName,
        step: 0,
        next_send_at: input.firstSendAt,
        last_activity_at: input.now,
        status: "active",
        stop_reason: null,
        created_at: input.now,
        updated_at: input.now,
      }
      this.rows.set(input.cartId, record)
      return { record: { ...record }, created: true }
    }
    const reopen = existing.status === "stopped" && existing.stop_reason === CART_EMPTY
    const open = existing.status === "active" || reopen
    const later = (a: Date | null, b: Date) => (a && a.getTime() > b.getTime() ? a : b)
    const next: CartRecoveryRecord = {
      ...existing,
      email: open ? input.email : existing.email,
      first_name: open ? (input.firstName ?? existing.first_name) : existing.first_name,
      last_activity_at: later(existing.last_activity_at, input.now),
      next_send_at: reopen
        ? input.firstSendAt
        : existing.status === "active" && existing.step === 0
          ? later(existing.next_send_at, input.firstSendAt)
          : existing.next_send_at,
      status: reopen ? "active" : existing.status,
      stop_reason: reopen ? null : existing.stop_reason,
      updated_at: input.now,
    }
    this.rows.set(input.cartId, next)
    return { record: { ...next }, created: false }
  }

  async get(cartId: string): Promise<CartRecoveryRecord | null> {
    const row = this.rows.get(cartId)
    return row ? { ...row } : null
  }

  async listDue(now: Date, limit: number): Promise<CartRecoveryRecord[]> {
    return [...this.rows.values()]
      .filter((r) => r.status === "active" && r.next_send_at !== null && r.next_send_at.getTime() <= now.getTime())
      .sort((a, b) => (a.next_send_at as Date).getTime() - (b.next_send_at as Date).getTime())
      .slice(0, limit)
      .map((r) => ({ ...r }))
  }

  async markSent(cartId: string, template: number, nextSendAt: Date | null): Promise<boolean> {
    const row = this.rows.get(cartId)
    if (!row || row.status !== "active" || row.step !== template - 1) return false
    this.rows.set(cartId, {
      ...row,
      step: template,
      next_send_at: nextSendAt,
      status: nextSendAt ? "active" : "stopped",
      stop_reason: nextSendAt ? null : SEQUENCE_DONE,
    })
    return true
  }

  async finish(cartId: string, status: Exclude<CartRecoveryStatus, "active">, reason: string): Promise<void> {
    const row = this.rows.get(cartId)
    if (!row || row.status !== "active") return
    this.rows.set(cartId, { ...row, status, stop_reason: reason, next_send_at: null })
  }
}

function toDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value))
}

function toRecord(row: Record<string, unknown>): CartRecoveryRecord {
  return {
    id: String(row.id),
    cart_id: String(row.cart_id),
    email: String(row.email),
    first_name: (row.first_name as string | null) ?? null,
    step: Number(row.step ?? 0),
    next_send_at: row.next_send_at ? toDate(row.next_send_at) : null,
    last_activity_at: toDate(row.last_activity_at),
    status: row.status as CartRecoveryStatus,
    stop_reason: (row.stop_reason as string | null) ?? null,
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  }
}
