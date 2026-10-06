// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { VtigerClient } from './vtiger'
import {
  existingOrderContactElement,
  newOrderContactElement,
  orderEventElement,
  orderValidForVtiger,
  prepareOrderForVtiger,
  syncOrderToVtiger,
  type OrderVtigerState,
} from './order-vtiger'
import { findContactQuery } from './leads'
import { makeFakeVtiger } from './test-utils'
import { loadWorkflow } from './n8n-test-harness'
import type { OrderSnapshot } from './orders'

const noSleep = () => Promise.resolve()

function client(fake: ReturnType<typeof makeFakeVtiger>, extra: Partial<ConstructorParameters<typeof VtigerClient>[0]> = {}) {
  return new VtigerClient({
    url: 'https://crm.test',
    username: 'webservice',
    accessKey: 'KEY',
    fetchImpl: fake.fetchImpl,
    sleep: noSleep,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    ...extra,
  })
}

function order(overrides: Partial<OrderSnapshot> = {}): OrderSnapshot {
  return {
    id: 'order_01ABC',
    display_id: 21,
    total: 331500,
    created_at: '2026-10-06T08:15:30.000Z',
    customer: { email: 'QA.Buyer@Example.com', first_name: 'QA', last_name: 'SelfTest' },
    billing_address: { first_name: 'Bill', last_name: 'Ing' },
    shipping_address: null,
    items: [
      { title: 'Line A', variant: { title: 'Default', product: { title: 'Program 1', metadata: {} } } },
      { title: 'Line B', variant: { title: 'Live via Zoom', product: { title: 'Program 2', metadata: {} } } },
      { title: 'Line C', variant: null },
    ],
    ...overrides,
  }
}

const wf = loadWorkflow('medusa-order-to-vtiger.json')
const n8nEnv = { VTIGER_URL: 'https://crm.test/', VTIGER_USERNAME: 'webservice', VTIGER_ACCESS_KEY: 'KEY' }

function n8nPrepared(o: OrderSnapshot) {
  return wf.run('Prepare: Extract Order Data', { input: { headers: {}, body: o }, env: n8nEnv })
}

function n8nSession(o: OrderSnapshot) {
  const prep = n8nPrepared(o)
  return wf.run('Prepare: Session', {
    input: { success: true, result: { sessionName: 's', userId: '19x1' } },
    nodes: { 'Prepare: Build Login Hash': prep },
  })
}

/** Evaluates the n8n IF node "Validate: Required Fields" for a webhook item. */
function n8nValid(o: Record<string, unknown>): boolean {
  const conds = (wf.params('Validate: Required Fields').conditions as { conditions: Array<{ leftValue: string; operator: { operation: string }; rightValue: string }> }).conditions
  return conds.every((c) => {
    const expr = c.leftValue.replace(/^=\{\{\s*/, '').replace(/\s*\}\}$/, '')
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const value = (new Function('$json', `return ${expr}`) as ($json: unknown) => unknown)({ body: o })
    if (c.operator.operation === 'notEmpty') return typeof value === 'string' && value !== ''
    if (c.operator.operation === 'gte') return value !== undefined && value !== null && Number(value) >= Number(c.rightValue)
    throw new Error(`unhandled operator ${c.operator.operation}`)
  })
}

// ---------------------------------------------------------------------------
// Parity with infra/n8n/workflows/medusa-order-to-vtiger.json
// ---------------------------------------------------------------------------

describe('parity with medusa-order-to-vtiger.json', () => {
  it.each([
    ['customer with names', order()],
    ['guest: names on the billing address', order({ customer: { email: 'guest@example.com' } })],
    ['no names: email local part', order({ customer: { email: 'lonely@example.com' }, billing_address: null })],
    ['no created_at: time of receipt', order({ created_at: null })],
    ['voucher order, total 0', order({ total: 0 })],
  ])('prepares the order like "Prepare: Extract Order Data" (%s)', (_label, o) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-06T09:00:00Z'))
    try {
      const n8n = n8nPrepared(o)
      const ours = prepareOrderForVtiger(o, new Date())
      expect(ours).toEqual({
        email: n8n.email,
        firstName: n8n.firstName,
        lastName: n8n.lastName,
        totalZar: n8n.totalZar,
        createdAt: n8n.createdAt,
        productNames: n8n.productNames,
        orderId: n8n.orderId,
        displayId: n8n.displayId,
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it.each([
    ['valid', order(), true],
    ['no email', order({ customer: { email: '' } }), false],
    ['no customer', order({ customer: null }), false],
    ['total 0 (voucher)', order({ total: 0 }), true],
    ['negative total', order({ total: -1 }), false],
  ])('validates like the n8n IF node (%s)', (_label, o, expected) => {
    expect(n8nValid(o as unknown as Record<string, unknown>)).toBe(expected)
    expect(orderValidForVtiger(o)).toBe(expected)
  })

  it('looks the contact up with the same VTQL', () => {
    const session = n8nSession(order({ customer: { email: "o'neil@example.com" } }))
    const template = (wf.params('Vtiger: Find Contact').queryParameters as { parameters: Array<{ name: string; value: string }> })
      .parameters.find((p) => p.name === 'query')!.value
    const n8nQuery = template.replace(/^=/, '').replace('{{ $json.safeEmail }}', String(session.safeEmail))
    expect(findContactQuery(prepareOrderForVtiger(order({ customer: { email: "o'neil@example.com" } })).email)).toBe(n8nQuery)
  })

  it.each([
    ['customer with names', order()],
    ['guest, no names', order({ customer: { email: 'guest@example.com' }, billing_address: null })],
    ['voucher', order({ total: 0 })],
  ])('new contact: same element as "Prepare: New Contact Payload" (%s)', (_label, o) => {
    const session = n8nSession(o)
    const n8n = wf.run('Prepare: New Contact Payload', { input: {}, nodes: { 'Prepare: Session': session } })
    expect(newOrderContactElement(prepareOrderForVtiger(o), '19x1')).toEqual(JSON.parse(n8n.element as string))
  })

  it.each([
    ['spend accumulates', { id: '12x188', firstname: 'QA', lastname: 'SelfTest', email: 'qa.buyer@example.com', assigned_user_id: '19x5', cf_total_spend_zar: '1660.00' }],
    ['blank spend and lastname', { id: '12x188', firstname: 'QA', lastname: '', email: 'qa.buyer@example.com', assigned_user_id: '19x5', cf_total_spend_zar: '' }],
    ['no assigned user, odd spend text', { id: '12x188', firstname: 'QA', lastname: 'SelfTest', email: 'qa.buyer@example.com', cf_total_spend_zar: 'abc' }],
  ])('existing contact: same element as "Prepare: Update Existing Contact" (%s)', (_label, existing) => {
    const o = order()
    const session = n8nSession(o)
    const n8n = wf.run('Prepare: Update Existing Contact', {
      input: {},
      nodes: { 'Prepare: Session': session, 'Vtiger: Find Contact': { success: true, result: [existing] } },
    })
    expect(existingOrderContactElement(existing, prepareOrderForVtiger(o), '19x1')).toEqual(JSON.parse(n8n.element as string))
  })

  it('Event: same element as "Prepare: Activity Payload" (n8n container ran in UTC)', () => {
    const o = order()
    const prep = { ...n8nSession(o), contactId: '12x900' }
    const n8n = JSON.parse(wf.run('Prepare: Activity Payload', { input: prep }).element as string) as Record<string, string>
    const ours = orderEventElement(prepareOrderForVtiger(o), '12x900', '19x1') as Record<string, string>
    if (new Date(0).getTimezoneOffset() === 0) {
      expect(ours).toEqual(n8n)
    } else {
      // n8n used toTimeString() (container local time; the container is UTC). Ours is always UTC.
      const { time_start: _a, time_end: _b, ...n8nRest } = n8n
      const { time_start, time_end, ...oursRest } = ours
      expect(oursRest).toEqual(n8nRest)
      expect(time_start).toBe('08:15:30')
      expect(time_end).toBe('08:15:30')
    }
    expect(ours.subject).toBe('Purchase - Program 1, Program 2 - Live via Zoom, Line C, R3315.00')
  })

  it('n8n wrote with update (full replace); we use revise with the same fields', () => {
    const op = (wf.params('Vtiger: Upsert Contact').bodyParameters as { parameters: Array<{ name: string; value: string }> })
      .parameters.find((p) => p.name === 'operation')!.value
    expect(op).toContain("'update'")
  })
})

// ---------------------------------------------------------------------------
// Behaviour against a fake Vtiger
// ---------------------------------------------------------------------------

describe('syncOrderToVtiger', () => {
  it('new buyer: creates the contact (Shop, Closed Won, spend) and one Event', async () => {
    const fake = makeFakeVtiger()
    const res = await syncOrderToVtiger(client(fake), prepareOrderForVtiger(order()), {})
    expect(res.created).toBe(true)
    expect(fake.created.map((c) => c.elementType)).toEqual(['Contacts', 'Events'])
    expect(fake.created[0]!.element).toMatchObject({
      email: 'qa.buyer@example.com',
      leadsource: 'Shop',
      cf_pipeline_stage: 'Closed Won',
      cf_total_spend_zar: '3315.00',
      cf_last_purchase_date: '2026-10-06',
      assigned_user_id: '19x1',
    })
    expect(fake.created[1]!.element).toMatchObject({ contact_id: res.contactId, eventstatus: 'Held', activitytype: 'Call' })
  })

  it('existing contact: revise (not update) with the spend added, other fields kept', async () => {
    const fake = makeFakeVtiger({
      contacts: [{ id: '12x188', email: 'qa.buyer@example.com', firstname: 'QA', lastname: 'SelfTest', mobile: '082', cf_total_spend_zar: '1000.00', assigned_user_id: '19x5' }],
    })
    const res = await syncOrderToVtiger(client(fake), prepareOrderForVtiger(order()), {})
    expect(res).toMatchObject({ contactId: '12x188', created: false })
    expect(fake.ops()).toContain('revise')
    expect(fake.ops()).not.toContain('update')
    expect(fake.contacts[0]).toMatchObject({ cf_total_spend_zar: '4315.00', mobile: '082', cf_pipeline_stage: 'Closed Won' })
  })

  it('instance without revise: read-merge-update keeps every field', async () => {
    const fake = makeFakeVtiger({
      unknownOperations: ['revise'],
      contacts: [{ id: '12x188', email: 'qa.buyer@example.com', firstname: 'QA', lastname: 'SelfTest', mobile: '082', cf_total_spend_zar: '0' }],
    })
    await syncOrderToVtiger(client(fake), prepareOrderForVtiger(order()), {})
    expect(fake.ops()).toContain('update')
    expect(fake.contacts[0]).toMatchObject({ mobile: '082', cf_total_spend_zar: '3315.00' })
  })

  it('a retry after a failed Event does not add the order total twice', async () => {
    const fake = makeFakeVtiger({
      contacts: [{ id: '12x188', email: 'qa.buyer@example.com', firstname: 'QA', lastname: 'SelfTest', cf_total_spend_zar: '1000.00' }],
      failures: { create: [new Response('down', { status: 503 }), new Response('down', { status: 503 }), new Response('down', { status: 503 })] },
    })
    const state: OrderVtigerState = {}
    const c = client(fake, { retries: 2 })
    await expect(syncOrderToVtiger(c, prepareOrderForVtiger(order()), state)).rejects.toMatchObject({ retriable: true })
    expect(state.contactId).toBe('12x188')
    expect(fake.contacts[0]!.cf_total_spend_zar).toBe('4315.00')

    await syncOrderToVtiger(c, prepareOrderForVtiger(order()), state)
    expect(fake.contacts[0]!.cf_total_spend_zar).toBe('4315.00')
    expect(fake.ops().filter((o) => o === 'revise')).toHaveLength(1)
    expect(state.eventId).toMatch(/^18x/)
  })

  it('the same order twice with its state does nothing the second time', async () => {
    const fake = makeFakeVtiger()
    const state: OrderVtigerState = {}
    await syncOrderToVtiger(client(fake), prepareOrderForVtiger(order()), state)
    const calls = fake.calls.length
    await syncOrderToVtiger(client(fake), prepareOrderForVtiger(order()), state)
    // only a fresh login of the new client, no query or write
    expect(fake.calls.slice(calls).map((c) => c.operation)).toEqual(['getchallenge', 'login'])
  })

  it('saves after the contact step and after the Event', async () => {
    const fake = makeFakeVtiger()
    const save = vi.fn(async () => {})
    await syncOrderToVtiger(client(fake), prepareOrderForVtiger(order()), {}, { save })
    expect(save).toHaveBeenCalledTimes(2)
  })

  it('Vtiger down at login: throws a retriable error, nothing written', async () => {
    const down = () => new Response('', { status: 502 })
    const fake = makeFakeVtiger({ failures: { getchallenge: [down(), down(), down()] } })
    const state: OrderVtigerState = {}
    await expect(syncOrderToVtiger(client(fake, { retries: 2 }), prepareOrderForVtiger(order()), state)).rejects.toMatchObject({ retriable: true })
    expect(state).toEqual({})
    expect(fake.created).toEqual([])
  })

  it('dry run: no network, fake ids, create branch', async () => {
    const fetchImpl = vi.fn()
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const c = VtigerClient.fromEnv({ AUTOMATION_DRY_RUN: 'true' }, { fetchImpl, logger })
    const res = await syncOrderToVtiger(c, prepareOrderForVtiger(order()), {})
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(res.contactId).toMatch(/^dryrun-/)
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain('qa.buyer@example.com')
  })
})
