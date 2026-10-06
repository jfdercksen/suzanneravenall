/**
 * JobStore on Medusa's own Postgres (the knex connection Medusa registers as
 * ContainerRegistrationKeys.PG_CONNECTION). Tables come from
 * migrations/Migration20261006130000.ts.
 *
 * - INSERT ... ON CONFLICT (idempotency_key) DO NOTHING: enqueueing the same
 *   order step twice keeps the first job.
 * - Claims are a single UPDATE over a SELECT ... FOR UPDATE SKIP LOCKED, so two
 *   runners (the subscriber's immediate run and the scheduled runner) can never
 *   both run one job.
 */

import type { JobRecord, JobStore, ModeState, NewJob } from "./queue"

/** The one knex method this store uses. */
export type RawSql = {
  raw(sql: string, bindings?: unknown[]): Promise<{ rows?: Record<string, unknown>[] } | Record<string, unknown>[]>
}

const DUE_CONDITION =
  `deleted_at IS NULL AND ((status = 'pending' AND next_attempt_at <= ?) OR (status = 'running' AND locked_until < ?))`

export class PgJobStore implements JobStore {
  constructor(private readonly db: RawSql) {}

  private async rows(sql: string, bindings: unknown[] = []): Promise<Record<string, unknown>[]> {
    const res = await this.db.raw(sql, bindings)
    if (Array.isArray(res)) return res
    return res?.rows ?? []
  }

  async insertIfAbsent(job: NewJob): Promise<{ job: JobRecord; created: boolean }> {
    const inserted = await this.rows(
      `INSERT INTO automation_job (id, automation, idempotency_key, order_id, payload, status, attempts, next_attempt_at, created_at, updated_at) ` +
        `VALUES (?, ?, ?, ?, ?::jsonb, 'pending', 0, ?, now(), now()) ` +
        `ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [job.id, job.automation, job.idempotencyKey, job.orderId, JSON.stringify(job.payload), job.nextAttemptAt]
    )
    if (inserted[0]) return { job: toJob(inserted[0]), created: true }
    const existing = await this.getByKey(job.idempotencyKey)
    if (!existing) throw new Error(`automation_job insert for ${job.idempotencyKey} returned nothing`)
    return { job: existing, created: false }
  }

  async claim(id: string, now: Date, leaseUntil: Date): Promise<JobRecord | null> {
    const rows = await this.rows(
      `UPDATE automation_job SET status = 'running', attempts = attempts + 1, locked_until = ?, updated_at = now() ` +
        `WHERE id = (SELECT id FROM automation_job WHERE id = ? AND ${DUE_CONDITION} FOR UPDATE SKIP LOCKED) ` +
        `RETURNING *`,
      [leaseUntil, id, now, now]
    )
    return rows[0] ? toJob(rows[0]) : null
  }

  async claimDue(automations: string[], now: Date, leaseUntil: Date, limit: number): Promise<JobRecord[]> {
    if (automations.length === 0) return []
    const list = automations.map(() => "?").join(", ")
    const rows = await this.rows(
      `UPDATE automation_job SET status = 'running', attempts = attempts + 1, locked_until = ?, updated_at = now() ` +
        `WHERE id IN (SELECT id FROM automation_job WHERE automation IN (${list}) AND ${DUE_CONDITION} ` +
        `ORDER BY next_attempt_at ASC LIMIT ? FOR UPDATE SKIP LOCKED) ` +
        `RETURNING *`,
      [leaseUntil, ...automations, now, now, limit]
    )
    return rows.map(toJob).sort((a, b) => a.next_attempt_at.getTime() - b.next_attempt_at.getTime())
  }

  async saveState(id: string, state: Record<string, unknown>): Promise<void> {
    await this.rows(`UPDATE automation_job SET state = ?::jsonb, updated_at = now() WHERE id = ?`, [
      JSON.stringify(state),
      id,
    ])
  }

  async complete(id: string, state: Record<string, unknown> | null, result: unknown): Promise<void> {
    await this.rows(
      `UPDATE automation_job SET status = 'done', state = ?::jsonb, result = ?::jsonb, locked_until = NULL, ` +
        `last_error = NULL, updated_at = now() WHERE id = ?`,
      [jsonOrNull(state), jsonOrNull(result), id]
    )
  }

  async reschedule(id: string, state: Record<string, unknown> | null, error: string, nextAttemptAt: Date): Promise<void> {
    await this.rows(
      `UPDATE automation_job SET status = 'pending', state = ?::jsonb, last_error = ?, next_attempt_at = ?, ` +
        `locked_until = NULL, updated_at = now() WHERE id = ?`,
      [jsonOrNull(state), error, nextAttemptAt, id]
    )
  }

  async kill(id: string, state: Record<string, unknown> | null, error: string): Promise<void> {
    await this.rows(
      `UPDATE automation_job SET status = 'dead', state = ?::jsonb, last_error = ?, locked_until = NULL, ` +
        `updated_at = now() WHERE id = ?`,
      [jsonOrNull(state), error, id]
    )
  }

  async release(id: string, nextAttemptAt: Date): Promise<void> {
    await this.rows(
      `UPDATE automation_job SET status = 'pending', attempts = GREATEST(attempts - 1, 0), next_attempt_at = ?, ` +
        `locked_until = NULL, updated_at = now() WHERE id = ?`,
      [nextAttemptAt, id]
    )
  }

  async getByKey(key: string): Promise<JobRecord | null> {
    const rows = await this.rows(`SELECT * FROM automation_job WHERE idempotency_key = ? LIMIT 1`, [key])
    return rows[0] ? toJob(rows[0]) : null
  }

  async getModeState(automation: string): Promise<ModeState | null> {
    const rows = await this.rows(
      `SELECT automation, mode, since FROM automation_mode_state WHERE automation = ? AND deleted_at IS NULL LIMIT 1`,
      [automation]
    )
    const row = rows[0]
    return row ? { automation: String(row.automation), mode: String(row.mode), since: toDate(row.since) } : null
  }

  async setModeState(state: ModeState): Promise<void> {
    await this.rows(
      `INSERT INTO automation_mode_state (automation, mode, since, created_at, updated_at) VALUES (?, ?, ?, now(), now()) ` +
        `ON CONFLICT (automation) DO UPDATE SET mode = EXCLUDED.mode, since = EXCLUDED.since, updated_at = now(), deleted_at = NULL`,
      [state.automation, state.mode, state.since]
    )
  }
}

function jsonOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : JSON.stringify(value)
}

function toDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value))
}

function parseJson(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

function toJob(row: Record<string, unknown>): JobRecord {
  return {
    id: String(row.id),
    automation: String(row.automation),
    idempotency_key: String(row.idempotency_key),
    order_id: (row.order_id as string | null) ?? null,
    payload: (parseJson(row.payload) as Record<string, unknown>) ?? {},
    state: (parseJson(row.state) as Record<string, unknown> | null) ?? null,
    result: parseJson(row.result) ?? null,
    status: row.status as JobRecord["status"],
    attempts: Number(row.attempts ?? 0),
    next_attempt_at: toDate(row.next_attempt_at),
    locked_until: row.locked_until ? toDate(row.locked_until) : null,
    last_error: (row.last_error as string | null) ?? null,
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  }
}
