import type { Metadata } from 'next'
import { staffLinkExpired, supabaseRuleStore, type RuleBookingRow } from '@/lib/booking/session-rules'
import { logError } from '@/lib/log'
import { formatSastDate, formatSastTime, formatSastTimes } from '@/lib/portal/appointments'
import StaffBookingContent, { type StaffBookingView } from './StaffBookingContent'

/**
 * /staff/booking/<token>: the link in the staff alert for a late cancel or
 * move (D024). Shows the client and the session, and one button that gives
 * the session back (or counts it as used again). The token is the only key;
 * the button posts to /api/staff/booking-credit, so opening the link changes
 * nothing.
 */

export const metadata: Metadata = {
  title: 'Session credit',
  robots: { index: false, follow: false },
  // The token is in the path: never send it to another site as a referrer.
  referrer: 'no-referrer',
}

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ done?: string }>
}

async function load(token: string): Promise<RuleBookingRow | null | 'unavailable'> {
  if (token.length < 32) return null
  try {
    return await supabaseRuleStore().byStaffToken(token)
  } catch (error) {
    logError('[staff/booking] booking read failed', error)
    return 'unavailable'
  }
}

function toView(row: RuleBookingRow): StaffBookingView {
  return {
    clientName: row.attendee_name,
    clientEmail: row.attendee_email,
    dateLabel: formatSastDate(row.start_time),
    timeLabel: formatSastTimes(row.start_time, row.end_time),
    kind: row.late_change_kind === 'rescheduled' ? 'rescheduled' : 'cancelled',
    changedLabel: row.late_change_at ? `${formatSastDate(row.late_change_at)}, ${formatSastTime(row.late_change_at)}` : null,
    restored: Boolean(row.credit_restored_at),
    byStaff: Boolean(row.late_change_by_staff),
  }
}

export default async function StaffBookingPage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { done } = await searchParams
  // Tokens are base64url, so the path segment needs no decoding.
  const row = await load(token)
  if (row === 'unavailable') return <StaffBookingContent state="unavailable" token="" />
  if (!row || !row.late_change_at || staffLinkExpired(row.late_change_at)) {
    return <StaffBookingContent state="invalid" token="" />
  }
  return (
    <StaffBookingContent
      state="found"
      token={token}
      booking={toView(row)}
      done={done === 'restored' || done === 'used' || done === 'unchanged' ? done : undefined}
    />
  )
}
