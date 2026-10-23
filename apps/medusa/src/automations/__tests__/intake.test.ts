import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@medusajs/framework/utils', () => ({ ContainerRegistrationKeys: { QUERY: 'query' } }))
vi.mock('../../modules/memberships', () => ({ MEMBERSHIPS_MODULE: 'membershipsModule' }))
vi.mock('../../modules/memberships/service', () => ({ default: class {} }))
const send = vi.fn().mockResolvedValue(undefined)
vi.mock('../runtime', () => ({
  getAutomationQueue: vi.fn(),
  staffAlerter: () => ({ send, reset: () => undefined }),
  createDryRunQueue: vi.fn(),
}))

import {
  buildIntakePayload,
  exactIlike,
  findPriorSessionOrder,
  intakeMode,
  intakeReminderSchedule,
  postIntakeCancel,
  postIntakeOrder,
  postIntakeReminderRun,
  sweepSince,
  withPriorSessionOrder,
  type IntakeOrder,
} from '../intake'
import { detectOrderProductType } from '../../subscribers/order-placed'
import orderPlacedIntakeHandler from '../../subscribers/order-placed-intake'

type Cat = { handle: string; parent_category?: Cat | null }
const chain = (...handles: string[]): Cat =>
  handles.reduceRight<Cat | null>((parent, handle) => ({ handle, parent_category: parent }), null) as Cat
const line = (handle: string, title: string, categories: Cat[]) => ({
  title,
  variant: { title: 'Package of 04 (60 min online)', product: { handle, title, categories } },
})

const isSession = (item: unknown) => detectOrderProductType([item as never]) === 'session'

const ORDER: IntakeOrder = {
  id: 'order_1',
  customer_id: 'cus_1',
  display_id: 512,
  created_at: '2026-10-21T08:00:00Z',
  email: 'guest@example.com',
  customer: { email: 'johan@aiautomations.co.za', first_name: 'Johan', last_name: 'QA Test' },
  items: [
    line('rapid-repatterning-session', 'Rapid Repatterning Session', [chain('private-sessions')]),
    // KI082: under a sub-category of private-sessions, still a session.
    line('exploring-the-alpha-mind-45-minutes', 'Exploring the Alpha Mind', [chain('exploring-the-alpha-mind', 'private-sessions')]),
    line('money-mastery-group-session', 'Group Session: Money Mastery', [chain('group-sessions-live')]),
    line('practitioner-mentorship', 'Practitioner Mentorship', [chain('private-sessions')]),
  ],
}

describe('buildIntakePayload', () => {
  it('sends every line with the order mail rule for session, and the buyer', () => {
    const payload = buildIntakePayload(ORDER, isSession)
    expect(payload).toEqual({
      orderId: 'order_1',
      displayId: '512',
      email: 'johan@aiautomations.co.za',
      firstName: 'Johan',
      lastName: 'QA Test',
      placedAt: '2026-10-21T08:00:00.000Z',
      lines: [
        { handle: 'rapid-repatterning-session', title: 'Rapid Repatterning Session', session: true },
        { handle: 'exploring-the-alpha-mind-45-minutes', title: 'Exploring the Alpha Mind', session: true },
        { handle: 'money-mastery-group-session', title: 'Group Session: Money Mastery', session: false },
        // Mentorship is tracked by the team, never a private session.
        { handle: 'practitioner-mentorship', title: 'Practitioner Mentorship', session: false },
      ],
    })
  })

  it('uses the guest email and billing name when there is no customer record', () => {
    const payload = buildIntakePayload(
      { ...ORDER, customer: null, billing_address: { first_name: 'Guest', last_name: 'Buyer' } },
      isSession,
    )
    expect(payload).toMatchObject({ email: 'guest@example.com', firstName: 'Guest', lastName: 'Buyer' })
  })

  it('returns null without an email or product lines', () => {
    expect(buildIntakePayload({ ...ORDER, customer: null, email: null }, isSession)).toBeNull()
    expect(buildIntakePayload({ ...ORDER, items: [{ title: 'Custom line' }] }, isSession)).toBeNull()
  })
})

describe('flags and tick', () => {
  it('defaults AUTOMATION_INTAKE to code; off turns it off; n8n reads as code', () => {
    expect(intakeMode({})).toBe('code')
    expect(intakeMode({ AUTOMATION_INTAKE: 'off' })).toBe('off')
    expect(intakeMode({ AUTOMATION_INTAKE: 'n8n' })).toBe('code')
  })

  it('ticks hourly, every minute for a compressed test', () => {
    expect(intakeReminderSchedule({})).toBe('0 * * * *')
    expect(intakeReminderSchedule({ INTAKE_REMINDER_DELAYS: '1d,3d,5d' })).toBe('0 * * * *')
    expect(intakeReminderSchedule({ INTAKE_REMINDER_DELAYS: '2m,4m,6m' })).toBe('* * * * *')
  })
})

describe('sweepSince', () => {
  it('covers the last 24 hours, never before the go-live', () => {
    const now = new Date('2026-10-25T12:00:00Z')
    expect(sweepSince(now, {}).toISOString()).toBe('2026-10-24T12:00:00.000Z')
    expect(sweepSince(new Date('2026-10-21T06:00:00Z'), { INTAKE_SWEEP_SINCE: '2026-10-21T05:00:00Z' }).toISOString()).toBe(
      '2026-10-21T05:00:00.000Z',
    )
    expect(sweepSince(now, { INTAKE_SWEEP_SINCE: 'nonsense' }).toISOString()).toBe('2026-10-24T12:00:00.000Z')
  })
})

describe('web calls', () => {
  const env = { WEB_BASE_URL: 'http://web:3000/', INTERNAL_WEBHOOK_SECRET: 's3cret' }

  it('posts the order with the secret header', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{"records":[]}', { status: 200 }))
    await postIntakeOrder(buildIntakePayload(ORDER, isSession)!, env, fetchImpl, 0)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('http://web:3000/api/intake/orders')
    expect((init.headers as Record<string, string>)['x-webhook-secret']).toBe('s3cret')
    expect(JSON.parse(init.body as string).orderId).toBe('order_1')
  })

  it('throws on a 4xx so the failure is visible', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{}', { status: 422 }))
    await expect(postIntakeOrder(buildIntakePayload(ORDER, isSession)!, env, fetchImpl, 0)).rejects.toThrow('422')
  })

  it('refuses to call without a secret', async () => {
    await expect(postIntakeReminderRun({ WEB_BASE_URL: 'http://web:3000' })).rejects.toThrow('INTERNAL_WEBHOOK_SECRET')
  })

  it('posts the reminder run and the cancel', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{"reminders":2}', { status: 200 }))
    expect(await postIntakeReminderRun(env, fetchImpl)).toEqual({ reminders: 2 })
    await postIntakeCancel('order_9', env, fetchImpl)
    expect(fetchImpl.mock.calls[1][0]).toBe('http://web:3000/api/intake/cancel')
  })
})

describe('earlier session order (D023, any service)', () => {
  const session = line('executive-coaching-30-mins', 'Executive Coaching Session', [chain('private-sessions')])
  const group = line('money-mastery-group-session', 'Group Session: Money Mastery', [chain('group-sessions-live')])
  const graphOf = (orders: unknown[]) => ({ graph: vi.fn().mockResolvedValue({ data: orders }) })

  it('asks for earlier orders of the address, any case, and names the first with a session', async () => {
    const query = graphOf([
      { id: 'order_0c', display_id: 500, status: 'canceled', items: [session] },
      { id: 'order_0g', display_id: 499, status: 'completed', items: [group] },
      { id: 'order_0s', display_id: 498, status: 'pending', items: [session] },
    ])
    expect(await findPriorSessionOrder(query, ORDER, 'Johan+QA_1@AiAutomations.co.za', isSession)).toBe('#498')
    expect(query.graph).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'order',
        filters: {
          $or: [{ email: { $ilike: 'Johan+QA\\_1@AiAutomations.co.za' } }, { email: { $ilike: 'guest@example.com' } }, { customer_id: 'cus_1' }],
          created_at: { $lt: '2026-10-21T08:00:00.000Z' },
        },
      }),
    )
  })

  it('a first-time client: null (cancelled, non-session and the order itself do not count)', async () => {
    const query = graphOf([
      { id: 'order_1', display_id: 512, status: 'pending', items: [session] },
      { id: 'order_0c', display_id: 500, status: 'canceled', items: [session] },
      { id: 'order_0g', display_id: 499, status: 'completed', items: [group] },
    ])
    expect(await findPriorSessionOrder(query, ORDER, 'johan@aiautomations.co.za', isSession)).toBeNull()
  })

  it('escapes the ILIKE wildcards', () => {
    expect(exactIlike('a_b%c\\d@x.co')).toBe('a\\_b\\%c\\\\d@x.co')
  })

  it('a failed lookup leaves the payload as it was, so a first-time mail is never held back', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const payload = buildIntakePayload(ORDER, isSession)!
    const query = { graph: vi.fn().mockRejectedValue(new Error('bad filter')) }
    expect(await withPriorSessionOrder(query, ORDER, payload, isSession)).toEqual(payload)
    const found = await withPriorSessionOrder(graphOf([{ id: 'order_0s', display_id: 498, status: 'pending', items: [session] }]), ORDER, payload, isSession)
    expect(found.priorSessionOrder).toBe('#498')
  })
})

describe('order-placed-intake subscriber', () => {
  beforeEach(() => {
    send.mockClear()
    vi.unstubAllEnvs()
  })

  function container(orders: unknown[]) {
    return { resolve: () => ({ graph: vi.fn().mockResolvedValue({ data: orders }) }) } as never
  }

  it('does nothing when AUTOMATION_INTAKE is off', async () => {
    vi.stubEnv('AUTOMATION_INTAKE', 'off')
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    await orderPlacedIntakeHandler({ event: { data: { id: 'order_1' } }, container: container([ORDER]) } as never)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('never throws, and alerts staff when the web app cannot be reached', async () => {
    vi.stubEnv('AUTOMATION_INTAKE', 'code')
    vi.stubEnv('INTERNAL_WEBHOOK_SECRET', '')
    vi.stubEnv('N8N_WEBHOOK_SECRET', '')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await expect(
      orderPlacedIntakeHandler({ event: { data: { id: 'order_1' } }, container: container([ORDER]) } as never),
    ).resolves.toBeUndefined()
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ key: 'intake-order' }))
  })
})
