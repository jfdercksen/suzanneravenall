import { leadWelcomeSource } from '@/lib/email/lead-welcome-content'
import { sendLeadWelcomeEmail } from '@/lib/email/lead-welcome'
import { isEmailConfigured } from '@/lib/email/send'
import { isEmailUnsubscribed } from '@/lib/email/suppression'
import { logError } from '@/lib/log'
import { earliestRecentLeadId, getLeadsClient, safeErrorText } from './store'

/**
 * The welcome email after a lead form sign-up, with its guards:
 *   - only the forms that have welcome copy (lib/email/lead-welcome-content.ts)
 *   - nothing to an address on the suppression list (marketing email)
 *   - at most one per address and form in 24 hours, judged from public.leads:
 *     only the submission that owns the earliest row in the window sends
 *
 * Never throws. Every skip or failure comes back as the outcome (and failures
 * are logged without the address, POPIA), so the route can fire and forget.
 */

export const WELCOME_DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000

export type LeadWelcomeInput = {
  email: string
  /** What the visitor typed, or null; not the local-part fallback the CRM gets. */
  firstName: string | null
  /** The source as stored on the lead row ("homepage" when the form sent none). */
  source: string
  /** Id of the row captureLead just wrote, or null when it could not be saved. */
  leadId: string | null
  /** Masterclass "Watch Later": the visitor's chosen date and time, formatted. */
  watchAt?: string | null
}

export type LeadWelcomeOutcome =
  | 'sent'
  | 'no-welcome-for-source'
  | 'email-not-configured'
  | 'unsubscribed'
  | 'recently-sent'
  | 'failed'

export async function sendLeadWelcomeIfDue(
  input: LeadWelcomeInput,
  now: Date = new Date(),
): Promise<LeadWelcomeOutcome> {
  const source = leadWelcomeSource(input.source)
  if (!source) return 'no-welcome-for-source'

  try {
    if (!isEmailConfigured()) {
      logError('[lead-welcome] BREVO_API_KEY not set - welcome email not sent', undefined, { source })
      return 'email-not-configured'
    }

    if (await isEmailUnsubscribed(input.email)) return 'unsubscribed'

    if (await sentRecently(input, now)) return 'recently-sent'

    await sendLeadWelcomeEmail({
      email: input.email,
      firstName: input.firstName?.trim() || null,
      source,
      watchAt: input.watchAt ?? null,
    })
    return 'sent'
  } catch (err) {
    logError('[lead-welcome] welcome email failed', new Error(safeErrorText(err)), { source })
    return 'failed'
  }
}

/**
 * True when an earlier submission from this address and form in the window
 * owns the welcome. When the leads table cannot be read the email is sent:
 * one possible duplicate is better than a sign-up that hears nothing.
 */
async function sentRecently(input: LeadWelcomeInput, now: Date): Promise<boolean> {
  const supabase = getLeadsClient()
  if (!supabase) return false

  const since = new Date(now.getTime() - WELCOME_DEDUPE_WINDOW_MS).toISOString()
  try {
    const earliest = await earliestRecentLeadId(supabase, input.email, input.source, since)
    if (earliest === null) return false
    return earliest !== input.leadId
  } catch (err) {
    console.warn(`[lead-welcome] could not check for a recent welcome, sending anyway: ${safeErrorText(err)}`)
    return false
  }
}
