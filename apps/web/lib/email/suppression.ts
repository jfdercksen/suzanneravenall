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

export async function isEmailUnsubscribed(email: string): Promise<boolean> {
  const supabase = getServiceRoleClient()
  if (!supabase) {
    // Misconfigured server (missing Supabase env). Fail open so a config
    // gap degrades to pre-suppression behaviour instead of silently
    // dropping every marketing email; the error log makes it visible.
    logError('[email/suppression] Supabase service-role client unavailable, skipping unsubscribe check')
    return false
  }

  const { data, error } = await supabase
    .from('email_unsubscribes')
    .select('email')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (error) {
    logError(`[email/suppression] lookup failed: ${error.message}`, error)
    return false
  }

  return data !== null
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
