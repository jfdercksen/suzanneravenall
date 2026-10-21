import { describe, it, expect } from 'vitest'
import { buildAppointmentsView, formatSastTimes, type MemberBookingRow } from './appointments'

const NOW = new Date('2026-10-21T10:00:00Z')
const OPTS = {
  now: NOW,
  calBase: 'http://cal.test:3002',
  sessionBase: 'http://cal.test:3002/suzanneravenall',
  booker: { name: 'Johan QA Test', email: 'johan+appt1021@aiautomations.co.za' },
}
const PACKAGE = {
  productTitle: 'Resonance Repatterning / Coaching Session',
  variantTitle: 'Package of 04 (60 min online)',
  purchasedAt: '2026-10-21T08:00:00Z',
  quantity: 1,
}

function row(uid: string, start: string, overrides: Partial<MemberBookingRow> = {}): MemberBookingRow {
  const end = new Date(new Date(start).getTime() + 60 * 60_000).toISOString()
  return {
    booking_uid: uid,
    rescheduled_from_uid: null,
    event_slug: 'session-60',
    title: 'Session (60 min) between Dr Suzanne Ravenall and Johan QA Test',
    duration_minutes: 60,
    start_time: start,
    end_time: end,
    status: 'booked',
    location: null,
    ...overrides,
  }
}

describe('formatSastTimes', () => {
  it('shows times in South African time', () => {
    expect(formatSastTimes('2026-11-03T08:00:00Z', '2026-11-03T09:00:00Z')).toBe('10:00 - 11:00 SAST')
  })
})

describe('buildAppointmentsView', () => {
  it('splits upcoming and past, and counts remaining sessions (1 booked of a Package of 04)', () => {
    const view = buildAppointmentsView([row('bk_next', '2026-11-03T08:00:00Z')], [PACKAGE], OPTS)
    expect(view.upcoming).toHaveLength(1)
    expect(view.upcoming[0]).toMatchObject({
      uid: 'bk_next',
      service: 'Resonance Repatterning / Coaching Session',
      timeLabel: '10:00 - 11:00 SAST',
      durationLabel: '60 min',
      rescheduleUrl: 'http://cal.test:3002/reschedule/bk_next?rescheduledBy=johan%2Bappt1021%40aiautomations.co.za',
      cancelUrl:
        'http://cal.test:3002/booking/bk_next?cancel=true&allRemainingBookings=false&cancelledBy=johan%2Bappt1021%40aiautomations.co.za',
    })
    expect(view.past).toEqual([])
    expect(view.toBook).toEqual([
      expect.objectContaining({
        remaining: 3,
        total: 4,
        bookUrl: 'http://cal.test:3002/suzanneravenall/session-60?name=Johan+QA+Test&email=johan%2Bappt1021%40aiautomations.co.za',
      }),
    ])
  })

  it('puts a cancelled booking under past without links and gives its session back', () => {
    const view = buildAppointmentsView([row('bk_x', '2026-11-03T08:00:00Z', { status: 'cancelled' })], [PACKAGE], OPTS)
    expect(view.upcoming).toEqual([])
    expect(view.past).toEqual([
      expect.objectContaining({
        uid: 'bk_x',
        status: 'cancelled',
        service: 'Resonance Repatterning / Coaching Session',
        rescheduleUrl: null,
        cancelUrl: null,
      }),
    ])
    expect(view.toBook[0]).toMatchObject({ remaining: 4, total: 4 })
  })

  it('lists past sessions newest first and drops those older than 12 months', () => {
    const view = buildAppointmentsView(
      [row('old', '2025-09-01T08:00:00Z'), row('a', '2026-09-01T08:00:00Z'), row('b', '2026-10-01T08:00:00Z')],
      [],
      OPTS,
    )
    expect(view.past.map((p) => p.uid)).toEqual(['b', 'a'])
  })

  it('keeps a fully booked purchase without a Book Now link', () => {
    const single = { ...PACKAGE, variantTitle: '60 min online' }
    const view = buildAppointmentsView([row('bk', '2026-11-03T08:00:00Z')], [single], OPTS)
    expect(view.toBook[0]).toMatchObject({ remaining: 0, total: 1, bookUrl: null })
  })

  it('names a non-session appointment by its Cal.com event', () => {
    const view = buildAppointmentsView(
      [row('dc', '2026-11-03T08:00:00Z', { event_slug: 'discovery-call', title: 'Discovery Call between Dr Suzanne Ravenall and Johan QA Test' })],
      [],
      OPTS,
    )
    expect(view.upcoming[0]?.service).toBe('Discovery Call')
  })

  it('hides the old half of a reschedule, so the session counts once', () => {
    const view = buildAppointmentsView(
      [row('bk_a', '2026-11-03T08:00:00Z'), row('bk_b', '2026-11-05T08:00:00Z', { status: 'rescheduled', rescheduled_from_uid: 'bk_a' })],
      [PACKAGE],
      OPTS,
    )
    expect(view.upcoming.map((u) => u.uid)).toEqual(['bk_b'])
    expect(view.toBook[0]).toMatchObject({ remaining: 3, total: 4 })
  })

  it('is empty for a member with nothing', () => {
    expect(buildAppointmentsView([], [], OPTS)).toEqual({ upcoming: [], past: [], toBook: [] })
  })
})
