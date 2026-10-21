import { describe, it, expect, vi, beforeEach } from 'vitest'

const { logError } = vi.hoisted(() => ({ logError: vi.fn() }))
vi.mock('@/lib/log', () => ({ logError }))

import {
  parseBookingEvent,
  recordBookingEvent,
  runSessionBookingRecord,
  type SessionBookingRow,
  type SessionBookingStore,
} from './session-bookings'
import { liveBookings } from './appointments'

function live(store: { rows: Map<string, SessionBookingRow> }): string[] {
  return liveBookings([...store.rows.values()]).map((r) => r.booking_uid)
}

function memoryStore(): SessionBookingStore & { rows: Map<string, SessionBookingRow> } {
  const rows = new Map<string, SessionBookingRow>()
  return {
    rows,
    async get(uid) {
      return rows.get(uid) ?? null
    },
    async wasRescheduledFrom(uid) {
      return [...rows.values()].some((r) => r.rescheduled_from_uid === uid)
    },
    async uidByCalId(calId, exceptUid) {
      return [...rows.values()].find((r) => r.cal_booking_id === calId && r.booking_uid !== exceptUid)?.booking_uid ?? null
    },
    async insertIfAbsent(row) {
      if (!rows.has(row.booking_uid)) rows.set(row.booking_uid, { ...row })
    },
    async markCancelled(uid, at) {
      const row = rows.get(uid)
      if (row && row.status !== 'cancelled') rows.set(uid, { ...row, status: 'cancelled', cancelled_at: at })
    },
    async setRescheduledFrom(uid, from) {
      const row = rows.get(uid)
      if (row && row.rescheduled_from_uid === null) rows.set(uid, { ...row, rescheduled_from_uid: from })
    },
  }
}

const CREATED = {
  triggerEvent: 'BOOKING_CREATED',
  payload: {
    uid: 'bk_1',
    bookingId: 101,
    type: 'session-60',
    title: 'Session (60 min) between Dr Suzanne Ravenall and Johan QA Test',
    length: 60,
    startTime: '2026-11-03T08:00:00.000Z',
    endTime: '2026-11-03T09:00:00.000Z',
    attendees: [{ email: 'Johan+Appt@Example.com', name: 'Johan QA Test' }],
    metadata: { videoCallUrl: 'https://meet.example.com/abc' },
  },
}

const RESCHEDULED = {
  triggerEvent: 'BOOKING_RESCHEDULED',
  payload: {
    ...CREATED.payload,
    uid: 'bk_2',
    bookingId: 102,
    rescheduleUid: 'bk_1',
    startTime: '2026-11-05T10:00:00.000Z',
    endTime: '2026-11-05T11:00:00.000Z',
  },
}

const CANCELLED_NEW = {
  triggerEvent: 'BOOKING_CANCELLED',
  payload: { ...RESCHEDULED.payload, rescheduleUid: undefined, status: 'CANCELLED' },
}

function event(body: unknown) {
  const parsed = parseBookingEvent(body)
  if (!parsed) throw new Error('payload did not parse')
  return parsed
}

describe('parseBookingEvent', () => {
  it('reads the v1 payload: uid, lower-cased email, slug, times, video link', () => {
    expect(event(CREATED)).toMatchObject({
      trigger: 'BOOKING_CREATED',
      uid: 'bk_1',
      email: 'johan+appt@example.com',
      slug: 'session-60',
      durationMinutes: 60,
      start: '2026-11-03T08:00:00.000Z',
      end: '2026-11-03T09:00:00.000Z',
      calId: 101,
      location: 'https://meet.example.com/abc',
      previousUid: null,
    })
  })

  it('reads the v2 field names', () => {
    const parsed = event({
      triggerEvent: 'BOOKING_CREATED',
      payload: { bookingUid: 'bk_v2', eventTypeSlug: 'session-45', start: '2026-11-03T08:00:00Z', end: '2026-11-03T08:45:00Z', bookerEmail: 'sam@example.com' },
    })
    expect(parsed).toMatchObject({ uid: 'bk_v2', slug: 'session-45', durationMinutes: 45, email: 'sam@example.com' })
  })

  it('names the booking a reschedule replaced', () => {
    expect(event(RESCHEDULED).previousUid).toBe('bk_1')
  })

  it('drops a Cal.com internal location', () => {
    const parsed = event({ ...CREATED, payload: { ...CREATED.payload, metadata: {}, location: 'integrations:daily' } })
    expect(parsed.location).toBeNull()
  })

  it('returns null for other triggers or a payload without uid, email or start', () => {
    expect(parseBookingEvent({ ...CREATED, triggerEvent: 'MEETING_ENDED' })).toBeNull()
    expect(parseBookingEvent({ ...CREATED, payload: { ...CREATED.payload, uid: '' } })).toBeNull()
    expect(parseBookingEvent({ ...CREATED, payload: { ...CREATED.payload, attendees: [] } })).toBeNull()
    expect(parseBookingEvent({ ...CREATED, payload: { ...CREATED.payload, startTime: 'soon' } })).toBeNull()
    expect(parseBookingEvent('nope')).toBeNull()
  })
})

describe('recordBookingEvent', () => {
  let store: ReturnType<typeof memoryStore>
  beforeEach(() => {
    store = memoryStore()
  })

  it('stores a new booking as booked', async () => {
    expect(await recordBookingEvent(store, event(CREATED))).toBe('created')
    expect(store.rows.get('bk_1')).toMatchObject({ status: 'booked', attendee_email: 'johan+appt@example.com', event_slug: 'session-60' })
  })

  it('is idempotent on a replayed BOOKING_CREATED', async () => {
    await recordBookingEvent(store, event(CREATED))
    expect(await recordBookingEvent(store, event(CREATED))).toBe('ignored-replay')
    expect(store.rows.size).toBe(1)
    expect(store.rows.get('bk_1')?.status).toBe('booked')
  })

  it('adds the rescheduled booking pointing at the one it replaced', async () => {
    await recordBookingEvent(store, event(CREATED))
    expect(await recordBookingEvent(store, event(RESCHEDULED))).toBe('rescheduled')
    expect(live(store)).toEqual(['bk_2'])
    expect(store.rows.get('bk_2')).toMatchObject({
      status: 'rescheduled',
      rescheduled_from_uid: 'bk_1',
      start_time: '2026-11-05T10:00:00.000Z',
    })
  })

  it('is idempotent on a replayed reschedule and ignores a late replay of the old create', async () => {
    await recordBookingEvent(store, event(CREATED))
    await recordBookingEvent(store, event(RESCHEDULED))
    await recordBookingEvent(store, event(RESCHEDULED))
    expect(await recordBookingEvent(store, event(CREATED))).toBe('ignored-replay')
    expect(store.rows.size).toBe(2)
    expect(live(store)).toEqual(['bk_2'])
  })

  it('keeps the trail on a chained reschedule, so a late event for the first uid changes nothing', async () => {
    await recordBookingEvent(store, event(CREATED))
    await recordBookingEvent(store, event(RESCHEDULED))
    const again = { ...RESCHEDULED, payload: { ...RESCHEDULED.payload, uid: 'bk_3', bookingId: 103, rescheduleUid: 'bk_2' } }
    await recordBookingEvent(store, event(again))
    expect(await recordBookingEvent(store, event(CREATED))).toBe('ignored-replay')
    expect(await recordBookingEvent(store, event({ ...CREATED, triggerEvent: 'BOOKING_CANCELLED' }))).toBe('ignored-replay')
    expect(live(store)).toEqual(['bk_3'])
  })

  it('links the replaced booking by Cal.com id when the payload has no old uid', async () => {
    await recordBookingEvent(store, event(CREATED))
    const byId = { ...RESCHEDULED, payload: { ...RESCHEDULED.payload, rescheduleUid: undefined, rescheduleId: 101 } }
    await recordBookingEvent(store, event(byId))
    expect(store.rows.get('bk_2')?.rescheduled_from_uid).toBe('bk_1')
    expect(live(store)).toEqual(['bk_2'])
  })

  it('keeps a cancel that beat its create (out of order delivery)', async () => {
    await recordBookingEvent(store, event({ ...CREATED, triggerEvent: 'BOOKING_CANCELLED' }))
    expect(await recordBookingEvent(store, event(CREATED))).toBe('ignored-replay')
    expect(store.rows.get('bk_1')?.status).toBe('cancelled')
  })

  it('still links a reschedule whose new booking was cancelled before the reschedule arrived', async () => {
    await recordBookingEvent(store, event(CREATED))
    await recordBookingEvent(store, event(CANCELLED_NEW))
    await recordBookingEvent(store, event(RESCHEDULED))
    expect(store.rows.get('bk_2')).toMatchObject({ status: 'cancelled', rescheduled_from_uid: 'bk_1' })
    expect(live(store)).toEqual(['bk_2'])
  })

  it('ignores the cancel of the old half of a reschedule', async () => {
    await recordBookingEvent(store, event(CREATED))
    await recordBookingEvent(store, event(RESCHEDULED))
    const oldCancel = { ...CREATED, triggerEvent: 'BOOKING_CANCELLED' }
    expect(await recordBookingEvent(store, event(oldCancel))).toBe('ignored-replay')
    expect(store.rows.get('bk_2')?.status).toBe('rescheduled')
  })

  it('marks a cancelled booking cancelled and keeps it on a replay', async () => {
    await recordBookingEvent(store, event(CREATED))
    await recordBookingEvent(store, event(RESCHEDULED))
    expect(await recordBookingEvent(store, event(CANCELLED_NEW))).toBe('cancelled')
    const firstCancelledAt = store.rows.get('bk_2')?.cancelled_at
    expect(store.rows.get('bk_2')).toMatchObject({ status: 'cancelled', rescheduled_from_uid: 'bk_1' })
    expect(firstCancelledAt).toBeTruthy()

    expect(await recordBookingEvent(store, event(CANCELLED_NEW))).toBe('ignored-replay')
    expect(store.rows.get('bk_2')?.cancelled_at).toBe(firstCancelledAt)
    expect(live(store)).toEqual(['bk_2'])
  })

  it('never revives a cancelled booking on a late BOOKING_CREATED', async () => {
    await recordBookingEvent(store, event(CREATED))
    await recordBookingEvent(store, event({ ...CREATED, triggerEvent: 'BOOKING_CANCELLED' }))
    expect(await recordBookingEvent(store, event(CREATED))).toBe('ignored-replay')
    expect(store.rows.get('bk_1')?.status).toBe('cancelled')
  })

  it('stores a cancel whose create was never seen', async () => {
    await recordBookingEvent(store, event({ ...CREATED, triggerEvent: 'BOOKING_CANCELLED' }))
    expect(store.rows.get('bk_1')?.status).toBe('cancelled')
  })
})

describe('runSessionBookingRecord', () => {
  beforeEach(() => logError.mockReset())

  it('skips a payload it cannot read without touching the store', async () => {
    const store = memoryStore()
    expect(await runSessionBookingRecord({ triggerEvent: 'BOOKING_CREATED', payload: {} }, store)).toBe('invalid-payload')
    expect(store.rows.size).toBe(0)
  })

  it('logs a database failure with the booking uid only and never throws', async () => {
    const store = memoryStore()
    store.insertIfAbsent = async () => {
      throw new Error('relation "session_bookings" does not exist')
    }
    expect(await runSessionBookingRecord(CREATED, store)).toBe('failed')
    expect(logError).toHaveBeenCalledWith(
      '[session-bookings] booking could not be stored',
      expect.any(Error),
      { bookingUid: 'bk_1', trigger: 'BOOKING_CREATED' },
    )
  })

  it('reports failed when the Supabase env is missing', async () => {
    expect(await runSessionBookingRecord(CREATED, null)).toBe('failed')
  })
})
