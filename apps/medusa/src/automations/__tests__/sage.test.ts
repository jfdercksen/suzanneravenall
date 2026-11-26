import { describe, it, expect, vi } from 'vitest'
import type { StaffAlert } from '@suzanne/integrations'
import { AutomationQueue } from '../../modules/automations/queue'
import { MemoryJobStore } from '../../modules/automations/memory-store'
import { SageClient } from '../../modules/sage/client'
import { sageConfigFromEnv } from '../../modules/sage/config'
import { BasicAuth } from '../../modules/sage/auth'
import { SageConfigError } from '../../modules/sage/errors'
import { ItemResolver } from '../../modules/sage/resolvers'
import { MemoryCustomerMapStore, MemoryItemCacheStore } from '../../modules/sage/store'
import { buildSageOrderSnapshot } from '../../modules/sage/invoice'
import { mergeOrderMetadata, sageInvoiceHandler, type SageDeps } from '../sage'
import { dispatchSageInvoice } from '../dispatch'
import { sweepSageInvoices, SWEEP_GRACE_MS } from '../sweep'
import { modeFor, sageMode, SAGE_INVOICE } from '../config'

const quiet = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
const T0 = new Date('2026-11-26T10:00:00Z')

const graphOrder = (over: Record<string, unknown> = {}) => ({
  id: 'order_01QA',
  display_id: 412,
  currency_code: 'zar',
  total: { numeric: 150000 },
  created_at: '2026-11-26T08:00:00.000Z',
  email: 'ann@example.com',
  customer: { email: null },
  billing_address: { first_name: 'Ann', last_name: 'Lee' },
  items: [
    { title: 'Course', quantity: 1, unit_price: { numeric: 150000 }, variant: { title: 'Default', metadata: { sage_item_code: 'RC-1' }, product: { title: 'Rapid Course' } } },
  ],
  ...over,
})

type Sage = { invoices: Array<{ ID: number; DocumentNumber: string; Reference: string }>; customers: Array<{ ID: number; Email: string }>; items: Array<{ ID: number; Code: string }> }

// Sage answers shape to be replaced by a recorded sandbox answer.
function setup(opts: { env?: Record<string, string>; sage?: Partial<Sage>; failPostTimes?: number; postStatus?: number; clock?: () => number; invoiceAppearsAfterFirstLookup?: boolean } = {}) {
  const env = { SAGE_TAX_TYPE_ID: '4', SAGE_INCOME_ACCOUNT_ID: '300', SAGE_API_KEY: 'K', SAGE_COMPANY_ID: '1', SAGE_EMAIL: 'e@x.co', SAGE_PASSWORD: 'p', ...(opts.env ?? {}) }
  const sage: Sage = { invoices: [], customers: [], items: [{ ID: 31, Code: 'RC-1' }], ...(opts.sage ?? {}) }
  let postFailures = opts.failPostTimes ?? 0
  let invoiceLookups = 0
  const posted: unknown[] = []
  const sageCalls: string[] = []
  const list = <T,>(rows: T[]) => new Response(JSON.stringify({ TotalResults: rows.length, ReturnedResults: rows.length, Results: rows }), { status: 200 })
  const fetchImpl = async (input: string, init?: RequestInit) => {
    const u = new URL(input)
    const path = u.pathname.replace('/api/2.0.0', '')
    sageCalls.push(`${init?.method ?? 'GET'} ${path}`)
    if (path === '/TaxInvoice/Get' && opts.invoiceAppearsAfterFirstLookup && ++invoiceLookups >= 2) return list([{ ID: 888, DocumentNumber: 'INV0888', Reference: 'SR-00412' }])
    if (path === '/TaxInvoice/Get') return list(sage.invoices.filter((i) => u.searchParams.get('$filter')?.includes(`'${i.Reference}'`)))
    if (path === '/Customer/Get') return list(sage.customers.filter((c) => u.searchParams.get('$filter')?.includes(`'${c.Email}'`)))
    if (path === '/Item/Get') return list(sage.items.filter((i) => u.searchParams.get('$filter')?.includes(`'${i.Code}'`)))
    if (path === '/Customer/Save') return new Response(JSON.stringify({ ID: 55, Name: 'N' }), { status: 200 })
    if (path === '/TaxInvoice/Save') {
      if (opts.postStatus) return new Response('invalid', { status: opts.postStatus })
      if (postFailures-- > 0) return new Response('busy', { status: 503 })
      posted.push(JSON.parse(String(init?.body)))
      return new Response(JSON.stringify({ ID: 900, DocumentNumber: 'INV0900' }), { status: 200 })
    }
    return new Response('?', { status: 404 })
  }
  const config = sageConfigFromEnv(env)
  const client = new SageClient(config, new BasicAuth({ email: 'e@x.co', password: 'p' }), { fetchImpl })
  const customers = new MemoryCustomerMapStore()
  const itemCache = new MemoryItemCacheStore()
  const metadata: Record<string, Record<string, unknown>> = { order_01QA: { existing: 'keep', payfast_payment_id: 'pf1' } }
  const writeMetadata = vi.fn(async (id: string, patch: Record<string, unknown>) => {
    metadata[id] = { ...metadata[id], ...patch }
  })
  const deps = (shadow = false): SageDeps => ({
    shadow, config: () => config, client: () => client, customers: () => customers,
    items: () => new ItemResolver(client, itemCache), writeMetadata, now: () => T0, clock: opts.clock, logger: quiet,
  })
  const alerts: StaffAlert[] = []
  const store = new MemoryJobStore(() => T0)
  const mkQueue = (shadow = false) =>
    new AutomationQueue({
      store, handlers: [sageInvoiceHandler(deps(shadow))], alert: async (a) => (alerts.push(a), 'sent' as const), logger: quiet, now: () => T0,
      defer: () => undefined,
    })
  return { queue: mkQueue(), mkQueue, store, alerts, posted, sageCalls, metadata, writeMetadata, customers }
}

async function run(s: ReturnType<typeof setup>, order: unknown = graphOrder()) {
  const snap = buildSageOrderSnapshot(order)
  const { job } = await s.queue.enqueue(SAGE_INVOICE, `sage_invoice:${snap.id}`, { order: snap }, snap.id)
  const outcome = await s.queue.runJob(job.id)
  return { outcome, job: (await s.store.getByKey(`sage_invoice:${snap.id}`))! }
}

describe('SAGE_INVOICE handler', () => {
  it('posts one invoice, creating the customer, and writes the metadata without erasing existing keys', async () => {
    const s = setup()
    const { outcome, job } = await run(s)
    expect(outcome).toBe('done')
    expect((job.result as { outcome: string }).outcome).toBe('posted')
    expect(s.posted).toHaveLength(1)
    expect(s.posted[0]).toMatchObject({ Reference: 'SR-00412', CustomerId: 55, Inclusive: true, Lines: [{ SelectionId: 31, UnitPriceInclusive: 1500 }] })
    expect(s.metadata.order_01QA).toMatchObject({
      existing: 'keep', payfast_payment_id: 'pf1', sage_invoice_id: '900', sage_document_number: 'INV0900', sage_synced_at: T0.toISOString(),
    })
    expect(await s.customers.get('ann@example.com')).toBe(55)
  })

  it('uses a customer Sage already has and our map on the next order', async () => {
    const s = setup({ sage: { customers: [{ ID: 40, Email: 'ann@example.com' }] } })
    await run(s)
    expect(s.posted[0]).toMatchObject({ CustomerId: 40 })
    expect(s.sageCalls).not.toContain('POST /Customer/Save')
  })

  it('already in Sage: writes its ids to the order and posts nothing', async () => {
    const s = setup({ sage: { invoices: [{ ID: 777, DocumentNumber: 'INV0777', Reference: 'SR-00412' }] } })
    const { job } = await run(s)
    expect((job.result as { outcome: string }).outcome).toBe('already-in-sage')
    expect(s.posted).toHaveLength(0)
    expect(s.sageCalls).not.toContain('POST /Customer/Save')
    expect(s.metadata.order_01QA).toMatchObject({ existing: 'keep', sage_invoice_id: '777', sage_document_number: 'INV0777' })
  })

  it('USD order: held, no Sage call at all, one staff alert, no retry burned', async () => {
    const s = setup()
    const { outcome, job } = await run(s, graphOrder({ currency_code: 'usd' }))
    expect(outcome).toBe('done')
    expect(job.status).toBe('done')
    expect(job.attempts).toBe(1)
    expect(job.result).toMatchObject({ outcome: 'held' })
    expect(s.sageCalls).toEqual([])
    expect(s.alerts).toHaveLength(1)
    expect(s.alerts[0].subject).toContain('held')
    expect(s.alerts[0].lines.join(' ')).toContain('SR-00412')
    expect(s.alerts[0].lines.join(' ')).not.toContain('ann@example.com')
  })

  it('tax type unset: held with one alert, nothing sent', async () => {
    const s = setup({ env: { SAGE_TAX_TYPE_ID: '' } })
    const { job } = await run(s)
    expect(job.result).toMatchObject({ outcome: 'held' })
    expect(job.attempts).toBe(1)
    expect(s.sageCalls).toEqual([])
    expect(s.alerts).toHaveLength(1)
    expect(s.alerts[0].lines[0]).toContain('SAGE_TAX_TYPE_ID')
  })

  it('cash mode without SAGE_CASH_CUSTOMER_ID: held; with it, uses that customer', async () => {
    const held = setup({ env: { SAGE_CUSTOMER_MODE: 'cash' } })
    expect((await run(held)).job.result).toMatchObject({ outcome: 'held' })
    expect(held.sageCalls).toEqual([])
    const ok = setup({ env: { SAGE_CUSTOMER_MODE: 'cash', SAGE_CASH_CUSTOMER_ID: '8' } })
    await run(ok)
    expect(ok.posted[0]).toMatchObject({ CustomerId: 8 })
    expect(ok.sageCalls.filter((c) => c.includes('/Customer/'))).toEqual([])
  })

  it('OAuth not connected: held, not retried', async () => {
    const failing: SageDeps = { ...({} as SageDeps), shadow: false, logger: quiet, config: () => sageConfigFromEnv({ SAGE_TAX_TYPE_ID: '4' }),
      client: () => ({ findTaxInvoiceByReference: async () => { throw new SageConfigError('Sage is not connected yet') } }) as unknown as SageClient,
      customers: () => new MemoryCustomerMapStore(), items: () => ({}) as ItemResolver, writeMetadata: async () => undefined }
    const alerts: StaffAlert[] = []
    const q = new AutomationQueue({ store: new MemoryJobStore(() => T0), handlers: [sageInvoiceHandler(failing)], alert: async (a) => (alerts.push(a), 'sent' as const), logger: quiet, now: () => T0, defer: () => undefined })
    const snap = buildSageOrderSnapshot(graphOrder())
    const { job } = await q.enqueue(SAGE_INVOICE, 'k', { order: snap }, snap.id)
    await q.runJob(job.id)
    expect(alerts).toHaveLength(1)
    expect((await q.storeRef.getByKey('k'))?.attempts).toBe(1)
  })

  it('a free order is skipped without a Sage call or alert', async () => {
    const s = setup()
    const { job } = await run(s, graphOrder({ total: 0 }))
    expect(job.result).toMatchObject({ outcome: 'skipped' })
    expect(s.sageCalls).toEqual([])
    expect(s.alerts).toEqual([])
  })

  it('a Sage 5xx is retried (not held); the retry resumes with the saved customer and posts once', async () => {
    const s = setup({ failPostTimes: 1 })
    const { outcome, job } = await run(s)
    expect(outcome).toBe('retry')
    expect(job.status).toBe('pending')
    expect(job.state).toMatchObject({ customerId: 55 })
    expect(s.alerts).toEqual([])
    const claimed = await s.store.claim(job.id, new Date(T0.getTime() + 3_600_000), new Date(T0.getTime() + 7_200_000))
    expect(claimed?.attempts).toBe(2)
    const done = await (s.queue as unknown as { execute(j: unknown): Promise<string> }).execute(claimed)
    expect(done).toBe('done')
    expect(s.posted).toHaveLength(1)
    expect(s.sageCalls.filter((c) => c === 'POST /Customer/Save')).toHaveLength(1)
  })

  it('a Sage 4xx on the invoice is dead at once with the failure alert', async () => {
    const s = setup({ postStatus: 422 })
    const { outcome, job } = await run(s)
    expect(outcome).toBe('dead')
    expect(job.attempts).toBe(1)
    expect(s.alerts).toHaveLength(1)
    expect(s.alerts[0].subject).toContain('Sage invoice failed')
  })

  it('an account line without SAGE_INCOME_ACCOUNT_ID is held, not posted wrong', async () => {
    const noAccount = setup({ env: { SAGE_INCOME_ACCOUNT_ID: '' }, sage: { items: [] } })
    const { job } = await run(noAccount)
    expect(job.result).toMatchObject({ outcome: 'held' })
    expect(noAccount.posted).toHaveLength(0)
  })

  it('an unknown item code posts an account line and logs a warning', async () => {
    const s = setup({ sage: { items: [] } })
    await run(s)
    expect(s.posted[0]).toMatchObject({ Lines: [{ SelectionId: 300, LineType: 1 }] })
    expect(quiet.warn).toHaveBeenCalledWith(expect.stringContaining('not known in Sage'))
  })

  it('shadow: builds and logs a masked summary, no Sage call, no metadata, works without credentials', async () => {
    const s = setup({ env: { SAGE_API_KEY: '', SAGE_EMAIL: '', SAGE_PASSWORD: '' } })
    const shadowQueue = s.mkQueue(true)
    const snap = buildSageOrderSnapshot(graphOrder())
    const { job } = await shadowQueue.enqueue(SAGE_INVOICE, 'shadow-key', { order: snap }, snap.id)
    quiet.info.mockClear()
    await shadowQueue.runJob(job.id)
    expect(s.sageCalls).toEqual([])
    expect(s.writeMetadata).not.toHaveBeenCalled()
    const line = quiet.info.mock.calls.map((c) => String(c[0])).find((m) => m.startsWith('[sage:shadow]'))!
    expect(line).toContain('SR-00412')
    expect(line).toContain('1500.00 ZAR')
    expect(line).not.toContain('ann@example.com')
  })
})

describe('mergeOrderMetadata', () => {
  it('spreads the existing metadata under the new keys', async () => {
    const orders = {
      retrieveOrder: vi.fn(async () => ({ metadata: { a: 1, b: 2 } })),
      updateOrders: vi.fn(async () => undefined),
    }
    await mergeOrderMetadata(orders, 'order_1', { b: 3, c: 4 })
    expect(orders.updateOrders).toHaveBeenCalledWith('order_1', { metadata: { a: 1, b: 3, c: 4 } })
  })
  it('works for an order with no metadata', async () => {
    const orders = { retrieveOrder: vi.fn(async () => ({ metadata: null })), updateOrders: vi.fn(async () => undefined) }
    await mergeOrderMetadata(orders, 'o', { x: 1 })
    expect(orders.updateOrders).toHaveBeenCalledWith('o', { metadata: { x: 1 } })
  })
})

describe('AUTOMATION_SAGE flag and dispatch', () => {
  it('defaults to off; unknown values are off; only code runs durable jobs', () => {
    expect(sageMode({})).toBe('off')
    expect(sageMode({ AUTOMATION_SAGE: 'Code' })).toBe('code')
    expect(sageMode({ AUTOMATION_SAGE: 'n8n' })).toBe('off')
    expect(modeFor(SAGE_INVOICE, {})).toBe('off')
    expect(modeFor(SAGE_INVOICE, { AUTOMATION_SAGE: 'shadow' })).toBe('off')
    expect(modeFor(SAGE_INVOICE, { AUTOMATION_SAGE: 'code' })).toBe('code')
  })

  const queues = () => {
    const durable = { enqueue: vi.fn(), enqueueAndKick: vi.fn(async () => ({ job: { id: 'j' }, created: true })) }
    const dry = { enqueue: vi.fn(async () => ({ job: { id: 'dj' }, created: true })), runJob: vi.fn(async () => 'done') }
    return { durable, dry, deps: (env: Record<string, string>) => ({ queue: () => durable as never, dryRunQueue: () => dry as never, env }) }
  }

  it('off: nothing; code: one durable job keyed sage_invoice:<order>; duplicate is reported', async () => {
    const q = queues()
    expect(await dispatchSageInvoice(graphOrder(), q.deps({}))).toBe('none')
    expect(q.durable.enqueueAndKick).not.toHaveBeenCalled()
    expect(await dispatchSageInvoice(graphOrder(), q.deps({ AUTOMATION_SAGE: 'code' }))).toBe('enqueued')
    expect(q.durable.enqueueAndKick).toHaveBeenCalledWith(SAGE_INVOICE, 'sage_invoice:order_01QA', expect.objectContaining({ order: expect.objectContaining({ displayId: 412, total: 1500 }) }), 'order_01QA')
    q.durable.enqueueAndKick.mockResolvedValueOnce({ job: { id: 'j' }, created: false })
    expect(await dispatchSageInvoice(graphOrder(), q.deps({ AUTOMATION_SAGE: 'code' }))).toBe('duplicate')
  })

  it('shadow and dry run use the in-memory queue and never the durable one', async () => {
    const q = queues()
    expect(await dispatchSageInvoice(graphOrder(), q.deps({ AUTOMATION_SAGE: 'shadow' }))).toBe('shadow')
    expect(await dispatchSageInvoice(graphOrder(), q.deps({ AUTOMATION_SAGE: 'code', AUTOMATION_DRY_RUN: 'true' }))).toBe('dry-run')
    expect(q.dry.runJob).toHaveBeenCalledTimes(2)
    expect(q.durable.enqueueAndKick).not.toHaveBeenCalled()
  })
})

describe('lease budget and late lookup (M2)', () => {
  it('throws a retryable error instead of posting when the run used the lease up', async () => {
    let t = 0
    const s = setup({ clock: () => (t += 8 * 60_000) }) // 8 min per reading: over lease minus 3 min at the post check
    const { outcome, job } = await run(s)
    expect(outcome).toBe('retry')
    expect(job.last_error).toMatch(/time budget/)
    expect(s.posted).toHaveLength(0)
    expect(s.alerts).toEqual([])
  })

  it('looks the reference up again right before posting and stops if it appeared', async () => {
    const s = setup({ invoiceAppearsAfterFirstLookup: true })
    const { job } = await run(s)
    expect(job.result).toMatchObject({ outcome: 'already-in-sage', documentNumber: 'INV0888' })
    expect(s.posted).toHaveLength(0)
    expect(s.metadata.order_01QA).toMatchObject({ sage_invoice_id: '888' })
  })
})

describe('mergeOrderMetadata race (M1)', () => {
  it('writes again once when the read back shows our keys were overwritten, merging onto a fresh read', async () => {
    let stored: Record<string, unknown> = { a: 1 }
    let writes = 0
    const orders = {
      retrieveOrder: vi.fn(async () => ({ metadata: { ...stored } })),
      updateOrders: vi.fn(async (_id: string, data: Record<string, unknown>) => {
        writes += 1
        // A concurrent writer (invoice step) replaces the metadata right after our first write.
        stored = writes === 1 ? { a: 1, invoice_path: 'p.pdf' } : (data.metadata as Record<string, unknown>)
      }),
    }
    await mergeOrderMetadata(orders, 'o', { sage_invoice_id: '9' })
    expect(writes).toBe(2)
    expect(stored).toEqual({ a: 1, invoice_path: 'p.pdf', sage_invoice_id: '9' })
  })

  it('is bounded: two attempts at most', async () => {
    const orders = { retrieveOrder: vi.fn(async () => ({ metadata: {} })), updateOrders: vi.fn(async () => undefined) }
    await mergeOrderMetadata(orders, 'o', { k: 1 })
    expect(orders.updateOrders).toHaveBeenCalledTimes(2)
  })
})

describe('sweepSageInvoices (M3)', () => {
  const START = new Date('2026-11-26T09:00:00Z')
  const NOW = new Date('2026-11-26T12:00:00Z')
  const old = (min: number) => new Date(NOW.getTime() - min * 60_000).toISOString()
  const mk = (env: Record<string, string>, orders: Array<{ id: string; created_at: string }>) => {
    const store = new MemoryJobStore(() => NOW)
    const enqueueOrder = vi.fn(async () => 'enqueued')
    return { store, enqueueOrder, run: () => sweepSageInvoices({ store, env, now: () => NOW, processStartedAt: START, listOrdersSince: async () => orders, enqueueOrder, logger: quiet }) }
  }

  it('off and shadow do nothing', async () => {
    for (const env of [{}, { AUTOMATION_SAGE: 'shadow' }]) {
      const m = mk(env, [{ id: 'o1', created_at: old(30) }])
      expect(await m.run()).toEqual({ checked: 0, recovered: 0 })
      expect(m.enqueueOrder).not.toHaveBeenCalled()
    }
  })

  it('code: enqueues orders placed after code mode began, past the grace period, not newer or older ones', async () => {
    const m = mk({ AUTOMATION_SAGE: 'code' }, [
      { id: 'before', created_at: '2026-11-26T08:00:00Z' },
      { id: 'recent', created_at: new Date(NOW.getTime() - SWEEP_GRACE_MS + 1000).toISOString() },
      { id: 'lost', created_at: old(30) },
    ])
    expect(await m.run()).toEqual({ checked: 1, recovered: 1 })
    expect(m.enqueueOrder).toHaveBeenCalledTimes(1)
    expect((m.enqueueOrder.mock.calls as unknown as Array<[{ id: string }]>)[0][0].id).toBe('lost')
  })

  it('a duplicate (the subscriber already queued it) is not counted as recovered', async () => {
    const m = mk({ AUTOMATION_SAGE: 'code' }, [{ id: 'lost', created_at: old(30) }])
    m.enqueueOrder.mockResolvedValue('duplicate')
    expect(await m.run()).toEqual({ checked: 1, recovered: 0 })
  })
})
