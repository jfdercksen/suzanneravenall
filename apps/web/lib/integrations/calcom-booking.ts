import {
  automationMode,
  parseCalcomBooking,
  syncBookingWithRetry,
  type AutomationMode,
  type BookingSyncRunOptions,
  type BookingVtigerResult,
} from '@suzanne/integrations'
import { getVtigerClient } from '@/lib/integrations/vtiger'
import { sendStaffAlert } from '@/lib/integrations/staff-alert'
import { logError } from '@/lib/log'

/**
 * Cal.com booking -> Vtiger (n8n migration step 6, plan section 3.6).
 * Runs after the webhook route has answered Cal.com (Next `after()`).
 *
 * AUTOMATION_CALCOM: `code` (default) or `off`. There is no n8n path any more;
 * `n8n` is treated as `code` with a warning.
 *
 * Never throws. Final failure: one Sentry event (booking UID only, no email,
 * POPIA) and one throttled staff alert to AUTOMATION_ALERT_EMAIL.
 */

export type CalcomBookingOutcome =
  | { status: 'synced'; result: BookingVtigerResult }
  | { status: 'skipped'; reason: 'off' | 'invalid-payload' }
  | { status: 'failed' }

export function calcomAutomationMode(): AutomationMode {
  const mode = automationMode(['AUTOMATION_CALCOM'], 'code')
  if (mode === 'n8n') {
    console.warn('[calcom] AUTOMATION_CALCOM=n8n is retired; running the code path')
    return 'code'
  }
  return mode
}

export async function runCalcomBookingSync(
  body: unknown,
  opts: Pick<BookingSyncRunOptions, 'sleep' | 'delaysMs'> = {},
): Promise<CalcomBookingOutcome> {
  if (calcomAutomationMode() === 'off') return { status: 'skipped', reason: 'off' }

  const booking = parseCalcomBooking(body)
  if (!booking) {
    console.warn('[calcom] BOOKING_CREATED without attendee email, start time or booking UID; not sent to Vtiger')
    return { status: 'skipped', reason: 'invalid-payload' }
  }

  try {
    const result = await syncBookingWithRetry(getVtigerClient(), booking, {
      ...opts,
      onAttemptFailed: (attempt, err) =>
        console.warn(`[calcom] Vtiger sync attempt ${attempt} failed for booking ${booking.uid}: ${err instanceof Error ? err.message : String(err)}`),
    })
    if (result.missingFields.length > 0) {
      console.warn(`[calcom] Vtiger Contacts has no ${result.missingFields.join(', ')}; written without it`)
    }
    console.info(
      `[calcom] booking ${booking.uid} -> contact ${result.contactId} (${result.created ? 'created' : 'existing'}), event ${result.eventId}${result.replay ? ' (already logged)' : ''}`,
    )
    return { status: 'synced', result }
  } catch (err) {
    logError('[calcom] booking could not be sent to Vtiger', err, { bookingUid: booking.uid, automation: 'calcom' })
    await sendStaffAlert({
      // Per booking, so an outage alerts once per lost booking, not once per 15 minutes.
      key: `calcom-vtiger:${booking.uid}`,
      subject: 'Cal.com booking did not reach Vtiger',
      lines: [
        `Cal.com booking UID: ${booking.uid}`,
        `Booked for: ${booking.start.toISOString()}`,
        'The Vtiger contact, Event or pipeline stage is missing after 3 retries. Check the contact in Vtiger and complete it by hand (the attendee is in the Cal.com booking).',
      ],
    })
    return { status: 'failed' }
  }
}
