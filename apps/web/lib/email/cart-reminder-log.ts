import { getServiceRoleClient } from '@/lib/quiz/subscriber'
import { isMissingTableError } from '@/lib/leads/store'
import { logError } from '@/lib/log'

/**
 * Sent-log for the abandoned-cart reminders (table public.cart_reminder_sends,
 * migration supabase/migrations/20261020120000_cart_reminder_sends.sql).
 *
 * claimCartReminder inserts (cart_id, template) before the send. The unique
 * key makes the claim atomic: whoever inserts first sends, everyone else
 * (an n8n chain still waiting from before the cutover, a retried request)
 * gets 'already_sent'. A failed send calls releaseCartReminder so a retry
 * can claim again.
 *
 * A claim with no email id that is older than STALE_CLAIM_MS belongs to a
 * request that died before Brevo answered: it may be re-taken, so a crash
 * never swallows a reminder for good.
 *
 * Unlike the suppression check this fails CLOSED ('unavailable'): without
 * the log a double send cannot be ruled out, and the Medusa job retries.
 */

export const CART_REMINDER_SENDS_TABLE = 'cart_reminder_sends'

export type ClaimResult = 'claimed' | 'already_sent' | 'unavailable'

export const STALE_CLAIM_MS = 10 * 60_000

export async function claimCartReminder(cartId: string, template: 1 | 2 | 3): Promise<ClaimResult> {
  const supabase = getServiceRoleClient()
  if (!supabase) {
    logError('[email/cart-reminder-log] Supabase service-role client unavailable')
    return 'unavailable'
  }
  const { error } = await supabase.from(CART_REMINDER_SENDS_TABLE).insert({ cart_id: cartId, template })
  if (!error) return 'claimed'
  if (error.code === '23505') {
    // Re-take a stale open claim; created_at doubles as the claim time.
    const { data, error: retakeError } = await supabase
      .from(CART_REMINDER_SENDS_TABLE)
      .update({ created_at: new Date().toISOString() })
      .eq('cart_id', cartId)
      .eq('template', template)
      .is('email_id', null)
      .lt('created_at', new Date(Date.now() - STALE_CLAIM_MS).toISOString())
      .select('id')
    if (retakeError) {
      logError(`[email/cart-reminder-log] stale-claim check failed: ${retakeError.message}`, retakeError)
      return 'unavailable'
    }
    if (Array.isArray(data) && data.length > 0) {
      logError(`[email/cart-reminder-log] re-took a stale claim (cart ${cartId}, template ${template})`)
      return 'claimed'
    }
    return 'already_sent'
  }
  if (isMissingTableError(error)) {
    logError(`[email/cart-reminder-log] table ${CART_REMINDER_SENDS_TABLE} is missing: apply 20261020120000_cart_reminder_sends.sql`)
  } else {
    logError(`[email/cart-reminder-log] claim failed: ${error.message}`, error)
  }
  return 'unavailable'
}

export async function releaseCartReminder(cartId: string, template: 1 | 2 | 3): Promise<void> {
  const supabase = getServiceRoleClient()
  if (!supabase) return
  const { error } = await supabase
    .from(CART_REMINDER_SENDS_TABLE)
    .delete()
    .eq('cart_id', cartId)
    .eq('template', template)
    .is('email_id', null)
  if (error) logError(`[email/cart-reminder-log] release failed: ${error.message}`, error)
}

export async function recordCartReminderEmailId(cartId: string, template: 1 | 2 | 3, emailId: string): Promise<void> {
  const supabase = getServiceRoleClient()
  if (!supabase) return
  const { error } = await supabase
    .from(CART_REMINDER_SENDS_TABLE)
    .update({ email_id: emailId })
    .eq('cart_id', cartId)
    .eq('template', template)
  // The mail is out and the claim stays, so a failure here costs only the id.
  if (error) logError(`[email/cart-reminder-log] email id not stored: ${error.message}`, error)
}
