import { NextResponse, type NextRequest } from 'next/server'
import { recheckLimits } from '@/lib/booking/limits'
import { z } from 'zod'
import { staffLinkExpired, supabaseRuleStore, type SessionRuleStore } from '@/lib/booking/session-rules'
import { logError } from '@/lib/log'

/**
 * The handler behind POST /api/staff/booking-credit: the button on /staff/booking/<token> (D024).
 * restore gives a session lost to a late cancel or move back to the client's
 * package; use counts it as used again. The token from the staff alert is the
 * only key. A plain HTML form posts here, so the answer is a 303 back to the
 * page with the result in ?done=.
 */

const BodySchema = z.object({
  token: z.string().min(32).max(200),
  action: z.enum(['restore', 'use']),
})

async function readBody(request: NextRequest): Promise<unknown> {
  const type = request.headers.get('content-type') ?? ''
  if (type.includes('application/json')) return request.json()
  const form = await request.formData()
  return { token: form.get('token'), action: form.get('action') }
}

export async function handleBookingCredit(
  request: NextRequest,
  store: () => SessionRuleStore = supabaseRuleStore,
  now: Date = new Date(),
  recheck: (email: string, firstName: string | null) => Promise<unknown> = (email, firstName) => recheckLimits(email, firstName),
): Promise<NextResponse> {
  let body: unknown
  try {
    body = await readBody(request)
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const { token, action } = parsed.data

  try {
    const rules = store()
    const row = await rules.byStaffToken(token)
    if (!row || !row.late_change_at || staffLinkExpired(row.late_change_at, now)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const changed = await rules.setCreditRestored(token, action === 'restore' ? now : null)
    // The new booking of a late move counts again once the lost session is given
    // back. Run on every restore click, not only the first, so a failed un-flag
    // is retried by clicking again (it changes nothing the second time).
    if (action === 'restore' && row.late_change_kind === 'rescheduled') await rules.unflagReplacement(row.booking_uid)
    // Counted as used again: a booking the give-back covered may now be past the package.
    if (action === 'use' && changed) await recheck(row.attendee_email, row.attendee_name?.trim().split(/\s+/)[0] || null)
    console.info(`[staff/booking-credit] ${row.booking_uid}: ${action} ${changed ? 'done' : 'unchanged'}`)
    const done = changed ? (action === 'restore' ? 'restored' : 'used') : 'unchanged'
    // A relative Location: behind Nginx the request origin is the internal host.
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `/staff/booking/${encodeURIComponent(token)}?done=${done}` },
    })
  } catch (error) {
    logError('[staff/booking-credit] credit update failed', error)
    return NextResponse.json({ error: 'Could not update the booking' }, { status: 500 })
  }
}

