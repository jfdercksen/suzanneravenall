import { sessionDurationMinutes, type SessionDuration, type SessionLine } from '@suzanne/integrations'

/**
 * Paid sessions still to book (I-13, /portal/appointments).
 *
 * Credits come from the member's session order lines: "Package of N" gives N
 * sessions, any other session variant one, times the line quantity. Every
 * booking on a session-NN Cal.com event that is not cancelled or over_limit
 * uses one, and so does a no-show or a late cancellation or move (D024) unless
 * staff gave that session back. Bookings take credits in the order they were made (created_at,
 * else start time), so the booking past the limit is always the newest one
 * (J-07). A booking is matched to the oldest purchase of the same length that
 * still has room, else to the oldest purchase with room at all (a member who
 * picked another length still used a session), so mixed services stay apart
 * and the remaining count never drops below zero. The /book gate, the
 * webhook's over-limit check and the portal all use these sums.
 */

export interface PurchasedSessionLine extends SessionLine {
  /** Order date, ISO; older purchases are used first */
  purchasedAt: string
  quantity?: number | null
}

export interface BookingForCredit {
  booking_uid: string
  event_slug: string | null
  status: string
  start_time: string
  /** When the booking reached us; decides which booking is past the limit */
  created_at?: string | null
  /** Staff marked the client as a no-show (D024) */
  no_show_at?: string | null
  /** Cancelled or moved with less than 48 working hours to go (D024) */
  late_change_at?: string | null
  /** Staff gave the session back */
  credit_restored_at?: string | null
  /** Was past the package (J-07); stays set when the booking is later cancelled */
  over_limit_at?: string | null
}

/**
 * Whether a booking uses a session: a held slot does (a no-show included), an
 * over_limit booking does not, a cancelled one only when it was cancelled
 * late, and none once staff gave the session back. A late move keeps its
 * credit through the row it moved away from (appointments.ts creditBookings).
 */
export function usesCredit(
  b: Pick<BookingForCredit, 'status' | 'no_show_at' | 'late_change_at' | 'credit_restored_at' | 'over_limit_at'>,
): boolean {
  if (b.credit_restored_at) return false
  if (b.status === 'over_limit') return false
  // A cancelled booking counts only when it was cancelled late. A no-show
  // mark on one does not: the session was never held (Shayna, 27 Oct: a
  // no-show set on a booking we had already cancelled took her last session).
  if (b.status === 'cancelled' && b.over_limit_at) return false
  if (b.status === 'cancelled') return Boolean(b.late_change_at)
  return true
}

export interface SessionCredit {
  /** Product title: the service the sessions were bought for */
  service: string
  durationMinutes: SessionDuration
  total: number
  used: number
  remaining: number
  /** The line the Book Now link is built from (same mapping as the order mail) */
  line: SessionLine
}

const PACKAGE = /package\s+of\s+0*(\d+)/i
const SESSION_SLUG = /^session-(\d+)$/i

/** Sessions one unit of this variant buys: "Package of 04" = 4, otherwise 1. */
export function sessionsPerUnit(variantTitle: string | null | undefined): number {
  const match = PACKAGE.exec(variantTitle ?? '')
  const size = match ? Number(match[1]) : 1
  return size > 0 ? size : 1
}

/** The length a booking was made for, from its session-NN slug; null for any other event. */
export function bookingSessionMinutes(slug: string | null | undefined): number | null {
  const match = SESSION_SLUG.exec(slug ?? '')
  return match ? Number(match[1]) : null
}

function serviceOf(line: SessionLine): string {
  return line.productTitle?.trim() || line.variantTitle?.trim() || 'Private session'
}

export interface SessionCreditResult {
  credits: SessionCredit[]
  /** booking uid -> the service whose session it used */
  serviceByBooking: Map<string, string>
}

export function computeSessionCredits(
  lines: readonly PurchasedSessionLine[],
  bookings: readonly BookingForCredit[],
): SessionCreditResult {
  // One pool per (service, length), in order of first purchase.
  const pools: SessionCredit[] = []
  const byKey = new Map<string, SessionCredit>()
  const sorted = [...lines].sort((a, b) => a.purchasedAt.localeCompare(b.purchasedAt))

  for (const line of sorted) {
    const quantity = line.quantity && line.quantity > 0 ? line.quantity : 1
    const credits = sessionsPerUnit(line.variantTitle) * quantity
    const service = serviceOf(line)
    const durationMinutes = sessionDurationMinutes(line)
    const key = `${service}\u0000${durationMinutes}`
    const pool = byKey.get(key)
    if (pool) {
      pool.total += credits
      pool.remaining += credits
      continue
    }
    const created: SessionCredit = { service, durationMinutes, total: credits, used: 0, remaining: credits, line }
    byKey.set(key, created)
    pools.push(created)
  }

  const used = bookings
    .filter(usesCredit)
    .map((b) => ({
      uid: b.booking_uid,
      minutes: bookingSessionMinutes(b.event_slug),
      order: new Date(b.created_at || b.start_time).getTime(),
    }))
    .filter((b): b is { uid: string; minutes: number; order: number } => b.minutes !== null)
    .sort((a, b) => a.order - b.order)

  const serviceByBooking = new Map<string, string>()
  for (const booking of used) {
    const pool =
      pools.find((p) => p.remaining > 0 && p.durationMinutes === booking.minutes) ?? pools.find((p) => p.remaining > 0)
    if (!pool) continue
    pool.used += 1
    pool.remaining -= 1
    serviceByBooking.set(booking.uid, pool.service)
  }

  return { credits: pools, serviceByBooking }
}
