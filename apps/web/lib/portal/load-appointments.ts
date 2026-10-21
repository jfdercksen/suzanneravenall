import type { SupabaseClient, User } from '@supabase/supabase-js'
import { bookerName } from '@suzanne/integrations'
import { logError } from '@/lib/log'
import {
  buildAppointmentsView,
  calBaseUrl,
  eventName,
  formatSastDate,
  formatSastTimes,
  MEMBER_BOOKING_COLUMNS,
  liveBookings,
  sessionBookingBase,
  type AppointmentsView,
  type MemberBookingRow,
} from './appointments'
import { fetchMemberSessionLines } from './session-orders'

export interface MemberAppointments extends AppointmentsView {
  /** Medusa could not be read: the to-book list is unknown, not empty */
  ordersUnavailable: boolean
  /** session_bookings could not be read */
  bookingsUnavailable: boolean
}

export interface NextAppointment {
  service: string
  dateLabel: string
  timeLabel: string
}

// Only a confirmed address proves ownership of the orders and bookings made
// with it (same rule as /portal/programmes; RLS checks it again).
function confirmedEmail(user: User): string | null {
  return user.email && user.email_confirmed_at ? user.email.toLowerCase() : null
}

async function readBookings(supabase: SupabaseClient): Promise<MemberBookingRow[] | null> {
  // RLS returns only the member's own rows; no email filter needed, but the
  // explicit columns matter: raw_payload is not granted to members.
  const { data, error } = await supabase
    .from('session_bookings')
    .select(MEMBER_BOOKING_COLUMNS)
    .order('start_time', { ascending: false })
    .limit(500)
  if (error) {
    logError('[portal/appointments] session_bookings read failed', error)
    return null
  }
  return (data ?? []) as MemberBookingRow[]
}

export async function loadMemberAppointments(supabase: SupabaseClient, user: User): Promise<MemberAppointments> {
  const email = confirmedEmail(user)
  if (!email) {
    return { upcoming: [], past: [], toBook: [], ordersUnavailable: false, bookingsUnavailable: false }
  }

  const [bookings, lines] = await Promise.all([readBookings(supabase), fetchMemberSessionLines(email)])
  const fullName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null
  const view = buildAppointmentsView(bookings ?? [], lines ?? [], {
    now: new Date(),
    calBase: calBaseUrl(),
    sessionBase: sessionBookingBase(),
    booker: { name: bookerName(fullName, null), email },
  })
  return { ...view, ordersUnavailable: lines === null, bookingsUnavailable: bookings === null }
}

/** The member's next booked appointment for the dashboard card, or null. */
export async function loadNextAppointment(supabase: SupabaseClient, user: User): Promise<NextAppointment | null> {
  if (!confirmedEmail(user)) return null
  const { data, error } = await supabase
    .from('session_bookings')
    .select(MEMBER_BOOKING_COLUMNS)
    .gt('end_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(20)
  if (error) {
    logError('[portal/dashboard] next appointment read failed', error)
    return null
  }
  // Cancelled rows stay in the read: a moved booking's old row is hidden by
  // its replacement even when the replacement was cancelled.
  const row = liveBookings((data ?? []) as MemberBookingRow[]).find((r) => r.status !== 'cancelled')
  if (!row) return null
  return {
    service: eventName(row),
    dateLabel: formatSastDate(row.start_time),
    timeLabel: formatSastTimes(row.start_time, row.end_time),
  }
}
