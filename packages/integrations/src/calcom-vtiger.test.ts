// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, vi } from 'vitest'
import { VtigerClient } from './vtiger'
import {
  bookingEventElement,
  findBookingEventQuery,
  parseCalcomBooking,
  syncBookingToVtiger,
  syncBookingWithRetry,
  DISCOVERY_CALL_STAGE,
} from './calcom-vtiger'
import { makeFakeVtiger, type FakeVtigerOptions } from './test-utils'

const V1_BODY = {
  triggerEvent: 'BOOKING_CREATED',
  createdAt: '2026-10-16T08:00:00.000Z',
  payload: {
    uid: 'bk_v1_abc123',
    title: 'Discovery Call between Dr Suzanne Ravenall and Jane Smith',
    startTime: '2026-10-20T09:00:00.000Z',
    endTime: '2026-10-20T09:45:00.000Z',
    attendees: [{ email: ' Jane.Smith@Example.com ', name: 'Jane van der Smith', timeZone: 'Africa/Johannesburg' }],
    organizer: { email: 'organiser@example.test', name: 'Organiser' },
  },
}

const V2_BODY = {
  triggerEvent: 'BOOKING_CREATED',
  payload: {
    bookingUid: 'bk_v2_xyz789',
    eventTitle: 'Discovery Call',
    start: '2026-10-21T13:30:00.000Z',
    end: '2026-10-21T14:00:00.000Z',
    bookerEmail: 'sam@example.com',
    bookerName: 'Sam',
  },
}

const ALL_FIELDS = { Contacts: ['id', 'email', 'firstname', 'lastname', 'leadsource', 'cf_pipeline_stage'] }

function client(opts: FakeVtigerOptions = {}) {
  const fake = makeFakeVtiger({ fields: ALL_FIELDS, ...opts })
  const c = new VtigerClient({
    url: 'https://crm.test',
    username: 'u',
    accessKey: 'k',
    fetchImpl: fake.fetchImpl,
    sleep: async () => {},
    retries: 0,
  })
  return { fake, c }
}

// ---------------------------------------------------------------------------
// Parity with the n8n "Prepare: Extract Booking Data" node
// ---------------------------------------------------------------------------

type N8nNode = { name: string; parameters: Record<string, unknown> }
const workflowPath = fileURLToPath(new URL('../../../infra/n8n/workflows/calcom-booking-to-vtiger.json', import.meta.url))
const workflow = JSON.parse(readFileSync(workflowPath, 'utf8')) as { nodes: N8nNode[] }

function n8nPrepared(body: unknown): Record<string, unknown> {
  const node = workflow.nodes.find((n) => n.name === 'Prepare: Extract Booking Data')
  if (!node) throw new Error('n8n node not found')
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function('$input', '$env', node.parameters.jsCode as string) as (...a: unknown[]) => Array<{ json: Record<string, unknown> }>
  return fn({ first: () => ({ json: body }) }, { VTIGER_URL: 'x', VTIGER_USERNAME: 'u', VTIGER_ACCESS_KEY: 'k' })[0]!.json
}

describe('parseCalcomBooking', () => {
  it('reads the v1 shape the same way as the n8n node', () => {
    const n8n = n8nPrepared(V1_BODY)
    const ours = parseCalcomBooking(V1_BODY)!
    expect(ours.email).toBe(n8n.email)
    expect(ours.firstName).toBe(n8n.firstName)
    expect(ours.lastName).toBe(n8n.lastName)
    expect(ours.title).toBe(n8n.eventTitle)
    expect(ours.uid).toBe(n8n.bookingUid)
    expect(ours.start.toISOString()).toBe(n8n.startTime)
    expect(ours.durationMinutes).toBe(45)
  })

  it('reads the v2 shape (bookingUid, eventTitle, start/end, bookerEmail)', () => {
    const ours = parseCalcomBooking(V2_BODY)!
    const n8n = n8nPrepared({ payload: { ...V2_BODY.payload, startTime: V2_BODY.payload.start } })
    expect(ours).toMatchObject({ uid: 'bk_v2_xyz789', email: 'sam@example.com', firstName: 'Sam', lastName: '', title: 'Discovery Call' })
    expect(ours.email).toBe(n8n.email)
    expect(ours.uid).toBe(n8n.bookingUid)
    expect(ours.durationMinutes).toBe(30)
  })

  it('reads a body without the payload wrapper', () => {
    expect(parseCalcomBooking({ ...V2_BODY.payload, triggerEvent: 'BOOKING_CREATED' })?.uid).toBe('bk_v2_xyz789')
  })

  it('defaults to 30 minutes when the end time is missing or not after the start', () => {
    const { endTime: _drop, ...noEnd } = V1_BODY.payload
    expect(parseCalcomBooking({ payload: noEnd })?.durationMinutes).toBe(30)
    expect(parseCalcomBooking({ payload: { ...V1_BODY.payload, endTime: V1_BODY.payload.startTime } })?.durationMinutes).toBe(30)
  })

  it('returns null without an email, start time or booking UID', () => {
    expect(parseCalcomBooking({ payload: { ...V1_BODY.payload, attendees: [] } })).toBeNull()
    expect(parseCalcomBooking({ payload: { ...V1_BODY.payload, startTime: 'not a date' } })).toBeNull()
    expect(parseCalcomBooking({ payload: { ...V1_BODY.payload, uid: '' } })).toBeNull()
    expect(parseCalcomBooking('nope')).toBeNull()
  })
})

describe('bookingEventElement', () => {
  it('builds an Event with the duration, the UID marker and the assigned user', () => {
    const booking = parseCalcomBooking(V1_BODY)!
    expect(bookingEventElement(booking, '12x7', '19x1')).toEqual({
      activitytype: 'Call',
      subject: 'Discovery Call - Discovery Call between Dr Suzanne Ravenall and Jane Smith',
      description: 'Cal.com booking UID: bk_v1_abc123',
      assigned_user_id: '19x1',
      contact_id: '12x7',
      date_start: '2026-10-20',
      time_start: '09:00:00',
      due_date: '2026-10-20',
      time_end: '09:45:00',
      duration_hours: '0',
      duration_minutes: '45',
      eventstatus: 'Planned',
    })
  })

  it('splits long bookings into hours and minutes', () => {
    const booking = parseCalcomBooking({ payload: { ...V1_BODY.payload, endTime: '2026-10-20T10:30:00.000Z' } })!
    expect(bookingEventElement(booking, 'c', 'u')).toMatchObject({ duration_hours: '1', duration_minutes: '30' })
  })

  it('escapes the UID in the idempotency query', () => {
    expect(findBookingEventQuery("a'b")).toBe("SELECT id FROM Events WHERE description LIKE '%Cal.com booking UID: a\\'b%' LIMIT 1;")
  })
})

describe('syncBookingToVtiger', () => {
  it('creates a new contact with lead source and stage, then one Event', async () => {
    const { fake, c } = client()
    const res = await syncBookingToVtiger(c, parseCalcomBooking(V1_BODY)!)
    expect(res).toMatchObject({ created: true, replay: false, missingFields: [] })
    const contact = fake.created.find((x) => x.elementType === 'Contacts')!.element
    expect(contact).toEqual({
      email: 'jane.smith@example.com',
      firstname: 'Jane',
      lastname: 'van der Smith',
      assigned_user_id: '19x1',
      leadsource: 'Discovery Call',
      cf_pipeline_stage: DISCOVERY_CALL_STAGE,
    })
    const events = fake.created.filter((x) => x.elementType === 'Events')
    expect(events).toHaveLength(1)
    expect(events[0]!.element.contact_id).toBe(res.contactId)
    expect(fake.ops()).not.toContain('revise')
  })

  it('revises an existing contact to the booked stage and keeps its mandatory fields and lead source', async () => {
    const { fake, c } = client({
      contacts: [{ id: '12x188', email: 'jane.smith@example.com', firstname: 'Jane', lastname: 'Smith', leadsource: 'Shop', assigned_user_id: '19x5', phone: '082' }],
    })
    const res = await syncBookingToVtiger(c, parseCalcomBooking(V1_BODY)!)
    expect(res).toMatchObject({ contactId: '12x188', created: false })
    const revise = fake.calls.find((x) => x.operation === 'revise')!
    expect(JSON.parse(revise.params.element!)).toEqual({
      id: '12x188',
      assigned_user_id: '19x5',
      firstname: 'Jane',
      lastname: 'Smith',
      email: 'jane.smith@example.com',
      leadsource: 'Shop',
      cf_pipeline_stage: DISCOVERY_CALL_STAGE,
    })
    expect(fake.contacts[0]!.phone).toBe('082')
    // Order as in n8n: contact, Event, then the stage.
    const ops = fake.ops()
    expect(ops.lastIndexOf('create')).toBeLessThan(ops.indexOf('revise'))
  })

  it('falls back to read-merge-update when revise is not available', async () => {
    const { fake, c } = client({
      contacts: [{ id: '12x188', email: 'jane.smith@example.com', firstname: 'Jane', lastname: 'Smith', phone: '082' }],
      unknownOperations: ['revise'],
    })
    await syncBookingToVtiger(c, parseCalcomBooking(V1_BODY)!)
    expect(fake.contacts[0]).toMatchObject({ phone: '082', cf_pipeline_stage: DISCOVERY_CALL_STAGE })
  })

  it('is idempotent: a replayed booking UID adds no second contact or Event, and re-applies the stage', async () => {
    const { fake, c } = client()
    const booking = parseCalcomBooking(V1_BODY)!
    const first = await syncBookingToVtiger(c, booking)
    const second = await syncBookingToVtiger(c, booking)
    expect(second).toMatchObject({ contactId: first.contactId, eventId: first.eventId, replay: true, created: false })
    expect(fake.created.filter((x) => x.elementType === 'Events')).toHaveLength(1)
    expect(fake.created.filter((x) => x.elementType === 'Contacts')).toHaveLength(1)
    expect(fake.contacts[0]!.cf_pipeline_stage).toBe(DISCOVERY_CALL_STAGE)
  })

  it('applies the stage on a replay whose earlier delivery failed at the stage step', async () => {
    const { fake, c } = client({
      contacts: [{ id: '12x188', email: 'jane.smith@example.com', firstname: 'Jane', lastname: 'Smith', cf_pipeline_stage: 'New Lead' }],
      events: [{ id: '18x9', description: 'Cal.com booking UID: bk_v1_abc123' }],
    })
    const res = await syncBookingToVtiger(c, parseCalcomBooking(V1_BODY)!)
    expect(res).toMatchObject({ eventId: '18x9', replay: true })
    expect(fake.created).toHaveLength(0)
    expect(fake.contacts[0]!.cf_pipeline_stage).toBe(DISCOVERY_CALL_STAGE)
  })

  it('keeps every field when describe fails, and does not cache an empty describe', async () => {
    const bad = new Response(JSON.stringify({ success: false, error: { code: 'ACCESS_DENIED', message: 'no' } }))
    const { fake, c } = client({ failures: { describe: [bad] }, fields: {} })
    await syncBookingToVtiger(c, parseCalcomBooking(V1_BODY)!)
    expect(fake.created.find((x) => x.elementType === 'Contacts')!.element.cf_pipeline_stage).toBe(DISCOVERY_CALL_STAGE)
    await c.fieldNames('Contacts')
    await c.fieldNames('Contacts')
    expect(fake.ops().filter((o) => o === 'describe')).toHaveLength(3)
  })

  it('leaves out cf_pipeline_stage when the instance does not have it, and reports it', async () => {
    const { fake, c } = client({ fields: { Contacts: ['email', 'firstname', 'lastname', 'leadsource'] } })
    const res = await syncBookingToVtiger(c, parseCalcomBooking(V2_BODY)!)
    expect(res.missingFields).toEqual(['cf_pipeline_stage'])
    expect(fake.created.find((x) => x.elementType === 'Contacts')!.element).not.toHaveProperty('cf_pipeline_stage')
  })

  it('describes Contacts once per client', async () => {
    const { fake, c } = client()
    await syncBookingToVtiger(c, parseCalcomBooking(V1_BODY)!)
    await syncBookingToVtiger(c, parseCalcomBooking(V2_BODY)!)
    expect(fake.ops().filter((o) => o === 'describe')).toHaveLength(1)
  })
})

describe('syncBookingWithRetry', () => {
  const fail = () => new Response(JSON.stringify({ success: false, error: { code: 'DATABASE_QUERY_ERROR', message: 'x' } }))

  it('retries a failed Event without creating the contact twice', async () => {
    const fake = makeFakeVtiger({ fields: ALL_FIELDS })
    const booking = parseCalcomBooking(V1_BODY)!
    // Contact create succeeds, the first Event create fails.
    let creates = 0
    const original = fake.fetchImpl
    const flaky = async (input: string, init?: RequestInit) => {
      const body = String(init?.body ?? '')
      if (body.includes('operation=create') && body.includes('elementType=Events') && creates++ === 0) return fail()
      return original(input, init)
    }
    const c2 = new VtigerClient({ url: 'https://crm.test', username: 'u', accessKey: 'k', fetchImpl: flaky, retries: 0, sleep: async () => {} })
    const sleep = vi.fn(async () => {})
    const res = await syncBookingWithRetry(c2, booking, { sleep })
    expect(res.created).toBe(true)
    expect(fake.created.filter((x) => x.elementType === 'Contacts')).toHaveLength(1)
    expect(fake.created.filter((x) => x.elementType === 'Events')).toHaveLength(1)
    expect(sleep).toHaveBeenCalledTimes(1)
  })

  it('makes the first try plus 3 retries with backoff, then throws the last error', async () => {
    const { c } = client({ failures: { query: [fail(), fail(), fail(), fail()] } })
    const sleep = vi.fn(async () => {})
    const onAttemptFailed = vi.fn()
    await expect(syncBookingWithRetry(c, parseCalcomBooking(V1_BODY)!, { sleep, onAttemptFailed })).rejects.toThrow(/DATABASE_QUERY_ERROR/)
    expect(onAttemptFailed).toHaveBeenCalledTimes(4)
    expect(sleep.mock.calls.map((x) => (x as unknown[])[0])).toEqual([2_000, 10_000, 30_000])
  })
})
