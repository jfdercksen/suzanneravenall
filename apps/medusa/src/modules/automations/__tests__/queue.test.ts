import { describe, it, expect, vi } from 'vitest'
import { IntegrationError, type StaffAlert } from '@suzanne/integrations'
import {
  AutomationQueue,
  DEFAULT_MAX_ATTEMPTS,
  isPermanent,
  LEASE_MS,
  PermanentError,
  retryDelayMs,
  RETRY_DELAYS_MS,
  type AutomationHandler,
} from '../queue'
import { MemoryJobStore } from '../memory-store'

const quiet = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

function setup(run: AutomationHandler['run'], extra: Partial<AutomationHandler> = {}, isRunnable = (_a: string) => true) {
  let now = new Date('2026-10-06T10:00:00Z')
  const store = new MemoryJobStore(() => now)
  const alerts: StaffAlert[] = []
  const background: Array<Promise<unknown>> = []
  const handler: AutomationHandler = {
    name: 'test_job',
    run,
    describeFailure: (job, error, final) => ({ key: 'test', subject: `${final ? 'dead' : 'still failing'} ${job.idempotency_key}`, lines: [error] }),
    ...extra,
  }
  const queue = new AutomationQueue({
    store,
    handlers: [handler],
    alert: async (a) => {
      alerts.push(a)
      return 'sent'
    },
    logger: quiet,
    now: () => now,
    isRunnable,
    defer: (fn) => {
      background.push(fn())
    },
  })
  return {
    store,
    queue,
    alerts,
    advance: (ms: number) => {
      now = new Date(now.getTime() + ms)
    },
    flush: async () => {
      while (background.length) await background.shift()
    },
  }
}

describe('retry policy', () => {
  it('backs off 1 min, 5 min, 30 min, 2 h, 12 h, then stops', () => {
    expect([1, 2, 3, 4, 5].map((a) => retryDelayMs(a))).toEqual([...RETRY_DELAYS_MS])
    expect(retryDelayMs(6)).toBeNull()
    expect(DEFAULT_MAX_ATTEMPTS).toBe(6)
  })

  it('4xx (except 408/429) and PermanentError are permanent; 5xx, 429, timeouts and unknown errors are not', () => {
    expect(isPermanent(new PermanentError('x'))).toBe(true)
    expect(isPermanent(new IntegrationError('x', { system: 's', status: 422 }))).toBe(true)
    expect(isPermanent(new IntegrationError('x', { system: 's', status: 429 }))).toBe(false)
    expect(isPermanent(new IntegrationError('x', { system: 's', status: 503 }))).toBe(false)
    expect(isPermanent(new IntegrationError('x', { system: 's', code: 'TIMEOUT' }))).toBe(false)
    expect(isPermanent(new Error('boom'))).toBe(false)
  })
})

describe('AutomationQueue', () => {
  it('enqueue is idempotent per key: the same order step twice runs once', async () => {
    const run = vi.fn(async () => ({ result: 'ok' }))
    const t = setup(run)
    const a = await t.queue.enqueueAndKick('test_job', 'test_job:order_1', { n: 1 }, 'order_1')
    const b = await t.queue.enqueueAndKick('test_job', 'test_job:order_1', { n: 2 }, 'order_1')
    await t.flush()
    expect(a.created).toBe(true)
    expect(b.created).toBe(false)
    expect(b.job.id).toBe(a.job.id)
    expect(run).toHaveBeenCalledTimes(1)
    expect(t.store.all()).toHaveLength(1)
    expect(t.store.all()[0]).toMatchObject({ status: 'done', result: 'ok', attempts: 1, payload: { n: 1 } })
    // A finished job is never claimed again.
    expect(await t.queue.runJob(a.job.id)).toBe('not-claimed')
  })

  it('unknown automation names are refused at enqueue', async () => {
    const t = setup(async () => {})
    await expect(t.queue.enqueue('nope', 'k', {})).rejects.toThrow(/Unknown automation/)
  })

  it('a failure is retried on the backoff schedule and keeps the saved state', async () => {
    let calls = 0
    const run: AutomationHandler['run'] = async (ctx) => {
      calls += 1
      const seen = (ctx.state?.seen as number[] | undefined) ?? []
      await ctx.save({ seen: [...seen, calls] })
      if (calls < 3) throw new Error(`outage ${calls}`)
      return { result: { calls } }
    }
    const t = setup(run)
    const { job } = await t.queue.enqueue('test_job', 'k1', {})
    expect(await t.queue.runJob(job.id)).toBe('retry')
    let stored = t.store.all()[0]!
    expect(stored).toMatchObject({ status: 'pending', attempts: 1, last_error: 'outage 1' })
    expect(stored.next_attempt_at.getTime() - Date.parse('2026-10-06T10:00:00Z')).toBe(60_000)

    // Not due yet.
    expect(await t.queue.runDue()).toMatchObject({ done: 0, retry: 0 })
    t.advance(60_000)
    expect(await t.queue.runDue()).toMatchObject({ retry: 1 })
    stored = t.store.all()[0]!
    expect(stored.attempts).toBe(2)
    expect(stored.next_attempt_at.getTime() - (Date.parse('2026-10-06T10:00:00Z') + 60_000)).toBe(5 * 60_000)

    t.advance(5 * 60_000)
    expect(await t.queue.runDue()).toMatchObject({ done: 1 })
    stored = t.store.all()[0]!
    expect(stored).toMatchObject({ status: 'done', attempts: 3, state: { seen: [1, 2, 3] }, last_error: null })
  })

  it('dead after the last attempt, with exactly one final alert', async () => {
    const t = setup(async () => {
      throw new Error('Thinkific down')
    }, { alertAfterAttempts: 3 })
    const { job } = await t.queue.enqueue('test_job', 'k2', {})
    await t.queue.runJob(job.id)
    for (const delay of RETRY_DELAYS_MS) {
      t.advance(delay)
      await t.queue.runDue()
    }
    const stored = t.store.all()[0]!
    expect(stored).toMatchObject({ status: 'dead', attempts: 6, last_error: 'Thinkific down' })
    expect(t.alerts.map((a) => a.subject)).toEqual(['still failing k2', 'dead k2'])
    // Dead jobs are never picked up again.
    t.advance(24 * 3_600_000)
    expect(await t.queue.runDue()).toMatchObject({ done: 0, retry: 0, dead: 0 })
  })

  it('a permanent error goes dead at once', async () => {
    const t = setup(async () => {
      throw new IntegrationError('Thinkific POST /users: HTTP 422', { system: 'thinkific', status: 422 })
    })
    const { job } = await t.queue.enqueue('test_job', 'k3', {})
    expect(await t.queue.runJob(job.id)).toBe('dead')
    expect(t.alerts).toHaveLength(1)
  })

  it('a job left running by a crashed process is claimed again after its lease', async () => {
    const run = vi.fn(async () => ({ result: 'ok' }))
    const t = setup(run)
    const { job } = await t.queue.enqueue('test_job', 'k4', {})
    // Simulate a crash: claimed, never finished.
    await t.store.claim(job.id, new Date('2026-10-06T10:00:00Z'), new Date(Date.parse('2026-10-06T10:00:00Z') + LEASE_MS))
    expect(await t.queue.runDue()).toMatchObject({ done: 0 })
    t.advance(LEASE_MS + 1)
    expect(await t.queue.runDue()).toMatchObject({ done: 1 })
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('flag "off": jobs are held, not run and not failed', async () => {
    let runnable = false
    const run = vi.fn(async () => ({}))
    const t = setup(run, {}, () => runnable)
    const { job } = await t.queue.enqueue('test_job', 'k5', {})
    expect(await t.queue.runJob(job.id)).toBe('held')
    expect(await t.queue.runDue()).toMatchObject({ done: 0 })
    expect(t.store.all()[0]).toMatchObject({ status: 'pending', attempts: 0 })
    runnable = true
    t.advance(60_000)
    expect(await t.queue.runDue()).toMatchObject({ done: 1 })
  })

  it('emails in errors are masked before they are stored (POPIA)', async () => {
    const t = setup(async () => {
      throw new Error('no contact for buyer@example.com')
    })
    const { job } = await t.queue.enqueue('test_job', 'k6', {})
    await t.queue.runJob(job.id)
    expect(t.store.all()[0]!.last_error).toBe('no contact for b***@example.com')
  })

  it('ctx.enqueue queues a follow-up job and starts it', async () => {
    let n = 0
    const t = setup(async (ctx) => {
      n += 1
      if (n === 1) await ctx.enqueue('test_job', 'follow-up', { from: ctx.job.idempotency_key })
      return { result: n }
    })
    const { job } = await t.queue.enqueue('test_job', 'parent', {}, 'order_9')
    await t.queue.runJob(job.id)
    await t.flush()
    const jobs = t.store.all()
    expect(jobs.map((j) => [j.idempotency_key, j.status, j.order_id])).toEqual([
      ['parent', 'done', 'order_9'],
      ['follow-up', 'done', 'order_9'],
    ])
  })
})
