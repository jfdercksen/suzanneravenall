/**
 * Durable automation queue (docs/n8n-migration-plan.md section 4.2).
 *
 * - enqueue(automation, key, ...) inserts a job unless one with the same
 *   idempotency key exists (same order step twice = no-op).
 * - runJob(id) claims one job (row lock, lease) and runs its handler; the
 *   subscriber calls it right after enqueue, so the happy path takes seconds.
 * - runDue(limit) is the scheduled runner (src/jobs/automation-runner.ts):
 *   it claims every job whose retry time has come, and every job whose lease
 *   expired because the process died mid-run.
 * - A failed attempt is retried after 1 min, 5 min, 30 min, 2 h, 12 h; after
 *   the sixth failed attempt the job is dead and staff get one alert. Errors a
 *   retry cannot fix (PermanentError, HTTP 4xx other than 408/429) go dead at
 *   once.
 *
 * Storage is behind JobStore: PgJobStore (Medusa Postgres) in production,
 * MemoryJobStore for dry runs and tests.
 */

import { randomUUID } from "node:crypto"
import { IntegrationError, maskEmails, type Logger, type StaffAlert, type StaffAlertOutcome } from "@suzanne/integrations"

export type JobStatus = "pending" | "running" | "done" | "dead"

export type JobRecord = {
  id: string
  automation: string
  idempotency_key: string
  order_id: string | null
  payload: Record<string, unknown>
  state: Record<string, unknown> | null
  result: unknown
  status: JobStatus
  attempts: number
  next_attempt_at: Date
  locked_until: Date | null
  last_error: string | null
  created_at: Date
  updated_at: Date
}

export type NewJob = {
  id: string
  automation: string
  idempotencyKey: string
  orderId: string | null
  payload: Record<string, unknown>
  nextAttemptAt: Date
}

export type ModeState = { automation: string; mode: string; since: Date }

export interface JobStore {
  /** Inserts the job unless its idempotency key exists. Returns the stored job either way. */
  insertIfAbsent(job: NewJob): Promise<{ job: JobRecord; created: boolean }>
  /** Claims one job if it is due (or its lease expired): status running, attempts + 1, lease set. */
  claim(id: string, now: Date, leaseUntil: Date): Promise<JobRecord | null>
  /** Claims up to `limit` due jobs of the given automations, oldest due first, skipping rows locked by others. */
  claimDue(automations: string[], now: Date, leaseUntil: Date, limit: number): Promise<JobRecord[]>
  saveState(id: string, state: Record<string, unknown>): Promise<void>
  complete(id: string, state: Record<string, unknown> | null, result: unknown): Promise<void>
  reschedule(id: string, state: Record<string, unknown> | null, error: string, nextAttemptAt: Date): Promise<void>
  kill(id: string, state: Record<string, unknown> | null, error: string): Promise<void>
  /** Gives a claim back unrun: pending again, the claim's attempt not counted. */
  release(id: string, nextAttemptAt: Date): Promise<void>
  getByKey(key: string): Promise<JobRecord | null>
  getModeState(automation: string): Promise<ModeState | null>
  setModeState(state: ModeState): Promise<void>
}

/** Thrown by a handler when a retry cannot help (bad data). The job goes dead at once. */
export class PermanentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PermanentError"
  }
}

/** Retry delays after attempt 1, 2, 3, 4, 5. The sixth failure is final. */
export const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 3_600_000, 12 * 3_600_000] as const
export const DEFAULT_MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1
/** A claimed job not finished within this time is considered abandoned (crash) and claimed again. */
export const LEASE_MS = 10 * 60_000

/** Delay before the next attempt, given how many attempts have run. Null = no more attempts. */
export function retryDelayMs(attempts: number, maxAttempts = DEFAULT_MAX_ATTEMPTS): number | null {
  if (attempts >= maxAttempts) return null
  return RETRY_DELAYS_MS[Math.min(attempts, RETRY_DELAYS_MS.length) - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]
}

/** True when retrying cannot change the outcome. */
export function isPermanent(err: unknown): boolean {
  if (err instanceof PermanentError) return true
  if (err instanceof IntegrationError && err.status !== null) {
    return err.status >= 400 && err.status < 500 && err.status !== 408 && err.status !== 429
  }
  return false
}

export function errorMessage(err: unknown): string {
  const text = err instanceof Error ? err.message : String(err)
  return maskEmails(text).slice(0, 1000)
}

export type HandlerContext = {
  job: JobRecord
  payload: Record<string, unknown>
  /** The handler's progress from earlier attempts (null on the first attempt). */
  state: Record<string, unknown> | null
  /** Persists progress immediately, so a crash or a retry resumes from here. */
  save(state: Record<string, unknown>): Promise<void>
  /** Queues a follow-up job (same idempotency rules) and starts it right away. */
  enqueue(automation: string, key: string, payload: Record<string, unknown>): Promise<{ job: JobRecord; created: boolean }>
  alert(alert: StaffAlert): Promise<StaffAlertOutcome>
  logger: Logger
}

export type HandlerResult = { result?: unknown; state?: Record<string, unknown> | null } | void

export type AutomationHandler = {
  name: string
  run(ctx: HandlerContext): Promise<HandlerResult>
  maxAttempts?: number
  /** Send a "still failing, retrying" alert when this attempt fails. */
  alertAfterAttempts?: number
  /** Throttle key and lines for the staff alert when the job is dead or still failing. */
  describeFailure(job: JobRecord, error: string, final: boolean): StaffAlert
}

export type RunOutcome = "done" | "retry" | "dead" | "not-claimed" | "held" | "unknown-automation"

export type QueueOptions = {
  store: JobStore
  handlers: AutomationHandler[]
  alert: (alert: StaffAlert) => Promise<StaffAlertOutcome>
  logger?: Logger
  now?: () => Date
  newId?: () => string
  /** False holds the automation's jobs (flag "off"): not claimed, not failed. */
  isRunnable?: (automation: string) => boolean
  /** Runs `fn` in the background. Tests replace it to await everything. */
  defer?: (fn: () => Promise<unknown>) => void
}

export class AutomationQueue {
  private readonly store: JobStore
  private readonly handlers = new Map<string, AutomationHandler>()
  private readonly alertFn: QueueOptions["alert"]
  private readonly logger: Logger
  private readonly now: () => Date
  private readonly newId: () => string
  private readonly isRunnable: (automation: string) => boolean
  private readonly defer: (fn: () => Promise<unknown>) => void

  constructor(opts: QueueOptions) {
    this.store = opts.store
    for (const h of opts.handlers) this.handlers.set(h.name, h)
    this.alertFn = opts.alert
    this.logger = opts.logger ?? console
    this.now = opts.now ?? (() => new Date())
    this.newId = opts.newId ?? defaultId
    this.isRunnable = opts.isRunnable ?? (() => true)
    this.defer =
      opts.defer ??
      ((fn) => {
        setImmediate(() => {
          fn().catch((err: unknown) => this.logger.error(`[automation] background run failed: ${errorMessage(err)}`))
        })
      })
  }

  get storeRef(): JobStore {
    return this.store
  }

  async enqueue(
    automation: string,
    key: string,
    payload: Record<string, unknown>,
    orderId: string | null = null,
  ): Promise<{ job: JobRecord; created: boolean }> {
    if (!this.handlers.has(automation)) throw new Error(`Unknown automation "${automation}"`)
    const res = await this.store.insertIfAbsent({
      id: this.newId(),
      automation,
      idempotencyKey: key,
      orderId,
      payload,
      nextAttemptAt: this.now(),
    })
    this.logger.info(
      `[automation] name=${automation} key=${key} outcome=${res.created ? "enqueued" : "duplicate-ignored"} status=${res.job.status}`
    )
    return res
  }

  /** enqueue, then run it in the background when it is new. */
  async enqueueAndKick(
    automation: string,
    key: string,
    payload: Record<string, unknown>,
    orderId: string | null = null,
  ): Promise<{ job: JobRecord; created: boolean }> {
    const res = await this.enqueue(automation, key, payload, orderId)
    if (res.created) this.defer(() => this.runJob(res.job.id))
    return res
  }

  /** Claims and runs one job, if it is due and not held by its flag. */
  async runJob(id: string): Promise<RunOutcome> {
    const now = this.now()
    const job = await this.store.claim(id, now, new Date(now.getTime() + LEASE_MS))
    if (!job) return "not-claimed"
    if (!this.isRunnable(job.automation)) {
      // Flag is "off": give the claim back without counting it as an attempt.
      await this.store.release(job.id, new Date(now.getTime() + 60_000))
      return "held"
    }
    return this.execute(job)
  }

  /** Runs every due job (up to `limit`). Used by the scheduled runner. */
  async runDue(limit = 25): Promise<Record<RunOutcome, number>> {
    const counts: Record<RunOutcome, number> = {
      done: 0, retry: 0, dead: 0, "not-claimed": 0, held: 0, "unknown-automation": 0,
    }
    const automations = [...this.handlers.keys()].filter((a) => this.isRunnable(a))
    if (automations.length === 0) return counts
    const now = this.now()
    const jobs = await this.store.claimDue(automations, now, new Date(now.getTime() + LEASE_MS), limit)
    for (const job of jobs) {
      counts[await this.execute(job)] += 1
    }
    return counts
  }

  private async execute(job: JobRecord): Promise<RunOutcome> {
    const handler = this.handlers.get(job.automation)
    if (!handler) {
      await this.store.kill(job.id, job.state, `no handler for automation "${job.automation}"`)
      return "unknown-automation"
    }
    const maxAttempts = handler.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
    const started = Date.now()
    const log = (outcome: string, extra = "") =>
      this.logger.info(
        `[automation] name=${job.automation} key=${job.idempotency_key} attempt=${job.attempts} outcome=${outcome} ms=${Date.now() - started}${extra}`
      )

    let state: Record<string, unknown> | null = job.state ?? null
    const ctx: HandlerContext = {
      job,
      payload: job.payload ?? {},
      state,
      save: async (next) => {
        state = next
        await this.store.saveState(job.id, next)
      },
      enqueue: (automation, key, payload) => this.enqueueAndKick(automation, key, payload, job.order_id),
      alert: (a) => this.alertFn(a),
      logger: this.logger,
    }

    if (job.attempts > maxAttempts) {
      // Claimed again after its lease expired too often (repeated crashes).
      const error = "gave up: the job was abandoned mid-run too many times"
      await this.store.kill(job.id, state, error)
      log("dead", ` error="${error}"`)
      await this.alertFn(handler.describeFailure(job, error, true))
      return "dead"
    }

    try {
      const res = (await handler.run(ctx)) || {}
      if (res.state !== undefined) state = res.state
      await this.store.complete(job.id, state, res.result ?? null)
      log("done")
      return "done"
    } catch (err) {
      const error = errorMessage(err)
      const delay = isPermanent(err) ? null : retryDelayMs(job.attempts, maxAttempts)
      if (delay === null) {
        await this.store.kill(job.id, state, error)
        log("dead", ` error="${error}"`)
        await this.alertFn(handler.describeFailure({ ...job, last_error: error }, error, true))
        return "dead"
      }
      await this.store.reschedule(job.id, state, error, new Date(this.now().getTime() + delay))
      log("retry", ` next_in_ms=${delay} error="${error}"`)
      if (handler.alertAfterAttempts && job.attempts === handler.alertAfterAttempts) {
        await this.alertFn(handler.describeFailure({ ...job, last_error: error }, error, false))
      }
      return "retry"
    }
  }
}

function defaultId(): string {
  // Medusa-style prefixed id.
  return `autjob_${randomUUID().replace(/-/g, "")}`
}
