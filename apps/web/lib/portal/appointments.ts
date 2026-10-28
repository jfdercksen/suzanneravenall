import { sessionBookingUrl, type SessionBooker } from '@suzanne/integrations'
import { bookingSessionMinutes, computeSessionCredits, type PurchasedSessionLine } from './session-credits'
import type { SessionBookingStatus } from './session-bookings'

// What /portal/appointments and the dashboard card show (I-13). Built on the
// server, labels included, so the times read the same (SAST) whatever zone
// the member's browser is in and nothing differs at hydration.

/** The columns a member may read (raw_payload stays server side). */
export const MEMBER_BOOKING_COLUMNS =
  'booking_uid, rescheduled_from_uid, event_slug, title, duration_minutes, start_time, end_time, status, location, created_at, no_show_at, late_change_at, late_change_kind, late_change_by_staff, credit_restored_at, over_limit_at'

/** What happened to a session under the session rules (D024). */
export type SessionOutcome = 'no_show' | 'late_cancel' | 'late_move' | null

export interface MemberBookingRow {
  booking_uid: string
  rescheduled_from_uid: string | null
  event_slug: string | null
  title: string | null
  duration_minutes: number | null
  start_time: string
  end_time: string
  status: SessionBookingStatus
  location: string | null
  created_at?: string | null
  no_show_at?: string | null
  late_change_at?: string | null
  late_change_kind?: 'cancelled' | 'rescheduled' | null
  late_change_by_staff?: boolean | null
  credit_restored_at?: string | null
  over_limit_at?: string | null
}

export interface AppointmentView {
  uid: string
  service: string
  dateLabel: string
  timeLabel: string
  durationLabel: string
  status: SessionBookingStatus
  /** Cal.com pages; only for upcoming bookings that are not cancelled */
  rescheduleUrl: string | null
  cancelUrl: string | null
  /** Video link or address from Cal.com */
  joinUrl: string | null
  /** No-show or late change (D024); null for an ordinary booking */
  outcome: SessionOutcome
  /** Staff gave the session back after a no-show or late change */
  creditRestored: boolean
}

export interface SessionsToBookView {
  key: string
  service: string
  durationLabel: string
  remaining: number
  total: number
  /** Null once every session of this purchase is booked */
  bookUrl: string | null
}

export interface AppointmentsView {
  upcoming: AppointmentView[]
  past: AppointmentView[]
  toBook: SessionsToBookView[]
}

export const SAST = 'Africa/Johannesburg'
const PAST_WINDOW_DAYS = 365

const DATE_FORMAT = new Intl.DateTimeFormat('en-ZA', {
  timeZone: SAST,
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const TIME_FORMAT = new Intl.DateTimeFormat('en-ZA', {
  timeZone: SAST,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function formatSastDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso))
}

/** "14:00 SAST" */
export function formatSastTime(iso: string): string {
  return `${TIME_FORMAT.format(new Date(iso))} SAST`
}

/** "14:00 - 15:00 SAST" */
export function formatSastTimes(startIso: string, endIso: string): string {
  return `${TIME_FORMAT.format(new Date(startIso))} - ${TIME_FORMAT.format(new Date(endIso))} SAST`
}

function minutesOf(row: MemberBookingRow): number {
  if (row.duration_minutes && row.duration_minutes > 0) return row.duration_minutes
  return Math.max(0, Math.round((new Date(row.end_time).getTime() - new Date(row.start_time).getTime()) / 60_000))
}

/**
 * The bookings that are still the member's: a row that a later reschedule
 * points at (rescheduled_from_uid) is the moved-away half and is dropped.
 */
export function liveBookings<T extends Pick<MemberBookingRow, 'booking_uid' | 'rescheduled_from_uid'>>(rows: readonly T[]): T[] {
  const replaced = new Set(rows.map((row) => row.rescheduled_from_uid).filter((uid): uid is string => Boolean(uid)))
  return rows.filter((row) => !replaced.has(row.booking_uid))
}

/**
 * The bookings the credit sums count: the live ones plus every booking that
 * was moved away late (D024). That row is the session the client lost, so it
 * keeps its credit even though the new booking replaced it on the calendar.
 */
export function creditBookings<
  T extends Pick<MemberBookingRow, 'booking_uid' | 'rescheduled_from_uid' | 'late_change_at' | 'credit_restored_at'>,
>(rows: readonly T[]): T[] {
  const live = new Set(liveBookings(rows))
  return rows.filter((row) => live.has(row) || (Boolean(row.late_change_at) && !row.credit_restored_at))
}

/** A late move lives on the row the booking moved away from; it is shown in Past. */
function isLateMove(row: MemberBookingRow): boolean {
  return Boolean(row.late_change_at) && row.late_change_kind === 'rescheduled'
}

function outcomeOf(row: MemberBookingRow): SessionOutcome {
  // A no-show mark on a cancelled booking uses no session, so it is not shown.
  if (row.no_show_at && row.status !== 'cancelled') return 'no_show'
  // A staff change that stayed given back is an ordinary move or cancel to the client.
  if (!row.late_change_at || row.over_limit_at || (row.late_change_by_staff && row.credit_restored_at)) return null
  return row.late_change_kind === 'rescheduled' ? 'late_move' : 'late_cancel'
}

// A Cal.com title reads "Session (60 min) between Dr Suzanne Ravenall and ...";
// the part before "between" names the event.
export function eventName(row: Pick<MemberBookingRow, 'title' | 'event_slug'>): string {
  const title = row.title?.split(/\s+between\s+/i)[0]?.trim()
  if (title) return title
  return bookingSessionMinutes(row.event_slug) ? 'Private session' : 'Appointment'
}

/** The Cal.com base the booking pages live under, e.g. http://host:3002. */
export function calBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_CAL_URL || 'https://cal.suzanneravenall.com').replace(/\/+$/, '')
}

/** The Cal.com user page the session event types hang off (as in the order mail). */
export function sessionBookingBase(): string {
  return process.env.CALCOM_SESSION_BOOKING_URL || `${calBaseUrl()}/suzanneravenall`
}

export interface BuildOptions {
  now: Date
  calBase: string
  sessionBase: string
  booker: SessionBooker
  /** "<service>|<minutes>" -> the member's /book link for that pool (J-07) */
  gateLinks?: ReadonlyMap<string, string>
}

export function buildAppointmentsView(
  allBookings: readonly MemberBookingRow[],
  lines: readonly PurchasedSessionLine[],
  { now, calBase, sessionBase, booker, gateLinks }: BuildOptions,
): AppointmentsView {
  const bookings = liveBookings(allBookings)
  const { credits, serviceByBooking } = computeSessionCredits(lines, creditBookings(allBookings))
  const liveSet = new Set(bookings)
  // Moved away late: no longer on the calendar, but the session was used.
  const lateMoves = allBookings.filter((row) => !liveSet.has(row) && isLateMove(row))
  const nowMs = now.getTime()
  const pastFrom = nowMs - PAST_WINDOW_DAYS * 24 * 60 * 60_000

  // The same query the Cal.com booking mails carry, so Cal.com records who
  // made the change.
  const by = booker.email?.trim()
  const rescheduleQuery = by ? `?${new URLSearchParams({ rescheduledBy: by })}` : ''
  const cancelQuery = new URLSearchParams({ cancel: 'true', allRemainingBookings: 'false', ...(by ? { cancelledBy: by } : {}) }).toString()

  // The service a session of this length was bought for (oldest purchase).
  const serviceForLength = (row: MemberBookingRow): string | null => {
    const minutes = bookingSessionMinutes(row.event_slug)
    if (minutes === null) return null
    return credits.find((c) => c.durationMinutes === minutes)?.service ?? credits[0]?.service ?? null
  }

  const toView = (row: MemberBookingRow, upcoming: boolean): AppointmentView => {
    const live = upcoming && row.status !== 'cancelled' && !row.no_show_at
    // A booking past the package limit can be cancelled, not moved.
    const movable = live && row.status !== 'over_limit'
    const uid = encodeURIComponent(row.booking_uid)
    return {
      uid: row.booking_uid,
      service: serviceByBooking.get(row.booking_uid) ?? serviceForLength(row) ?? eventName(row),
      dateLabel: formatSastDate(row.start_time),
      timeLabel: formatSastTimes(row.start_time, row.end_time),
      durationLabel: `${minutesOf(row)} min`,
      status: row.status,
      rescheduleUrl: movable ? `${calBase}/reschedule/${uid}${rescheduleQuery}` : null,
      cancelUrl: live ? `${calBase}/booking/${uid}?${cancelQuery}` : null,
      joinUrl: movable ? row.location : null,
      outcome: outcomeOf(row),
      creditRestored: Boolean(row.credit_restored_at),
    }
  }

  const byStart = [...bookings].sort((a, b) => a.start_time.localeCompare(b.start_time))
  const upcoming = byStart
    .filter((row) => row.status !== 'cancelled' && new Date(row.end_time).getTime() > nowMs)
    .map((row) => toView(row, true))
  // Finished sessions, every cancelled one and every late move, newest first,
  // last 12 months.
  const finishedOrCancelled = byStart.filter(
    (row) => new Date(row.end_time).getTime() <= nowMs || row.status === 'cancelled',
  )
  const past = [...finishedOrCancelled, ...lateMoves]
    .filter((row) => new Date(row.start_time).getTime() >= pastFrom)
    .sort((a, b) => b.start_time.localeCompare(a.start_time))
    .map((row) => toView(row, false))

  // Fully booked purchases stay listed ("0 of 4 left") without a button.
  const toBook = credits
    .sort((a, b) => Number(b.remaining > 0) - Number(a.remaining > 0))
    .map((credit) => ({
      key: `${credit.service}-${credit.durationMinutes}`,
      service: credit.service,
      durationLabel: `${credit.durationMinutes} min`,
      remaining: credit.remaining,
      total: credit.total,
      // The /book gate counts again at click time; the direct Cal.com link
      // only for purchases made before the gate existed.
      bookUrl:
        credit.remaining > 0
          ? (gateLinks?.get(`${credit.service}|${credit.durationMinutes}`) ?? sessionBookingUrl(sessionBase, credit.line, booker))
          : null,
    }))

  return { upcoming, past, toBook }
}
