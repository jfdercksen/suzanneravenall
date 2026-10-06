/**
 * In-process JobStore with the same semantics as PgJobStore (unique key,
 * due/lease rules, attempts counting). Used for dry runs (nothing is
 * persisted, so a dry run can never block the real run later) and in tests.
 */

import type { JobRecord, JobStore, ModeState, NewJob } from "./queue"

export class MemoryJobStore implements JobStore {
  readonly jobs = new Map<string, JobRecord>()
  readonly modes = new Map<string, ModeState>()

  constructor(private readonly clock: () => Date = () => new Date()) {}

  private copy(job: JobRecord): JobRecord {
    // JSON round trip like a database read; only the row's own timestamps become Dates.
    const out = JSON.parse(JSON.stringify(job)) as JobRecord
    out.next_attempt_at = new Date(job.next_attempt_at)
    out.locked_until = job.locked_until ? new Date(job.locked_until) : null
    out.created_at = new Date(job.created_at)
    out.updated_at = new Date(job.updated_at)
    return out
  }

  private isDue(job: JobRecord, now: Date): boolean {
    if (job.status === "pending") return job.next_attempt_at.getTime() <= now.getTime()
    if (job.status === "running") return !!job.locked_until && job.locked_until.getTime() < now.getTime()
    return false
  }

  private patch(id: string, fields: Partial<JobRecord>): void {
    const job = this.jobs.get(id)
    if (!job) return
    this.jobs.set(id, { ...job, ...fields, updated_at: this.clock() })
  }

  async insertIfAbsent(job: NewJob): Promise<{ job: JobRecord; created: boolean }> {
    const existing = [...this.jobs.values()].find((j) => j.idempotency_key === job.idempotencyKey)
    if (existing) return { job: this.copy(existing), created: false }
    const now = this.clock()
    const record: JobRecord = {
      id: job.id,
      automation: job.automation,
      idempotency_key: job.idempotencyKey,
      order_id: job.orderId,
      payload: JSON.parse(JSON.stringify(job.payload)),
      state: null,
      result: null,
      status: "pending",
      attempts: 0,
      next_attempt_at: job.nextAttemptAt,
      locked_until: null,
      last_error: null,
      created_at: now,
      updated_at: now,
    }
    this.jobs.set(job.id, record)
    return { job: this.copy(record), created: true }
  }

  async claim(id: string, now: Date, leaseUntil: Date): Promise<JobRecord | null> {
    const job = this.jobs.get(id)
    if (!job || !this.isDue(job, now)) return null
    this.patch(id, { status: "running", attempts: job.attempts + 1, locked_until: leaseUntil })
    return this.copy(this.jobs.get(id) as JobRecord)
  }

  async claimDue(automations: string[], now: Date, leaseUntil: Date, limit: number): Promise<JobRecord[]> {
    const due = [...this.jobs.values()]
      .filter((j) => automations.includes(j.automation) && this.isDue(j, now))
      .sort((a, b) => a.next_attempt_at.getTime() - b.next_attempt_at.getTime())
      .slice(0, limit)
    const out: JobRecord[] = []
    for (const j of due) {
      const claimed = await this.claim(j.id, now, leaseUntil)
      if (claimed) out.push(claimed)
    }
    return out
  }

  async saveState(id: string, state: Record<string, unknown>): Promise<void> {
    this.patch(id, { state: JSON.parse(JSON.stringify(state)) })
  }

  async complete(id: string, state: Record<string, unknown> | null, result: unknown): Promise<void> {
    this.patch(id, { status: "done", state, result, locked_until: null, last_error: null })
  }

  async reschedule(id: string, state: Record<string, unknown> | null, error: string, nextAttemptAt: Date): Promise<void> {
    this.patch(id, { status: "pending", state, last_error: error, next_attempt_at: nextAttemptAt, locked_until: null })
  }

  async kill(id: string, state: Record<string, unknown> | null, error: string): Promise<void> {
    this.patch(id, { status: "dead", state, last_error: error, locked_until: null })
  }

  async release(id: string, nextAttemptAt: Date): Promise<void> {
    const job = this.jobs.get(id)
    if (!job) return
    this.patch(id, { status: "pending", attempts: Math.max(job.attempts - 1, 0), next_attempt_at: nextAttemptAt, locked_until: null })
  }

  async getByKey(key: string): Promise<JobRecord | null> {
    const job = [...this.jobs.values()].find((j) => j.idempotency_key === key)
    return job ? this.copy(job) : null
  }

  async getModeState(automation: string): Promise<ModeState | null> {
    return this.modes.get(automation) ?? null
  }

  async setModeState(state: ModeState): Promise<void> {
    this.modes.set(state.automation, { ...state })
  }

  /** Tests: every job, oldest first. */
  all(): JobRecord[] {
    return [...this.jobs.values()].map((j) => this.copy(j))
  }
}
