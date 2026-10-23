import { getServiceRoleClient } from '@/lib/quiz/subscriber'
import { logError } from '@/lib/log'
import { siteUrl } from '@/lib/email/site-url'
import type { PortalInvite } from '@/lib/email/types'

/**
 * The portal block in the order confirmation mail (H-13). Checkout is guest,
 * so most buyers have no portal account: they get a signup link with their
 * order email filled in. A buyer who already has an account gets the login
 * link instead. The lookup is public.auth_email_exists (service role only,
 * supabase/migrations/20261023090000_booking_limits.sql).
 */

/** True when a portal account exists for this address; null when it cannot be told. */
export async function authEmailExists(email: string): Promise<boolean | null> {
  const supabase = getServiceRoleClient()
  if (!supabase) {
    logError('[portal-invite] Supabase service-role client is not configured')
    return null
  }
  const { data, error } = await supabase.rpc('auth_email_exists', { p_email: email })
  if (error) {
    logError('[portal-invite] account lookup failed', error)
    return null
  }
  return data === true
}

/** The portal link for this address; signup when the account lookup fails (the signup form says so if it exists). */
export async function portalInviteFor(
  email: string,
  exists: (email: string) => Promise<boolean | null> = authEmailExists,
): Promise<PortalInvite> {
  const query = new URLSearchParams({ email: email.trim() }).toString()
  const hasAccount = await exists(email.trim()).catch(() => null)
  return hasAccount
    ? { kind: 'login', url: `${siteUrl()}/portal/login?${query}` }
    : { kind: 'signup', url: `${siteUrl()}/portal/signup?${query}` }
}
