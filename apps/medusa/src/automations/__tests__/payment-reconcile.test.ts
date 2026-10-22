import { describe, it, expect, vi } from 'vitest'
import type { StaffAlert } from '@suzanne/integrations'
import { AutomationQueue } from '../../modules/automations/queue'
import { MemoryJobStore } from '../../modules/automations/memory-store'
import type { RawSql } from '../../modules/automations/pg-store'
import {
  PAYMENT_RECONCILE,
  RECONCILE_MIN_AGE_MS,
  RECONCILE_WINDOW_MS,
  findStuckPayments,
  paymentReconcileHandler,
  paymentReconcileMode,
  reconcileCart,
  reconcileKey,
  reconcileStuckPayments,
  type OrderCheck,
  type ReconcileDeps,
  type StuckPayment,
} from '../payment-reconcile'
import { modeFor } from '../config'

const quiet = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
const NOW = new Date('2026-10-22T10:00:00Z')

// #418 as it sat on the review box: PayPal captured, order row, no payment.
function stuck418(overrides: Partial<StuckPayment> = {}): StuckPayment {
  return {
    sessionId: 'payses_418',
    providerId: 'pp_paypal_paypal',
    collectionId: 'pay_col_418',
    cartId: 'cart_01M5EYB2TTWV99QPDH42NM6HXP',
    cartCompletedAt: '2026-10-21T11:36:35.563Z',
    orderId: 'order_418',
    orderDisplayId: 418,
    amount: 2000,
    currencyCode: 'usd',
    gatewayRef: '18G91680HK3897214',
    updatedAt: '2026-10-22T09:50:00.000Z',
    ...overrides,
  }
}

const noOrder = () => stuck418({ cartCompletedAt: null, orderId: null, orderDisplayId: null })

type HarnessOpts = {
  stillStuckAfterRepair?: boolean
  order?: OrderCheck | null
  /** completeCart throws this message (a lock conflict is retried, anything else alerts). */
  completeError?: string
  resolvedBefore?: boolean
  /** recheck throws this many times first (a database hiccup). */
  recheckFailures?: number
  /** emitOrderPlaced throws this many times first. */
  emitFailures?: number
}

function harness(opts: HarnessOpts = {}) {
  const alerts: StaffAlert[] = []
  let repaired = false
  let recheckFailures = opts.recheckFailures ?? 0
  let emitFailures = opts.emitFailures ?? 0
  let current = stuck418()
  let now = NOW
  const deps: ReconcileDeps = {
    recheck: vi.fn(async (sessionId: string) => {
      if (recheckFailures > 0) {
        recheckFailures -= 1
        throw new Error('connection terminated unexpectedly')
      }
      if (opts.resolvedBefore) return null
      if (repaired && !opts.stillStuckAfterRepair) return null
      return sessionId === 'payses_418' ? current : null
    }),
    loadOrder: vi.fn(async () =>
      opts.order === undefined ? { id: 'order_418', status: 'pending', total: 2000, currencyCode: 'usd' } : opts.order
    ),
    completeCart: vi.fn(async () => {
      if (opts.completeError) throw new Error(opts.completeError)
      repaired = true
    }),
    authorizeSession: vi.fn(async () => {
      repaired = true
    }),
    recordOrderTransactions: vi.fn(async () => {}),
    paidAmount: vi.fn(async () => (repaired && !opts.stillStuckAfterRepair ? 2000 : 0)),
    emitOrderPlaced: vi.fn(async () => {
      if (emitFailures > 0) {
        emitFailures -= 1
        throw new Error('event bus unavailable')
      }
    }),
    sentry: vi.fn(async () => 'sent'),
    logger: quiet,
  }
  const store = new MemoryJobStore(() => now)
  const queue = new AutomationQueue({
    store,
    handlers: [paymentReconcileHandler(deps)],
    alert: async (a) => {
      alerts.push(a)
      return 'sent'
    },
    logger: quiet,
    now: () => now,
    defer: () => {},
  })
  return {
    deps,
    queue,
    store,
    alerts,
    setCurrent: (p: StuckPayment) => (current = p),
    /** Moves the clock on and runs every job that is due, as the minute runner does. */
    runLater: async (ms: number) => {
      now = new Date(now.getTime() + ms)
      return queue.runDue(10)
    },
  }
}

const MIN = 60_000

describe('paymentReconcileMode', () => {
  it('is on (code) by default and can be switched off', () => {
    expect(paymentReconcileMode({})).toBe('code')
    expect(paymentReconcileMode({ AUTOMATION_PAYMENT_RECONCILE: 'off' })).toBe('off')
    expect(modeFor(PAYMENT_RECONCILE, {})).toBe('code')
    expect(modeFor(PAYMENT_RECONCILE, { AUTOMATION_PAYMENT_RECONCILE: 'off' })).toBe('off')
  })
})

describe('findStuckPayments', () => {
  it('asks for payments older than the minimum age inside the window and maps the row', async () => {
    const raw = vi.fn(async () => ({
      rows: [
        {
          session_id: 'payses_418',
          provider_id: 'pp_paypal_paypal',
          payment_collection_id: 'pay_col_418',
          amount: '2000',
          currency_code: 'USD',
          updated_at: new Date('2026-10-21T11:36:31.342Z'),
          gateway_ref: '18G91680HK3897214',
          cart_id: 'cart_1',
          completed_at: new Date('2026-10-21T11:36:35.563Z'),
          order_id: 'order_418',
          display_id: 418,
        },
      ],
    }))
    const rows = await findStuckPayments({ raw } as unknown as RawSql, { now: NOW, minAgeMs: RECONCILE_MIN_AGE_MS, cartId: 'cart_1' })
    const [sql, bindings] = raw.mock.calls[0] as unknown as [string, unknown[]]
    expect(sql).toContain("ps.data->>'status' IN ('authorized', 'captured')")
    expect(sql).toContain('NOT EXISTS (SELECT 1 FROM payment p WHERE p.payment_session_id = ps.id')
    expect(sql).toContain("o.status <> 'canceled'")
    expect(sql).toContain('AND cpc.cart_id = ?')
    expect(bindings).toEqual([
      new Date(NOW.getTime() - RECONCILE_MIN_AGE_MS),
      new Date(NOW.getTime() - RECONCILE_WINDOW_MS),
      'cart_1',
    ])
    expect(rows).toEqual([
      {
        sessionId: 'payses_418',
        providerId: 'pp_paypal_paypal',
        collectionId: 'pay_col_418',
        cartId: 'cart_1',
        cartCompletedAt: '2026-10-21T11:36:35.563Z',
        orderId: 'order_418',
        orderDisplayId: 418,
        amount: 2000,
        currencyCode: 'usd',
        gatewayRef: '18G91680HK3897214',
        updatedAt: '2026-10-21T11:36:31.342Z',
      },
    ])
  })
})

describe('payment reconcile job', () => {
  it('recovers an order without its payment: payment, capture transaction, paid check, one order.placed', async () => {
    const h = harness()
    const res = await reconcileStuckPayments([stuck418()], h.queue)
    expect(res).toEqual({ found: 1, attempted: 1, outcomes: ['done'] })
    expect(h.deps.authorizeSession).toHaveBeenCalledWith('payses_418')
    expect(h.deps.recordOrderTransactions).toHaveBeenCalledWith('order_418', 'payses_418')
    expect(h.deps.paidAmount).toHaveBeenCalledWith('order_418')
    expect(h.deps.emitOrderPlaced).toHaveBeenCalledTimes(1)
    expect(h.deps.emitOrderPlaced).toHaveBeenCalledWith('order_418')
    expect(h.deps.completeCart).not.toHaveBeenCalled()
    expect(h.alerts).toEqual([])
    expect(h.deps.sentry).toHaveBeenCalledWith(expect.objectContaining({ level: 'warning' }))
  })

  it('recovers a captured cart that never became an order by completing it once', async () => {
    const h = harness()
    h.setCurrent(noOrder())
    const res = await reconcileStuckPayments([noOrder()], h.queue)
    expect(res.outcomes).toEqual(['done'])
    expect(h.deps.completeCart).toHaveBeenCalledTimes(1)
    expect(h.deps.completeCart).toHaveBeenCalledWith('cart_01M5EYB2TTWV99QPDH42NM6HXP')
    expect(h.deps.authorizeSession).not.toHaveBeenCalled()
    expect(h.alerts).toEqual([])
  })

  it('alerts staff with cart, order, gateway reference and amount when the completion fails', async () => {
    const h = harness({ completeError: 'Payment session payses_418 not found' })
    h.setCurrent(noOrder())
    const res = await reconcileStuckPayments([noOrder()], h.queue)
    expect(res.outcomes).toEqual(['dead'])
    expect(h.deps.completeCart).toHaveBeenCalledTimes(1)
    expect(h.alerts).toHaveLength(1)
    const text = [h.alerts[0].subject, ...h.alerts[0].lines].join('\n')
    expect(h.alerts[0].subject).toBe('Paid order not completed: USD 20.00 via PayPal')
    expect(text).toContain('cart_01M5EYB2TTWV99QPDH42NM6HXP')
    expect(text).toContain('18G91680HK3897214')
    expect(text).toContain('Order: none was created')
    expect(text).toContain('Payment session payses_418 not found')
    expect(h.deps.sentry).toHaveBeenCalledWith(expect.objectContaining({ level: 'error', tags: expect.objectContaining({ outcome: 'alerted' }) }))
  })

  it('waits for a run still holding the cart lock instead of alerting, then completes once', async () => {
    const h = harness({ completeError: 'Cart is already being completed by another request' })
    h.setCurrent(noOrder())
    expect((await reconcileStuckPayments([noOrder()], h.queue)).outcomes).toEqual(['retry'])
    expect(h.alerts).toEqual([])
    expect(h.deps.sentry).not.toHaveBeenCalled()
    expect((await h.store.getByKey(reconcileKey('payses_418')))?.state).toEqual({ completeAttempted: false })
    // The lock is gone a minute later; the retry completes the cart.
    ;(h.deps.completeCart as ReturnType<typeof vi.fn>).mockImplementationOnce(async () => {})
    ;(h.deps.recheck as ReturnType<typeof vi.fn>).mockResolvedValueOnce(noOrder()).mockResolvedValueOnce(null)
    const later = await h.runLater(MIN)
    expect(later.done).toBe(1)
    expect(h.deps.completeCart).toHaveBeenCalledTimes(2)
    expect(h.alerts).toEqual([])
  })

  it('retries a read that failed and alerts only after three attempts', async () => {
    const recovered = harness({ recheckFailures: 1 })
    expect((await reconcileStuckPayments([stuck418()], recovered.queue)).outcomes).toEqual(['retry'])
    expect((await recovered.runLater(MIN)).done).toBe(1)
    expect(recovered.alerts).toEqual([])

    const broken = harness({ recheckFailures: 10 })
    await reconcileStuckPayments([stuck418()], broken.queue)
    await broken.runLater(MIN)
    expect(broken.alerts).toEqual([])
    expect((await broken.runLater(5 * MIN)).dead).toBe(1)
    expect(broken.alerts).toHaveLength(1)
    expect(broken.deps.sentry).toHaveBeenCalledTimes(1)
    expect(broken.deps.authorizeSession).not.toHaveBeenCalled()
  })

  it('resumes after a failure part-way without repeating a step', async () => {
    const h = harness({ emitFailures: 1 })
    expect((await reconcileStuckPayments([stuck418()], h.queue)).outcomes).toEqual(['retry'])
    expect((await h.store.getByKey(reconcileKey('payses_418')))?.state).toEqual({ authorized: true, recorded: true })
    expect((await h.runLater(MIN)).done).toBe(1)
    expect(h.deps.authorizeSession).toHaveBeenCalledTimes(1)
    expect(h.deps.recordOrderTransactions).toHaveBeenCalledTimes(1)
    expect(h.deps.emitOrderPlaced).toHaveBeenCalledTimes(2)
    expect(h.alerts).toEqual([])
  })

  it('does not record a payment whose amount differs from the order, and alerts', async () => {
    const h = harness({ order: { id: 'order_418', status: 'pending', total: 2500, currencyCode: 'usd' } })
    const res = await reconcileStuckPayments([stuck418()], h.queue)
    expect(res.outcomes).toEqual(['dead'])
    expect(h.deps.authorizeSession).not.toHaveBeenCalled()
    expect(h.deps.emitOrderPlaced).not.toHaveBeenCalled()
    expect(h.alerts[0].lines.join('\n')).toContain('Order: #418 (order_418)')
    expect(h.alerts[0].lines.join('\n')).toContain('amounts differ')
  })

  it('alerts when a completed cart has no order instead of completing it again', async () => {
    const h = harness()
    h.setCurrent(stuck418({ orderId: null, orderDisplayId: null }))
    const res = await reconcileStuckPayments([stuck418({ orderId: null })], h.queue)
    expect(res.outcomes).toEqual(['dead'])
    expect(h.deps.completeCart).not.toHaveBeenCalled()
    expect(h.alerts).toHaveLength(1)
  })

  it('alerts, without sending order.placed, when the order still does not read as paid', async () => {
    const h = harness({ stillStuckAfterRepair: true })
    const res = await reconcileStuckPayments([stuck418()], h.queue)
    expect(res.outcomes).toEqual(['dead'])
    expect(h.deps.emitOrderPlaced).not.toHaveBeenCalled()
    expect(h.alerts[0].lines.join('\n')).toContain('does not read as paid')
  })

  it('does nothing for a payment already resolved or an order already canceled', async () => {
    const resolved = harness({ resolvedBefore: true })
    expect((await reconcileStuckPayments([stuck418()], resolved.queue)).outcomes).toEqual(['done'])
    expect(resolved.deps.authorizeSession).not.toHaveBeenCalled()

    const canceled = harness({ order: { id: 'order_418', status: 'canceled', total: 2000, currencyCode: 'usd' } })
    expect((await reconcileStuckPayments([stuck418()], canceled.queue)).outcomes).toEqual(['done'])
    expect(canceled.deps.authorizeSession).not.toHaveBeenCalled()
    expect(canceled.alerts).toEqual([])
  })

  it('handles a stuck payment once: the next sweep neither repairs nor alerts again', async () => {
    const h = harness({ completeError: 'Payment session payses_418 not found' })
    h.setCurrent(noOrder())
    await reconcileStuckPayments([noOrder()], h.queue)
    const again = await reconcileStuckPayments([noOrder()], h.queue)
    expect(again).toEqual({ found: 1, attempted: 0, outcomes: [] })
    expect(h.deps.completeCart).toHaveBeenCalledTimes(1)
    expect(h.alerts).toHaveLength(1)
    expect((await h.store.getByKey(reconcileKey('payses_418')))?.status).toBe('dead')
  })
})

describe('reconcileCart (late PayPal webhook)', () => {
  it('is clear when the cart has no stuck payment', async () => {
    const h = harness()
    expect(await reconcileCart({ find: async () => [], queue: h.queue, now: () => NOW })).toBe('clear')
  })

  it('asks for a retry while the payment is under five minutes old', async () => {
    const h = harness()
    const young = stuck418({ updatedAt: new Date(NOW.getTime() - 4 * MIN).toISOString() })
    expect(await reconcileCart({ find: async () => [young], queue: h.queue, now: () => NOW })).toBe('pending')
    expect(h.deps.authorizeSession).not.toHaveBeenCalled()
  })

  it('repairs an older stuck payment and reports recovered, then alerted for a failed one', async () => {
    const ok = harness()
    expect(await reconcileCart({ find: async () => [stuck418()], queue: ok.queue, now: () => NOW })).toBe('recovered')
    expect(ok.deps.emitOrderPlaced).toHaveBeenCalledTimes(1)
    // A second event for the same cart finds the job done and repairs nothing.
    expect(await reconcileCart({ find: async () => [stuck418()], queue: ok.queue, now: () => NOW })).toBe('recovered')
    expect(ok.deps.emitOrderPlaced).toHaveBeenCalledTimes(1)

    const bad = harness({ order: { id: 'order_418', status: 'pending', total: 1, currencyCode: 'usd' } })
    expect(await reconcileCart({ find: async () => [stuck418()], queue: bad.queue, now: () => NOW })).toBe('alerted')
    expect(await reconcileCart({ find: async () => [stuck418()], queue: bad.queue, now: () => NOW })).toBe('alerted')
    expect(bad.alerts).toHaveLength(1)
  })
})
