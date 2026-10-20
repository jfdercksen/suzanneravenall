import { describe, it, expect, vi } from 'vitest'
import { IntegrationError, type StaffAlert } from '@suzanne/integrations'
import { AutomationQueue } from '../../modules/automations/queue'
import { MemoryJobStore } from '../../modules/automations/memory-store'
import { MemoryCartRecoveryStore, PgCartRecoveryStore, type CartRecoveryStore } from '../../modules/automations/cart-recovery-store'
import type { RawSql } from '../../modules/automations/pg-store'
import {
  CART_RECOVERY_EMAIL,
  cartPayload,
  MAX_LATE_MS,
  cartRecoveryDelays,
  cartRecoveryEmailHandler,
  cartRecoveryMode,
  cartRecoverySchedule,
  nextSendAfter,
  recordCartActivity,
  reminderKey,
  scheduleDueReminders,
  sendCartReminderViaWeb,
  type CartSnapshot,
  type ReminderSendResult,
} from '../cart-recovery'
import { modeFor } from '../config'

const H = 3_600_000
const DELAYS: [number, number, number] = [1 * H, 23 * H, 48 * H]
const quiet = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

const T0 = new Date('2026-10-20T10:00:00Z')

function cart(overrides: Partial<CartSnapshot> = {}): CartSnapshot {
  return {
    id: 'cart_1',
    email: 'johan+k04@aiautomations.co.za',
    completed_at: null,
    currency_code: 'zar',
    total: 9900,
    billing_address: { first_name: 'Johan' },
    items: [{ id: 'li_1', title: 'Coaching', quantity: 1, unit_price: 9900 }],
    ...overrides,
  }
}

let seq = 0
const ids = () => `cartrec_${++seq}`

// ---------------------------------------------------------------------------

describe('flag and delays', () => {
  it('defaults the flag to n8n and maps the reminder job to it', () => {
    expect(cartRecoveryMode({})).toBe('n8n')
    expect(cartRecoveryMode({ AUTOMATION_CART_RECOVERY: 'code' })).toBe('code')
    expect(modeFor(CART_RECOVERY_EMAIL, { AUTOMATION_CART_RECOVERY: 'off' })).toBe('off')
    expect(modeFor(CART_RECOVERY_EMAIL, { AUTOMATION_CART_RECOVERY: 'code' })).toBe('code')
  })

  it('defaults the delays to 1 h, 23 h, 48 h', () => {
    expect(cartRecoveryDelays({})).toEqual(DELAYS)
  })

  it('reads compressed delays for the live test', () => {
    expect(cartRecoveryDelays({ CART_RECOVERY_DELAYS: '60s,120s,180s' })).toEqual([60_000, 120_000, 180_000])
    expect(cartRecoveryDelays({ CART_RECOVERY_DELAYS: ' 30m , 2h, 1d ' })).toEqual([30 * 60_000, 2 * H, 24 * H])
  })

  it('falls back to the default on a bad value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const bad of ['60s,120s', '1h,2h,3h,4h', '1x,2h,3h', '0s,1h,2h', 'abc']) {
      expect(cartRecoveryDelays({ CART_RECOVERY_DELAYS: bad })).toEqual(DELAYS)
    }
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('ticks every 10 minutes normally and every minute when compressed', () => {
    expect(cartRecoverySchedule({})).toBe('*/10 * * * *')
    expect(cartRecoverySchedule({ CART_RECOVERY_DELAYS: '60s,120s,180s' })).toBe('* * * * *')
  })

  it('schedules reminder 2 23 h after reminder 1, reminder 3 48 h after reminder 2, nothing after 3', () => {
    expect(nextSendAfter(1, T0, DELAYS)).toEqual(new Date(T0.getTime() + 23 * H))
    expect(nextSendAfter(2, T0, DELAYS)).toEqual(new Date(T0.getTime() + 48 * H))
    expect(nextSendAfter(3, T0, DELAYS)).toBeNull()
  })
})

// ---------------------------------------------------------------------------

describe('recordCartActivity (upsert on cart_id)', () => {
  it('starts a row at step 0, due 1 h after the activity', async () => {
    const store = new MemoryCartRecoveryStore()
    const { record, created } = await recordCartActivity(store, cart(), { now: T0, delays: DELAYS, newId: ids })
    expect(created).toBe(true)
    expect(record).toMatchObject({ cart_id: 'cart_1', step: 0, status: 'active', first_name: 'Johan' })
    expect(record.next_send_at).toEqual(new Date(T0.getTime() + H))
  })

  it('is idempotent: the same activity twice keeps one row and one schedule', async () => {
    const store = new MemoryCartRecoveryStore()
    await recordCartActivity(store, cart(), { now: T0, delays: DELAYS, newId: ids })
    const again = await recordCartActivity(store, cart(), { now: T0, delays: DELAYS, newId: ids })
    expect(again.created).toBe(false)
    expect(store.rows.size).toBe(1)
    expect(again.record.next_send_at).toEqual(new Date(T0.getTime() + H))
  })

  it('counts reminder 1 from the LAST activity while step is 0', async () => {
    const store = new MemoryCartRecoveryStore()
    await recordCartActivity(store, cart(), { now: T0, delays: DELAYS, newId: ids })
    const later = new Date(T0.getTime() + 40 * 60_000)
    const { record } = await recordCartActivity(store, cart({ email: 'new@example.com' }), { now: later, delays: DELAYS, newId: ids })
    expect(record.last_activity_at).toEqual(later)
    expect(record.next_send_at).toEqual(new Date(later.getTime() + H))
    expect(record.email).toBe('new@example.com')
  })

  it('does not move the schedule once a reminder has gone', async () => {
    const store = new MemoryCartRecoveryStore()
    await recordCartActivity(store, cart(), { now: T0, delays: DELAYS, newId: ids })
    const due2 = new Date(T0.getTime() + 24 * H)
    await store.markSent('cart_1', 1, due2)
    const { record } = await recordCartActivity(store, cart(), { now: new Date(T0.getTime() + 2 * H), delays: DELAYS, newId: ids })
    expect(record.step).toBe(1)
    expect(record.next_send_at).toEqual(due2)
  })

  it('reopens a row stopped because the cart was emptied, once it has items again', async () => {
    const store = new MemoryCartRecoveryStore()
    await recordCartActivity(store, cart(), { now: T0, delays: DELAYS, newId: ids })
    await store.finish('cart_1', 'stopped', 'cart_empty')
    const later = new Date(T0.getTime() + 24 * H)
    const { record } = await recordCartActivity(store, cart(), { now: later, delays: DELAYS, newId: ids })
    expect(record).toMatchObject({ status: 'active', stop_reason: null, step: 0 })
    expect(record.next_send_at).toEqual(new Date(later.getTime() + H))
  })

  it('never reopens a completed or stopped row', async () => {
    const store = new MemoryCartRecoveryStore()
    await recordCartActivity(store, cart(), { now: T0, delays: DELAYS, newId: ids })
    await store.finish('cart_1', 'completed', 'cart_completed')
    const { record } = await recordCartActivity(store, cart(), { now: new Date(T0.getTime() + H), delays: DELAYS, newId: ids })
    expect(record.status).toBe('completed')
    expect(record.next_send_at).toBeNull()
  })
})

// ---------------------------------------------------------------------------

function harness(opts: { carts?: Record<string, CartSnapshot | null>; send?: (template: number) => ReminderSendResult } = {}) {
  let now = T0
  const store = new MemoryCartRecoveryStore()
  const carts: Record<string, CartSnapshot | null> = opts.carts ?? { cart_1: cart() }
  const sent: Array<{ template: number; email: string; cartId: string }> = []
  const alerts: StaffAlert[] = []
  const background: Array<Promise<unknown>> = []
  const sendReminder = vi.fn(async (body: { template: 1 | 2 | 3; email: string; cartId: string }): Promise<ReminderSendResult> => {
    const res = opts.send ? opts.send(body.template) : { sent: true as const, emailId: `msg_${body.template}` }
    if (res.sent) sent.push({ template: body.template, email: body.email, cartId: body.cartId })
    return res
  })
  const loadCart = vi.fn(async (id: string) => {
    if (!(id in carts)) throw new Error('query failed')
    return carts[id] ?? null
  })
  const handler = cartRecoveryEmailHandler({
    store: () => store,
    loadCart,
    sendReminder,
    delays: () => DELAYS,
    now: () => now,
    logger: quiet,
  })
  const queue = new AutomationQueue({
    store: new MemoryJobStore(() => now),
    handlers: [handler],
    alert: async (a) => {
      alerts.push(a)
      return 'sent'
    },
    logger: quiet,
    now: () => now,
    defer: (fn) => {
      background.push(fn())
    },
  })
  const tick = async () => {
    const counts = await scheduleDueReminders(store, queue, { now, logger: quiet })
    while (background.length) await background.shift()
    return counts
  }
  return {
    store,
    queue,
    carts,
    sent,
    alerts,
    sendReminder,
    loadCart,
    tick,
    at: (ms: number) => {
      now = new Date(T0.getTime() + ms)
    },
    start: () => recordCartActivity(store, carts.cart_1 as CartSnapshot, { now: T0, delays: DELAYS, newId: ids }),
  }
}

describe('reminder sequence (job + outbox handler)', () => {
  it('sends nothing before reminder 1 is due', async () => {
    const h = harness()
    await h.start()
    h.at(59 * 60_000)
    expect(await h.tick()).toEqual({ enqueued: 0, pending: 0, stopped: 0 })
    expect(h.sent).toEqual([])
  })

  it('sends templates 1, 2 and 3 in order, then stops', async () => {
    const h = harness()
    await h.start()
    h.at(H)
    await h.tick()
    expect(h.sent.map((s) => s.template)).toEqual([1])
    expect((await h.store.get('cart_1'))?.next_send_at).toEqual(new Date(T0.getTime() + 24 * H))

    h.at(24 * H - 1)
    await h.tick()
    expect(h.sent).toHaveLength(1)

    h.at(24 * H)
    await h.tick()
    h.at(72 * H)
    await h.tick()
    expect(h.sent.map((s) => s.template)).toEqual([1, 2, 3])
    expect(h.sent[0]).toMatchObject({ email: 'johan+k04@aiautomations.co.za', cartId: 'cart_1' })

    const row = await h.store.get('cart_1')
    expect(row).toMatchObject({ step: 3, status: 'stopped', stop_reason: 'sequence_done', next_send_at: null })

    h.at(500 * H)
    await h.tick()
    expect(h.sent).toHaveLength(3)
  })

  it('a replayed tick sends no reminder twice', async () => {
    const h = harness()
    await h.start()
    h.at(H)
    await h.tick()
    await h.tick()
    await h.tick()
    expect(h.sent.map((s) => s.template)).toEqual([1])
  })

  it('stops as completed when the cart was ordered, before reminder 2', async () => {
    const h = harness()
    await h.start()
    h.at(H)
    await h.tick()
    h.carts.cart_1 = cart({ completed_at: '2026-10-20T12:00:00Z' })
    h.at(24 * H)
    await h.tick()
    h.at(72 * H)
    await h.tick()
    expect(h.sent.map((s) => s.template)).toEqual([1])
    expect(await h.store.get('cart_1')).toMatchObject({ status: 'completed', stop_reason: 'cart_completed' })
    expect(h.sendReminder).toHaveBeenCalledTimes(1)
  })

  it('stops when the cart is gone', async () => {
    const h = harness()
    await h.start()
    h.carts.cart_1 = null
    h.at(H)
    await h.tick()
    expect(h.sent).toEqual([])
    expect(await h.store.get('cart_1')).toMatchObject({ status: 'stopped', stop_reason: 'cart_not_found' })
  })

  it('stops when the cart was emptied', async () => {
    const h = harness()
    await h.start()
    h.carts.cart_1 = cart({ items: [] })
    h.at(H)
    await h.tick()
    expect(h.sent).toEqual([])
    expect(await h.store.get('cart_1')).toMatchObject({ status: 'stopped', stop_reason: 'cart_empty' })
  })

  it('stops when the route reports the address unsubscribed or the cart not found', async () => {
    for (const reason of ['unsubscribed', 'cart_not_found']) {
      const h = harness({ send: () => ({ sent: false, reason }) })
      await h.start()
      h.at(H)
      await h.tick()
      expect(await h.store.get('cart_1')).toMatchObject({ status: 'stopped', stop_reason: reason })
    }
  })

  it('marks completed when the route says the cart was ordered', async () => {
    const h = harness({ send: () => ({ sent: false, reason: 'cart_completed' }) })
    await h.start()
    h.at(H)
    await h.tick()
    expect(await h.store.get('cart_1')).toMatchObject({ status: 'completed' })
  })

  it('carries on with the sequence when the route says the reminder was already sent (n8n overlap)', async () => {
    const h = harness({ send: (t) => (t === 1 ? { sent: false, reason: 'already_sent' } : { sent: true }) })
    await h.start()
    h.at(H)
    await h.tick()
    expect(await h.store.get('cart_1')).toMatchObject({ step: 1, status: 'active' })
    h.at(24 * H)
    await h.tick()
    expect(h.sent.map((s) => s.template)).toEqual([2])
  })

  it('retries through the outbox when the cart status is unknown, and sends once it is known', async () => {
    let unknown = true
    const h = harness({ send: () => (unknown ? { sent: false, reason: 'cart_unknown' } : { sent: true }) })
    await h.start()
    h.at(H)
    expect(await h.tick()).toMatchObject({ enqueued: 1 })
    expect(await h.store.get('cart_1')).toMatchObject({ step: 0, status: 'active' })

    // Next tick while the job waits for its retry: no second job.
    h.at(H + 30_000)
    expect(await h.tick()).toMatchObject({ enqueued: 0, pending: 1 })

    unknown = false
    h.at(H + 61_000)
    await h.queue.runDue()
    expect(h.sent.map((s) => s.template)).toEqual([1])
    expect(await h.store.get('cart_1')).toMatchObject({ step: 1 })
  })

  it('retries a Query failure, then stops the sequence when the outbox gives up', async () => {
    const h = harness({ carts: {} })
    await recordCartActivity(h.store, cart(), { now: T0, delays: DELAYS, newId: ids })
    h.at(H)
    await h.tick()
    // Six attempts over 1 min, 5 min, 30 min, 2 h, 12 h.
    for (const t of [H + 61_000, H + 7 * 60_000, H + 40 * 60_000, 4 * H, 17 * H]) {
      h.at(t)
      await h.queue.runDue()
    }
    expect(h.alerts.at(-1)?.subject).toContain('Cart reminder 1 not sent')
    h.at(18 * H)
    expect(await h.tick()).toMatchObject({ stopped: 1 })
    expect(await h.store.get('cart_1')).toMatchObject({ status: 'stopped', stop_reason: 'send_failed' })
  })

  it('skips a reminder whose time was pushed by new activity, and sends it at the new time', async () => {
    const h = harness()
    await h.start()
    h.at(H)
    const job = await h.queue.enqueue(CART_RECOVERY_EMAIL, reminderKey({ cart_id: 'cart_1', step: 0, next_send_at: new Date(T0.getTime() + H) }), {
      cartId: 'cart_1',
      template: 1,
      dueAt: new Date(T0.getTime() + H).toISOString(),
    })
    // Customer comes back just before the queued job runs.
    await recordCartActivity(h.store, cart(), { now: new Date(T0.getTime() + H), delays: DELAYS, newId: ids })
    h.at(H + 1)
    expect(await h.queue.runJob(job.job.id)).toBe('done')
    expect(h.sent).toEqual([])
    h.at(2 * H)
    await h.tick()
    expect(h.sent.map((s) => s.template)).toEqual([1])
  })

  it('does not send a reminder that is more than a day late (outage or old backlog), and stops', async () => {
    const h = harness()
    await h.start()
    h.at(H + MAX_LATE_MS + 1)
    await h.tick()
    expect(h.sent).toEqual([])
    expect(await h.store.get('cart_1')).toMatchObject({ status: 'stopped', stop_reason: 'too_late' })
  })

  it('treats a bad job payload as permanent', async () => {
    const h = harness()
    const { job } = await h.queue.enqueue(CART_RECOVERY_EMAIL, 'bad', { cartId: 'cart_1', template: 7 })
    expect(await h.queue.runJob(job.id)).toBe('dead')
  })
})

// ---------------------------------------------------------------------------

describe('cartPayload', () => {
  it('turns non-numeric prices and quantities into plain numbers the route accepts', () => {
    const body = cartPayload(
      cart({ total: null, items: [{ id: 'li_1', title: 'T', quantity: 'x', unit_price: { value: 'n/a' } as unknown as number }] }),
      { NEXT_PUBLIC_SITE_URL: 'https://example.test/' }
    )
    expect(body.items[0]).toMatchObject({ quantity: 1, unit_price: 0 })
    expect(body.total).toBe(0)
    expect(body.cartUrl).toBe('https://example.test/checkout?cartId=cart_1')
  })
})

describe('sendCartReminderViaWeb', () => {
  const body = { cartId: 'cart_1', template: 1 }
  const env = { WEB_BASE_URL: 'http://web:3000/', INTERNAL_WEBHOOK_SECRET: 's3cret' }

  it('posts to the route with the secret and reads the email id', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ emailId: 'msg_1' }), { status: 200 }))
    expect(await sendCartReminderViaWeb(body, env, fetchImpl)).toEqual({ sent: true, emailId: 'msg_1' })
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://web:3000/api/email/cart-abandonment')
    expect((init.headers as Record<string, string>)['x-webhook-secret']).toBe('s3cret')
  })

  it('returns the skip reason', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ skipped: true, reason: 'already_sent' }), { status: 200 }))
    expect(await sendCartReminderViaWeb(body, env, fetchImpl)).toEqual({ sent: false, reason: 'already_sent' })
  })

  it('fails permanently without calling the route when no secret is set', async () => {
    const fetchImpl = vi.fn()
    await expect(sendCartReminderViaWeb(body, { WEB_BASE_URL: 'http://web:3000' }, fetchImpl)).rejects.toThrow(/unset/)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('throws a permanent error on 401 and a retriable one on 5xx', async () => {
    const r401 = vi.fn(async () => new Response('{}', { status: 401 }))
    await expect(sendCartReminderViaWeb(body, env, r401)).rejects.toMatchObject({ status: 401, retriable: false })
    const r500 = vi.fn(async () => new Response('{}', { status: 500 }))
    const err = await sendCartReminderViaWeb(body, env, r500).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(IntegrationError)
    expect((err as IntegrationError).status).toBe(500)
  }, 10_000)
})

// ---------------------------------------------------------------------------

describe('PgCartRecoveryStore SQL', () => {
  function fakeDb(responses: Array<Record<string, unknown>[]> = []) {
    const calls: Array<{ sql: string; bindings: unknown[] }> = []
    const db: RawSql = {
      async raw(sql, bindings = []) {
        calls.push({ sql, bindings })
        const placeholders = (sql.match(/\?/g) ?? []).length
        if (placeholders !== bindings.length) throw new Error(`placeholder/binding mismatch: ${placeholders} vs ${bindings.length}`)
        return { rows: responses.shift() ?? [] }
      },
    }
    return { db, calls }
  }

  const row = {
    id: 'cartrec_1',
    cart_id: 'cart_1',
    email: 'a@b.co',
    first_name: null,
    step: '0',
    next_send_at: '2026-10-20T11:00:00Z',
    last_activity_at: new Date('2026-10-20T10:00:00Z'),
    status: 'active',
    stop_reason: null,
    created_at: new Date(),
    updated_at: new Date(),
  }

  it('upserts on cart_id and reports whether the row is new', async () => {
    const { db, calls } = fakeDb([[{ ...row, inserted: true }]])
    const store: CartRecoveryStore = new PgCartRecoveryStore(db)
    const res = await store.recordActivity({ id: 'cartrec_1', cartId: 'cart_1', email: 'a@b.co', firstName: null, now: T0, firstSendAt: new Date(T0.getTime() + H) })
    expect(res.created).toBe(true)
    expect(res.record.step).toBe(0)
    expect(res.record.next_send_at).toEqual(new Date('2026-10-20T11:00:00Z'))
    expect(calls[0].sql).toContain('ON CONFLICT (cart_id) DO UPDATE')
    expect(calls[0].sql).toContain("cart_recovery.status = 'active' AND cart_recovery.step = 0")
  })

  it('only advances from the expected step', async () => {
    const { db, calls } = fakeDb([[{ id: 'cartrec_1' }], []])
    const store = new PgCartRecoveryStore(db)
    expect(await store.markSent('cart_1', 2, new Date())).toBe(true)
    expect(calls[0].bindings.slice(-2)).toEqual(['cart_1', 1])
    expect(await store.markSent('cart_1', 3, null)).toBe(false)
  })

  it('lists only active due rows', async () => {
    const { db, calls } = fakeDb([[row]])
    const store = new PgCartRecoveryStore(db)
    const due = await store.listDue(T0, 10)
    expect(due[0].cart_id).toBe('cart_1')
    expect(calls[0].sql).toContain("status = 'active' AND next_send_at <= ?")
  })
})
