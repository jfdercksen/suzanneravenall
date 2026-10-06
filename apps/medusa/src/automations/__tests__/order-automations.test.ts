import { describe, it, expect, vi } from 'vitest'
import { ThinkificClient, VtigerClient, type OrderSnapshot, type StaffAlert } from '@suzanne/integrations'
import { makeFakeThinkific, type FakeThinkificOptions } from '../../../../../packages/integrations/src/test-utils-thinkific'
import { makeFakeVtiger, type FakeVtigerOptions } from '../../../../../packages/integrations/src/test-utils'
import { AutomationQueue, RETRY_DELAYS_MS } from '../../modules/automations/queue'
import { MemoryJobStore } from '../../modules/automations/memory-store'
import {
  courseAccessEmailHandler,
  thinkificEnrolmentHandler,
  vtigerOrderHandler,
  type AutomationDeps,
  type CourseAccessMail,
} from '../handlers'
import { dispatchOrderAutomations } from '../dispatch'
import { buildOrderSnapshot } from '../order-snapshot'
import { codeModeSince, sweepRecentOrders, SWEEP_GRACE_MS } from '../sweep'
import { modeFor } from '../config'

const quiet = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
const noSleep = () => Promise.resolve()
const T0 = Date.parse('2026-10-06T10:00:00Z')

/** The Query graph result shape order-placed.ts reads (guest order, email on the order). */
function graphOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order_01QA',
    display_id: 21,
    customer_id: 'cus_1',
    email: 'qa.buyer@example.com',
    currency_code: 'zar',
    total: 0,
    metadata: {},
    customer: { id: 'cus_1', email: null, first_name: null, last_name: null, has_account: false },
    billing_address: { first_name: 'QA', last_name: 'SelfTest', address_1: '1 Test St', phone: '000' },
    shipping_address: null,
    items: [
      {
        id: 'item_1',
        title: 'Program 1 Self Study',
        quantity: 1,
        variant: {
          id: 'var_1',
          title: 'Default',
          product: {
            id: 'prod_1',
            title: 'Program 1 Self Study',
            handle: 'program-1',
            metadata: { thinkific_course_id: '1284792' },
            categories: [{ handle: 'rp-self-paced' }],
          },
        },
      },
    ],
    ...overrides,
  }
}

function setup(opts: {
  env?: Record<string, string | undefined>
  thinkific?: FakeThinkificOptions
  vtiger?: FakeVtigerOptions
  mailFails?: number
} = {}) {
  let now = T0
  const env = opts.env ?? { AUTOMATION_THINKIFIC: 'code', AUTOMATION_ORDER_VTIGER: 'code' }
  const thinkific = makeFakeThinkific(opts.thinkific ?? { users: [{ id: 259072573, email: 'qa.buyer@example.com' }] })
  const vtiger = makeFakeVtiger(
    opts.vtiger ?? {
      contacts: [{ id: '12x188', email: 'qa.buyer@example.com', firstname: 'QA', lastname: 'SelfTest', cf_total_spend_zar: '0.00', assigned_user_id: '19x1' }],
    },
  )
  let mailFailures = opts.mailFails ?? 0
  const mails: CourseAccessMail[] = []
  const alerts: StaffAlert[] = []
  const deps: AutomationDeps = {
    thinkific: () => new ThinkificClient({ apiKey: 'TOKEN', fetchImpl: thinkific.fetchImpl, sleep: noSleep, retries: 1, logger: quiet }),
    vtiger: () => new VtigerClient({ url: 'https://crm.test', username: 'u', accessKey: 'k', fetchImpl: vtiger.fetchImpl, sleep: noSleep, retries: 1, logger: quiet }),
    sendCourseAccessEmail: async (mail) => {
      if (mailFailures > 0) {
        mailFailures -= 1
        throw new Error('web route answered 503')
      }
      mails.push(mail)
    },
    logger: quiet,
  }
  const background: Array<Promise<unknown>> = []
  const store = new MemoryJobStore(() => new Date(now))
  const handlers = [thinkificEnrolmentHandler(deps), courseAccessEmailHandler(deps), vtigerOrderHandler(deps)]
  const queue = new AutomationQueue({
    store,
    handlers,
    alert: async (a) => {
      alerts.push(a)
      return 'sent'
    },
    logger: quiet,
    now: () => new Date(now),
    isRunnable: (a) => modeFor(a, env) !== 'off',
    defer: (fn) => {
      background.push(fn())
    },
  })
  const dryStores: MemoryJobStore[] = []
  const dryRunQueue = () => {
    const s = new MemoryJobStore()
    dryStores.push(s)
    const dryDeps: AutomationDeps = {
      thinkific: () => ThinkificClient.fromEnv({ AUTOMATION_DRY_RUN: 'true' }, { logger: quiet, fetchImpl: thinkific.fetchImpl }),
      vtiger: () => VtigerClient.fromEnv({ AUTOMATION_DRY_RUN: 'true' }, { logger: quiet, fetchImpl: vtiger.fetchImpl }),
      sendCourseAccessEmail: async () => {},
      logger: quiet,
    }
    return new AutomationQueue({
      store: s,
      handlers: [thinkificEnrolmentHandler(dryDeps), courseAccessEmailHandler(dryDeps), vtigerOrderHandler(dryDeps)],
      alert: async () => 'dry-run',
      logger: quiet,
      defer: (fn) => {
        background.push(fn())
      },
    })
  }
  const flush = async () => {
    while (background.length) await background.shift()
  }
  const dispatch = async (order = graphOrder()) => {
    const res = await dispatchOrderAutomations(buildOrderSnapshot(order, new Date(now)), { queue: () => queue, dryRunQueue, env })
    await flush()
    return res
  }
  const runDue = async () => {
    const res = await queue.runDue()
    await flush()
    return res
  }
  return {
    env, thinkific, vtiger, mails, alerts, store, queue, dispatch, runDue, flush, dryStores,
    advance: (ms: number) => {
      now += ms
    },
  }
}

describe('code mode: a course order', () => {
  it('enrols the buyer, mails course access once, and records the purchase in Vtiger', async () => {
    const t = setup()
    const res = await t.dispatch()
    expect(res).toEqual({ thinkific_enrolment: 'enqueued', vtiger_order: 'enqueued' })

    // Thinkific: existing QA user, one enrolment for course 1284792.
    expect(t.thinkific.enrolments).toEqual([expect.objectContaining({ user_id: 259072573, course_id: 1284792 })])
    // Buyer mail via the web template, guest name from the billing address.
    expect(t.mails).toEqual([
      { email: 'qa.buyer@example.com', firstName: 'QA', courses: ['Program 1 Self Study'], orderId: 'order_01QA', displayId: 21 },
    ])
    // Vtiger: contact 12x188 revised, one Event.
    expect(t.vtiger.ops()).toContain('revise')
    expect(t.vtiger.created.map((c) => c.elementType)).toEqual(['Events'])
    expect(t.vtiger.contacts[0]).toMatchObject({ cf_pipeline_stage: 'Closed Won', cf_total_spend_zar: '0.00' })

    expect(t.store.all().map((j) => [j.idempotency_key, j.status]).sort()).toEqual([
      ['course_access_email:order_01QA:1284792', 'done'],
      ['thinkific_enrolment:order_01QA', 'done'],
      ['vtiger_order:order_01QA', 'done'],
    ])
    expect(t.alerts).toEqual([])
  })

  it('the same order twice does nothing the second time', async () => {
    const t = setup()
    await t.dispatch()
    const thinkificWrites = t.thinkific.writes().length
    const vtigerWrites = t.vtiger.calls.filter((c) => c.method === 'POST' && c.operation !== 'login').length

    const again = await t.dispatch()
    expect(again).toEqual({ thinkific_enrolment: 'duplicate', vtiger_order: 'duplicate' })
    await t.runDue()
    expect(t.thinkific.writes().length).toBe(thinkificWrites)
    expect(t.vtiger.calls.filter((c) => c.method === 'POST' && c.operation !== 'login').length).toBe(vtigerWrites)
    expect(t.mails).toHaveLength(1)
    expect(t.store.all()).toHaveLength(3)
  })

  it('an order without course products creates no Thinkific job (n8n exited quietly too)', async () => {
    const t = setup()
    const o = graphOrder()
    ;(o.items[0]!.variant.product.metadata as Record<string, unknown>) = { product_type: 'book' }
    expect(await t.dispatch(o)).toEqual({ thinkific_enrolment: 'not-applicable', vtiger_order: 'enqueued' })
    expect(t.thinkific.calls).toEqual([])
  })
})

describe('outages', () => {
  it('Thinkific down: retried on the backoff schedule, then enrolled and mailed once', async () => {
    const down = () => new Response('busy', { status: 503 })
    const t = setup({
      thinkific: { users: [{ id: 5, email: 'qa.buyer@example.com' }], failures: { 'GET /users': [down(), down(), down(), down()] } },
    })
    await t.dispatch()
    let job = t.store.all().find((j) => j.automation === 'thinkific_enrolment')!
    expect(job).toMatchObject({ status: 'pending', attempts: 1 })
    expect(t.mails).toEqual([])

    t.advance(RETRY_DELAYS_MS[0])
    await t.runDue() // attempt 2: still down
    job = t.store.all().find((j) => j.automation === 'thinkific_enrolment')!
    expect(job).toMatchObject({ status: 'pending', attempts: 2 })

    t.advance(RETRY_DELAYS_MS[1])
    await t.runDue() // attempt 3: up again
    job = t.store.all().find((j) => j.automation === 'thinkific_enrolment')!
    expect(job.status).toBe('done')
    expect(t.thinkific.enrolments).toHaveLength(1)
    expect(t.mails).toHaveLength(1)
    expect(t.alerts).toEqual([])
  })

  it('Thinkific down for good: dead after 6 attempts, staff told which courses to enrol by hand (no buyer email in the alert)', async () => {
    const down = () => new Response('busy', { status: 503 })
    const t = setup({ thinkific: { failures: { 'GET /users': Array.from({ length: 20 }, down) } } })
    await t.dispatch()
    for (const d of RETRY_DELAYS_MS) {
      t.advance(d)
      await t.runDue()
    }
    const job = t.store.all().find((j) => j.automation === 'thinkific_enrolment')!
    expect(job).toMatchObject({ status: 'dead', attempts: 6 })
    expect(t.alerts.map((a) => a.subject)).toEqual([
      'Thinkific enrolment still failing, retrying - order #21 (order_01QA)',
      'Thinkific enrolment failed - order #21 (order_01QA)',
    ])
    const final = t.alerts[1]!.lines.join('\n')
    expect(final).toContain('1284792 (Program 1 Self Study)')
    expect(final).not.toContain('qa.buyer@example.com')
    expect(t.mails).toEqual([])
  })

  it('a course Thinkific rejects (4xx): one partial-failure alert, the job finishes, no retry', async () => {
    const t = setup({ thinkific: { users: [{ id: 5, email: 'qa.buyer@example.com' }], badCourses: [1284792] } })
    await t.dispatch()
    expect(t.store.all().find((j) => j.automation === 'thinkific_enrolment')!.status).toBe('done')
    expect(t.alerts).toHaveLength(1)
    expect(t.alerts[0]!.subject).toBe('Thinkific enrolment partial failure - order #21 (order_01QA)')
    expect(t.alerts[0]!.lines.join('\n')).toContain('q***@example.com')
    expect(t.mails).toEqual([])
  })

  it('the course-access mail route down: the mail is retried on its own, enrolment is not repeated', async () => {
    const t = setup({ mailFails: 1 })
    await t.dispatch()
    expect(t.store.all().find((j) => j.automation === 'course_access_email')).toMatchObject({ status: 'pending', attempts: 1 })
    t.advance(RETRY_DELAYS_MS[0])
    await t.runDue()
    expect(t.mails).toHaveLength(1)
    expect(t.thinkific.enrolments).toHaveLength(1)
    expect(t.thinkific.writes().filter((c) => c.path === '/enrollments')).toHaveLength(1)
  })

  it('Vtiger down after the contact step: the retry adds the Event without counting the order twice', async () => {
    const down = () => new Response('down', { status: 503 })
    const t = setup({
      vtiger: {
        contacts: [{ id: '12x188', email: 'qa.buyer@example.com', firstname: 'QA', lastname: 'SelfTest', cf_total_spend_zar: '100.00' }],
        failures: { create: [down(), down()] },
      },
    })
    await t.dispatch(graphOrder({ total: 166000 }))
    let job = t.store.all().find((j) => j.automation === 'vtiger_order')!
    expect(job).toMatchObject({ status: 'pending', state: { contactId: '12x188' } })
    expect(t.vtiger.contacts[0]!.cf_total_spend_zar).toBe('1760.00')

    t.advance(RETRY_DELAYS_MS[0])
    await t.runDue()
    job = t.store.all().find((j) => j.automation === 'vtiger_order')!
    expect(job.status).toBe('done')
    expect(t.vtiger.contacts[0]!.cf_total_spend_zar).toBe('1760.00')
    expect(t.vtiger.created.filter((c) => c.elementType === 'Events')).toHaveLength(1)
  })
})

describe('flags and dry run', () => {
  it('n8n mode (the default): nothing runs in code', async () => {
    const t = setup({ env: {} })
    expect(await t.dispatch()).toEqual({ thinkific_enrolment: 'none', vtiger_order: 'none' })
    expect(t.store.all()).toEqual([])
    expect(t.thinkific.calls).toEqual([])
    expect(t.vtiger.calls).toEqual([])
  })

  it('off: nothing runs anywhere', async () => {
    const t = setup({ env: { AUTOMATION_THINKIFIC: 'off', AUTOMATION_ORDER_VTIGER: 'off' } })
    expect(await t.dispatch()).toEqual({ thinkific_enrolment: 'none', vtiger_order: 'none' })
    expect(t.store.all()).toEqual([])
  })

  it('flags are independent', async () => {
    const t = setup({ env: { AUTOMATION_THINKIFIC: 'code' } })
    expect(await t.dispatch()).toEqual({ thinkific_enrolment: 'enqueued', vtiger_order: 'none' })
    expect(t.vtiger.calls).toEqual([])
  })

  it('code + dry run: the whole flow runs with no network call and nothing persisted', async () => {
    const t = setup({ env: { AUTOMATION_THINKIFIC: 'code', AUTOMATION_ORDER_VTIGER: 'code', AUTOMATION_DRY_RUN: 'true' } })
    expect(await t.dispatch()).toEqual({ thinkific_enrolment: 'dry-run', vtiger_order: 'dry-run' })
    expect(t.thinkific.calls).toEqual([])
    expect(t.vtiger.calls).toEqual([])
    expect(t.mails).toEqual([])
    expect(t.store.all()).toEqual([])
    // The dry run went all the way through, mail step included.
    expect(t.dryStores.flatMap((s) => s.all()).map((j) => [j.automation, j.status]).sort()).toEqual([
      ['course_access_email', 'done'],
      ['thinkific_enrolment', 'done'],
      ['vtiger_order', 'done'],
    ])
  })

  it('n8n + dry run: shadow run of the code next to n8n, still nothing real', async () => {
    const t = setup({ env: { AUTOMATION_DRY_RUN: 'true' } })
    expect(await t.dispatch()).toEqual({ thinkific_enrolment: 'shadow', vtiger_order: 'shadow' })
    expect(t.thinkific.calls).toEqual([])
    expect(t.vtiger.calls).toEqual([])
    expect(t.store.all()).toEqual([])
  })
})

describe('recovery sweep', () => {
  const started = new Date(T0 - 3_600_000)

  it('records mode changes; code mode starts at the process start', async () => {
    const store = new MemoryJobStore()
    expect(await codeModeSince(store, {}, started)).toEqual({})
    expect(await store.getModeState('thinkific_enrolment')).toMatchObject({ mode: 'n8n' })

    const later = new Date(T0)
    expect(await codeModeSince(store, { AUTOMATION_THINKIFIC: 'code' }, later)).toEqual({ thinkific_enrolment: later })
    // Unchanged on the next tick, even from a newer process.
    expect(await codeModeSince(store, { AUTOMATION_THINKIFIC: 'code' }, new Date(T0 + 1))).toEqual({ thinkific_enrolment: later })
    // Dry run is not code mode.
    expect(await codeModeSince(store, { AUTOMATION_THINKIFIC: 'code', AUTOMATION_DRY_RUN: 'true' }, new Date(T0 + 2))).toEqual({})
  })

  it('enqueues an order whose order.placed event was lost, only once, and never orders from before code mode', async () => {
    const t = setup()
    const lost = graphOrder({ id: 'order_lost', display_id: 30, created_at: new Date(T0 - 10 * 60_000).toISOString() })
    const beforeFlip = graphOrder({ id: 'order_n8n', display_id: 29, created_at: new Date(started.getTime() - 60_000).toISOString() })
    const tooFresh = graphOrder({ id: 'order_fresh', display_id: 31, created_at: new Date(T0 - SWEEP_GRACE_MS / 2).toISOString() })
    const listOrdersSince = vi.fn(async () => [beforeFlip, lost, tooFresh].map((o) => buildOrderSnapshot(o)))
    const sweep = () =>
      sweepRecentOrders({
        store: t.store,
        processStartedAt: started,
        env: t.env,
        now: () => new Date(T0),
        logger: quiet,
        listOrdersSince,
        enqueueOrder: (order: OrderSnapshot, only) =>
          dispatchOrderAutomations(order, { queue: () => t.queue, dryRunQueue: () => t.queue, env: t.env, kick: false, only }),
      })

    expect(await sweep()).toEqual({ checked: 1, recovered: 2 })
    expect(t.store.all().map((j) => j.idempotency_key).sort()).toEqual(['thinkific_enrolment:order_lost', 'vtiger_order:order_lost'])
    // The runner then runs them.
    await t.runDue()
    expect(t.thinkific.enrolments).toHaveLength(1)
    // A second sweep finds nothing new.
    expect(await sweep()).toEqual({ checked: 1, recovered: 0 })
  })

  it('does nothing while every flag is n8n', async () => {
    const t = setup({ env: {} })
    const listOrdersSince = vi.fn(async () => [])
    const res = await sweepRecentOrders({
      store: t.store, processStartedAt: started, env: {}, listOrdersSince, enqueueOrder: vi.fn(), logger: quiet,
    })
    expect(res).toEqual({ checked: 0, recovered: 0 })
    expect(listOrdersSince).not.toHaveBeenCalled()
  })
})

describe('buildOrderSnapshot', () => {
  it('copies a guest email onto the customer, keeps names, totals and course metadata, drops the rest', () => {
    const snap = buildOrderSnapshot(graphOrder({ total: { toJSON: () => 1660 } }), new Date(T0))
    expect(snap).toEqual({
      id: 'order_01QA',
      display_id: 21,
      total: 1660,
      created_at: new Date(T0).toISOString(),
      email: 'qa.buyer@example.com',
      customer: { email: 'qa.buyer@example.com', first_name: null, last_name: null },
      billing_address: { first_name: 'QA', last_name: 'SelfTest' },
      shipping_address: null,
      items: [
        {
          title: 'Program 1 Self Study',
          variant: { title: 'Default', metadata: null, product: { title: 'Program 1 Self Study', metadata: { thinkific_course_id: '1284792' } } },
        },
      ],
    })
  })
})
