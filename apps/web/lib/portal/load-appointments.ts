import type { SupabaseClient, User } from '@supabase/supabase-js'
import { bookerName } from '@suzanne/integrations'
import { logError } from '@/lib/log'
import {
  buildAppointmentsView,
  calBaseUrl,
  MEMBER_BOOKING_COLUMNS,
  sessionBookingBase,
  type AppointmentsView,
  type MemberBookingRow,
} from './appointments'
import { fetchMemberSessionLines } from './session-orders'
import { bookingGateUrl, listBookingTokensForEmail } from '@/lib/booking/tokens'

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

// The member's /book links by pool, newest purchase last so it wins (J-07).
// Empty when the table cannot be read: Book Now then links to Cal.com.
async function readGateLinks(email: string): Promise<Map<string, string>> {
  try {
    const tokens = await listBookingTokensForEmail(email)
    return new Map(tokens.map((t) => [`${t.service_name}|${t.duration_minutes}`, bookingGateUrl(t.token)]))
  } catch (error) {
    logError('[portal/appointments] booking links could not be read', error)
    return new Map()
  }
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

  const [bookings, lines, gateLinks] = await Promise.all([
    readBookings(supabase),
    fetchMemberSessionLines(email),
    readGateLinks(email),
  ])
  const fullName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null
  const view = buildAppointmentsView(bookings ?? [], lines ?? [], {
    now: new Date(),
    calBase: calBaseUrl(),
    sessionBase: sessionBookingBase(),
    booker: { name: bookerName(fullName, null), email },
    gateLinks,
  })
  return { ...view, ordersUnavailable: lines === null, bookingsUnavailable: bookings === null }
}

/**
 * The member's next booked appointment for the dashboard card, or null. Uses
 * the page's loader so the card and the page name the service the same way.
 */
export async function loadNextAppointment(supabase: SupabaseClient, user: User): Promise<NextAppointment | null> {
  const { upcoming } = await loadMemberAppointments(supabase, user)
  const next = upcoming[0]
  return next ? { service: next.service, dateLabel: next.dateLabel, timeLabel: next.timeLabel } : null
}
