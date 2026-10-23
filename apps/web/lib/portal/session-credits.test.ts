import { describe, it, expect } from 'vitest'
import {
  bookingSessionMinutes,
  computeSessionCredits,
  sessionsPerUnit,
  type BookingForCredit,
  type PurchasedSessionLine,
} from './session-credits'

const RR = 'Resonance Repatterning / Coaching Session'
const EXEC = 'Executive Coaching Session'

function line(productTitle: string, variantTitle: string, purchasedAt = '2026-10-01T08:00:00Z', quantity = 1): PurchasedSessionLine {
  return { productTitle, variantTitle, purchasedAt, quantity }
}

let n = 0
function booking(slug: string | null, status = 'booked', start = '2026-11-01T08:00:00Z'): BookingForCredit {
  n += 1
  return { booking_uid: `bk_${n}`, event_slug: slug, status, start_time: start }
}

describe('sessionsPerUnit', () => {
  it.each([
    ['Package of 04 (60 min online)', 4],
    ['Package of 05', 5],
    ['Package of 08 (90 min online)', 8],
    ['package of 12', 12],
    ['Package of 16 (45 min)', 16],
    ['60 min online', 1],
    ['', 1],
    [null, 1],
  ])('reads "%s" as %i sessions', (title, expected) => {
    expect(sessionsPerUnit(title)).toBe(expected)
  })
})

describe('bookingSessionMinutes', () => {
  it('reads the length from a session slug and ignores other events', () => {
    expect(bookingSessionMinutes('session-60')).toBe(60)
    expect(bookingSessionMinutes('discovery-call')).toBeNull()
    expect(bookingSessionMinutes(null)).toBeNull()
  })
})

describe('computeSessionCredits', () => {
  it('gives a Package of 04 four sessions and counts one booking against it', () => {
    const { credits } = computeSessionCredits([line(RR, 'Package of 04 (60 min online)')], [booking('session-60')])
    expect(credits).toEqual([
      expect.objectContaining({ service: RR, durationMinutes: 60, total: 4, used: 1, remaining: 3 }),
    ])
  })

  it('gives a single session one credit, times the line quantity', () => {
    const { credits } = computeSessionCredits([line(RR, '90 min online', undefined, 2)], [])
    expect(credits[0]).toMatchObject({ durationMinutes: 90, total: 2, remaining: 2 })
  })

  it('does not count cancelled bookings', () => {
    const { credits } = computeSessionCredits(
      [line(RR, 'Package of 04 (60 min online)')],
      [booking('session-60', 'cancelled'), booking('session-60', 'rescheduled')],
    )
    expect(credits[0]).toMatchObject({ used: 1, remaining: 3 })
  })

  it('ignores bookings on events that are not paid sessions', () => {
    const { credits } = computeSessionCredits([line(RR, '60 min online')], [booking('discovery-call')])
    expect(credits[0]).toMatchObject({ used: 0, remaining: 1 })
  })

  it('never goes below zero when more sessions are booked than bought', () => {
    const { credits } = computeSessionCredits(
      [line(RR, '60 min online')],
      [booking('session-60'), booking('session-60'), booking('session-60')],
    )
    expect(credits[0]).toMatchObject({ total: 1, used: 1, remaining: 0 })
  })

  it('keeps mixed services apart by session length', () => {
    const { credits, serviceByBooking } = computeSessionCredits(
      [line(RR, 'Package of 04 (60 min online)', '2026-09-01T08:00:00Z'), line(EXEC, '90 min online', '2026-10-01T08:00:00Z')],
      [booking('session-90', 'booked', '2026-11-02T08:00:00Z'), booking('session-60', 'booked', '2026-11-03T08:00:00Z')],
    )
    expect(credits).toEqual([
      expect.objectContaining({ service: RR, durationMinutes: 60, total: 4, remaining: 3 }),
      expect.objectContaining({ service: EXEC, durationMinutes: 90, total: 1, remaining: 0 }),
    ])
    expect([...serviceByBooking.values()].sort()).toEqual([EXEC, RR])
  })

  it('uses the oldest purchase first when two services share a length', () => {
    const { credits } = computeSessionCredits(
      [line(EXEC, '60 min online', '2026-10-05T08:00:00Z'), line(RR, '60 min online', '2026-09-01T08:00:00Z')],
      [booking('session-60')],
    )
    expect(credits.map((c) => [c.service, c.remaining])).toEqual([
      [RR, 0],
      [EXEC, 1],
    ])
  })

  it('falls back to any purchase with room when the member booked another length', () => {
    const { credits } = computeSessionCredits([line(RR, 'Package of 04 (60 min online)')], [booking('session-30')])
    expect(credits[0]).toMatchObject({ used: 1, remaining: 3 })
  })

  it('adds a repeat purchase of the same service and length to one entry', () => {
    const { credits } = computeSessionCredits(
      [line(RR, 'Package of 04 (60 min online)'), line(RR, '60 min online', '2026-10-10T08:00:00Z')],
      [],
    )
    expect(credits).toHaveLength(1)
    expect(credits[0]).toMatchObject({ total: 5, remaining: 5 })
  })

  it('returns nothing for a member without session purchases', () => {
    expect(computeSessionCredits([], [booking('session-60')]).credits).toEqual([])
  })

  it('gives credits in the order bookings were made, so the newest one is left uncovered (J-07)', () => {
    const first = { ...booking('session-60', 'booked', '2026-11-20T08:00:00Z'), created_at: '2026-10-23T08:00:00Z' }
    const late = { ...booking('session-60', 'booked', '2026-11-02T08:00:00Z'), created_at: '2026-10-23T09:00:00Z' }
    const { credits, serviceByBooking } = computeSessionCredits([line(RR, '60 min online')], [late, first])
    expect(credits[0]?.remaining).toBe(0)
    expect(serviceByBooking.has(first.booking_uid)).toBe(true)
    expect(serviceByBooking.has(late.booking_uid)).toBe(false)
  })

  it('does not count an over_limit booking against the package', () => {
    const { credits } = computeSessionCredits([line(RR, 'Package of 04 (60 min online)')], [booking('session-60'), booking('session-60', 'over_limit')])
    expect(credits[0]).toMatchObject({ used: 1, remaining: 3 })
  })
})
