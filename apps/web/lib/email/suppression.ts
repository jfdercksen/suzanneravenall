import { getServiceRoleClient } from '@/lib/quiz/subscriber'
import { logError } from '@/lib/log'

/**
 * Marketing-email suppression list backed by public.email_unsubscribes
 * (see supabase/migrations/20260804100000_email_unsubscribes.sql).
 *
 * Every MARKETING send path (cart abandonment 1-3, membership renewal
 * reminder, membership expired) must call isEmailUnsubscribed() before
 * sending and skip the send when it returns true. Transactional emails
 * (order confirmation, membership welcome, quiz invite) are NOT suppressed —
 * they are service messages the customer needs.
 *
 * The table is service-role only (RLS deny-by-default, no policies), same
 * pattern as quiz_subscribers.
 */

export type UnsubscribeStatus = 'unsubscribed' | 'subscribed' | 'unavailable'

/**
 * The lookup with its failure kept visible. 'unavailable' means the list could
 * not be read (no service-role client, or a query error), so the caller cannot
 * know whether the address opted out. The cart reminders fail CLOSED on it
 * (KI057: they go to anyone who typed an address at checkout, so a reminder
 * that might reach an opted-out address is not sent; the caller retries).
 */
export async function unsubscribeStatus(email: string): Promise<UnsubscribeStatus> {
  const supabase = getServiceRoleClient()
  if (!supabase) {
    logError('[email/suppression] Supabase service-role client unavailable, cannot read the unsubscribe list')
    return 'unavailable'
  }

  try {
    const { data, error } = await supabase
      .from('email_unsubscribes')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()

    if (error) {
      logError(`[email/suppression] lookup failed: ${error.message}`, error)
      return 'unavailable'
    }

    return data !== null ? 'unsubscribed' : 'subscribed'
  } catch (err) {
    logError('[email/suppression] lookup threw', err)
    return 'unavailable'
  }
}

/**
 * Fail-open form for the membership renewal/expired routes and the lead
 * welcome: a config gap degrades to pre-suppression behaviour instead of
 * silently dropping every one of those mails; the error log makes it visible.
 */
export async function isEmailUnsubscribed(email: string): Promise<boolean> {
  return (await unsubscribeStatus(email)) === 'unsubscribed'
}

export async function recordUnsubscribe(email: string, source: string): Promise<void> {
  const supabase = getServiceRoleClient()
  if (!supabase) {
    throw new Error('[email/suppression] Supabase service-role client unavailable')
  }

  const { error } = await supabase
    .from('email_unsubscribes')
    .upsert({ email: email.trim().toLowerCase(), source }, { onConflict: 'email' })

  if (error) {
    throw new Error(`[email/suppression] recordUnsubscribe failed: ${error.message}`)
  }
}
