import { sessionBookingUrl, type SessionLine } from '@suzanne/integrations'
import { getServiceRoleClient } from '@/lib/quiz/subscriber'
import { logError } from '@/lib/log'
import { siteUrl } from '@/lib/email/site-url'
import { sendBookingOverLimitEmail } from '@/lib/email/booking-over-limit'
import { sendStaffAlert } from '@/lib/integrations/staff-alert'
import { calBaseUrl, creditBookings, formatSastDate, formatSastTimes, liveBookings, sessionBookingBase } from '@/lib/portal/appointments'
import {
  bookingSessionMinutes,
  computeSessionCredits,
  usesCredit,
  type BookingForCredit,
  type PurchasedSessionLine,
  type SessionCredit,
} from '@/lib/portal/session-credits'
import { fetchMemberSessionLines } from '@/lib/portal/session-orders'
import type { BookingEvent } from '@/lib/portal/session-bookings'
import { findBookingToken, type BookingTokenRecord } from './tokens'

/**
 * Booking limits per session package (J-07, DECISIONS.md D022).
 *
 * The Cal.com image has no API, so a booking cannot be refused or cancelled
 * from code. Two layers instead:
 * 1. The gate: /book/<token> counts the sessions left and only then sends the
 *    client on to the Cal.com event (token as booking metadata). At zero it
 *    says the package is fully booked.
 * 2. The flag: the webhook checks every new session booking with the same
 *    sums. One past the limit (made on the public event page, or two tabs
 *    racing the gate) is stored as over_limit, uses no credit, and the client
 *    and staff are mailed; staff cancel it in Cal.com.
 *
 * Credits are per email across all of the client's orders, the same sums the
 * portal shows ("2 of 4 left").
 */

/** Cal.com booking metadata key that carries the gate token. */
export const TOKEN_METADATA_KEY = 'bt'

interface BookingRowForLimit extends BookingForCredit {
  rescheduled_from_uid: string | null
  end_time?: string | null
}

/** Statuses that hold a slot and can be flagged over_limit. */
const FLAGGABLE: ReadonlySet<string> = new Set(['booked', 'rescheduled'])

export interface LimitDeps {
  /** Session lines from Medusa; null when Medusa could not be read */
  lines(email: string): Promise<PurchasedSessionLine[] | null>
  /** Every session_bookings row for this address */
  bookings(email: string): Promise<BookingRowForLimit[]>
}

const BOOKING_COLUMNS =
  'booking_uid, rescheduled_from_uid, event_slug, status, start_time, end_time, created_at, no_show_at, late_change_at, credit_restored_at, over_limit_at'

async function readBookingsForEmail(email: string): Promise<BookingRowForLimit[]> {
  const supabase = getServiceRoleClient()
  if (!supabase) throw new Error('Supabase service-role client is not configured')
  const { data, error } = await supabase
    .from('session_bookings')
    .select(BOOKING_COLUMNS)
    .eq('attendee_email', email.trim().toLowerCase())
    .limit(1000)
  if (error) throw new Error(`session_bookings read failed: ${error.message}`)
  return (data ?? []) as BookingRowForLimit[]
}

export const defaultLimitDeps: LimitDeps = {
  lines: fetchMemberSessionLines,
  bookings: readBookingsForEmail,
}

export interface CreditState {
  credits: SessionCredit[]
  serviceByBooking: Map<string, string>
  /** Live session bookings holding a slot that no credit covers */
  uncovered: BookingRowForLimit[]
  /** Medusa could not be read; `credits` came from the fallback lines */
  ordersUnavailable: boolean
}

/** The credit sums for an address; `fallback` stands in for Medusa when it is down. */
export async function creditStateFor(
  email: string,
  deps: LimitDeps = defaultLimitDeps,
  fallback: PurchasedSessionLine[] = [],
): Promise<CreditState> {
  const [lines, rows] = await Promise.all([deps.lines(email), deps.bookings(email)])
  const live = liveBookings(rows)
  // A session moved away late still holds its credit (D024).
  const { credits, serviceByBooking } = computeSessionCredits(lines ?? fallback, creditBookings(rows))
  const uncovered = live.filter(
    (row) =>
      FLAGGABLE.has(row.status) &&
      usesCredit(row) &&
      bookingSessionMinutes(row.event_slug) !== null && !serviceByBooking.has(row.booking_uid),
  )
  return { credits, serviceByBooking, uncovered, ordersUnavailable: lines === null }
}

/**
 * The pool a link books into: same service and length, else (a product
 * renamed since the order) a pool of that length, the same fallback the
 * credit sums use for a booking of a length nobody bought.
 */
export function poolFor(credits: readonly SessionCredit[], record: Pick<BookingTokenRecord, 'service_name' | 'duration_minutes'>): SessionCredit | null {
  return (
    credits.find((c) => c.service === record.service_name && c.durationMinutes === record.duration_minutes) ??
    credits.find((c) => c.durationMinutes === record.duration_minutes && c.remaining > 0) ??
    credits.find((c) => c.durationMinutes === record.duration_minutes) ??
    null
  )
}

/**
 * The token row as a purchased line, for when Medusa cannot be read. `credits`
 * already counts the package size and quantity, so the package words come off
 * the variant (the minutes stay) and the line carries credits as quantity.
 */
export function tokenAsLine(record: BookingTokenRecord): PurchasedSessionLine {
  return {
    productTitle: record.service_name,
    productHandle: record.product_handle,
    variantTitle: record.variant_title?.replace(/package\s+of\s+0*\d+/i, '').trim() || null,
    quantity: record.credits,
    purchasedAt: record.created_at,
  }
}

/** The Cal.com event for this link, buyer filled in, token as booking metadata. */
export function calcomUrlForToken(record: BookingTokenRecord, base: string = sessionBookingBase()): string {
  const line: SessionLine = {
    productTitle: record.service_name,
    productHandle: record.product_handle,
    variantTitle: record.variant_title,
  }
  const url = new URL(sessionBookingUrl(base, line, { name: record.customer_name, email: record.customer_email }))
  url.searchParams.set(`metadata[${TOKEN_METADATA_KEY}]`, record.token)
  return url.toString()
}

export type GateDecision =
  | { kind: 'open'; url: string; remaining: number; total: number; tokenId: string }
  | { kind: 'full'; total: number }
  | { kind: 'invalid' }

/** What /book/<token> does: send on to Cal.com, or say the package is fully booked. */
export async function decideGate(token: string, deps: LimitDeps = defaultLimitDeps): Promise<GateDecision> {
  const record = await findBookingToken(token)
  if (!record) return { kind: 'invalid' }

  // Fallback when Medusa is down: this order line alone.
  const state = await creditStateFor(record.customer_email, deps, [tokenAsLine(record)])
  if (state.ordersUnavailable) {
    logError('[booking-gate] Medusa unreadable; gate used the order line alone', undefined, { tokenId: record.id })
  }
  const pool = poolFor(state.credits, record)
  if (!pool || pool.remaining <= 0) return { kind: 'full', total: pool?.total ?? record.credits }
  return { kind: 'open', url: calcomUrlForToken(record), remaining: pool.remaining, total: pool.total, tokenId: record.id }
}

/** The link a booking came through, read from its Cal.com metadata. */
export function tokenFromPayload(payload: Record<string, unknown>): string | null {
  const meta = payload.metadata
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null
  const value = (meta as Record<string, unknown>)[TOKEN_METADATA_KEY]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

export interface OverLimitDeps extends LimitDeps {
  /** UPDATE status = over_limit WHERE uid AND status IN (booked, rescheduled); true when this call changed it */
  markOverLimit(uid: string, at: Date): Promise<boolean>
  mailClient: typeof sendBookingOverLimitEmail
  alertStaff: typeof sendStaffAlert
}

async function markOverLimitInDb(uid: string, at: Date): Promise<boolean> {
  const supabase = getServiceRoleClient()
  if (!supabase) throw new Error('Supabase service-role client is not configured')
  const { data, error } = await supabase
    .from('session_bookings')
    .update({ status: 'over_limit', over_limit_at: at.toISOString() })
    .eq('booking_uid', uid)
    .in('status', ['booked', 'rescheduled'])
    .select('booking_uid')
  if (error) throw new Error(`session_bookings over_limit update failed: ${error.message}`)
  return Array.isArray(data) && data.length > 0
}

export const defaultOverLimitDeps: OverLimitDeps = {
  ...defaultLimitDeps,
  markOverLimit: markOverLimitInDb,
  mailClient: sendBookingOverLimitEmail,
  alertStaff: sendStaffAlert,
}

export type LimitOutcome = 'within' | 'over-limit' | 'not-a-session' | 'unknown' | 'failed'

/**
 * Checks a newly stored BOOKING_CREATED or BOOKING_RESCHEDULED. Never throws.
 * Credits go in booking order, so the bookings left uncovered are the newest
 * ones. Every uncovered booking of the address is flagged, not only this
 * event's: when two bookings commit out of order, the check of the first to
 * land can run before the other exists, and the other's check then sees the
 * first as the newer one. A replay changes nothing (the update needs a
 * slot-holding status, and the mails follow only the call that changed it).
 */
export async function checkBookingLimit(
  event: BookingEvent,
  creditEmail: string,
  deps: OverLimitDeps = defaultOverLimitDeps,
  now: Date = new Date(),
): Promise<LimitOutcome> {
  if (bookingSessionMinutes(event.slug) === null) return 'not-a-session'
  try {
    const state = await creditStateFor(creditEmail, deps)
    if (state.uncovered.length === 0) return 'within'
    if (state.ordersUnavailable) {
      // Cannot tell a real over-booking from a Medusa outage: ask a human.
      await deps.alertStaff({
        key: `booking-limit-unknown:${event.uid}`,
        subject: 'Session booking could not be checked against the package',
        lines: [
          `Cal.com booking UID: ${event.uid}`,
          `Booked for: ${formatSastDate(event.start)}, ${formatSastTimes(event.start, event.end)}`,
          'Medusa could not be read, so the paid sessions could not be counted. Check the client has a session left; if not, cancel the booking in Cal.com.',
        ],
      })
      return 'unknown'
    }

    const client = {
      email: event.email,
      firstName: event.name?.trim().split(/\s+/)[0] || null,
      hasPackage: state.credits.length > 0,
    }
    let thisOne = false
    for (const row of state.uncovered) {
      const isEvent = row.booking_uid === event.uid
      if (isEvent) thisOne = true
      if (!(await deps.markOverLimit(row.booking_uid, now))) continue
      const start = isEvent ? event.start : row.start_time
      const end = isEvent ? event.end : row.end_time || endFrom(row)
      await notifyOverLimit(row.booking_uid, start, end, client, deps)
    }
    return thisOne ? 'over-limit' : 'within'
  } catch (error) {
    logError('[booking-limits] limit check failed', error, { bookingUid: event.uid })
    return 'failed'
  }
}

/**
 * Re-counts an address after staff count a given-back session as used again
 * (D024): a booking that the give-back had covered is flagged over_limit and
 * mailed like any other. Never throws.
 */
export async function recheckLimits(
  email: string,
  firstName: string | null,
  deps: OverLimitDeps = defaultOverLimitDeps,
  now: Date = new Date(),
): Promise<'within' | 'over-limit' | 'unknown' | 'failed'> {
  try {
    const state = await creditStateFor(email, deps)
    if (state.uncovered.length === 0) return 'within'
    if (state.ordersUnavailable) return 'unknown'
    const client = { email, firstName, hasPackage: state.credits.length > 0 }
    for (const row of state.uncovered) {
      if (!(await deps.markOverLimit(row.booking_uid, now))) continue
      await notifyOverLimit(row.booking_uid, row.start_time, row.end_time || endFrom(row), client, deps)
    }
    return 'over-limit'
  } catch (error) {
    logError('[booking-limits] re-check failed', error)
    return 'failed'
  }
}

function endFrom(row: BookingRowForLimit): string {
  const minutes = bookingSessionMinutes(row.event_slug) ?? 60
  return new Date(new Date(row.start_time).getTime() + minutes * 60_000).toISOString()
}

async function notifyOverLimit(
  uid: string,
  start: string,
  end: string,
  client: { email: string; firstName: string | null; hasPackage: boolean },
  deps: Pick<OverLimitDeps, 'mailClient' | 'alertStaff'>,
): Promise<void> {
  const dateLabel = formatSastDate(start)
  const timeLabel = formatSastTimes(start, end)
  try {
    await deps.mailClient({
      email: client.email,
      firstName: client.firstName,
      dateLabel,
      timeLabel,
      hasPackage: client.hasPackage,
      buyMoreUrl: `${siteUrl()}/services`,
      appointmentsUrl: `${siteUrl()}/portal/appointments`,
    })
  } catch (error) {
    logError('[booking-limits] over-limit client mail failed', error, { bookingUid: uid })
  }
  await deps.alertStaff({
    key: `booking-over-limit:${uid}`,
    subject: "Cancel a session booking past the client's package",
    lines: [
      `Cal.com booking UID: ${uid}`,
      `Booked for: ${dateLabel}, ${timeLabel}`,
      client.hasPackage
        ? 'Every session the client paid for is already booked. The client has been told by mail that this booking will be cancelled.'
        : 'The client has no session purchase with a session left. The client has been told by mail that this booking will be cancelled.',
      'Until it is cancelled in Cal.com the slot stays taken on the calendar.',
      `Cancel it in Cal.com: ${calBaseUrl()}/booking/${encodeURIComponent(uid)}`,
    ],
  })
  console.info(`[booking-limits] ${uid}: over_limit`)
}
