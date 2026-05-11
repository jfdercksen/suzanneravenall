import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { hasAccess, type ResourceKey, type TierSlug } from './tiers'

export async function getMemberTier(supabase: SupabaseClient): Promise<TierSlug> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return 'free'

  const { data: subscription } = await supabase
    .from('member_subscriptions')
    .select('membership_tiers(slug)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const tier = subscription?.membership_tiers as { slug: string } | null
  const slug = tier?.slug

  if (slug === 'silver' || slug === 'gold' || slug === 'practitioner') {
    return slug
  }
  return 'free'
}

/**
 * Requires the caller to be authenticated and have access to `resource`.
 * Unauthenticated → redirects to /portal/login (with redirect param if fromPath supplied).
 * Authenticated but wrong tier → redirects to /portal/upgrade (with from param for context).
 */
export async function requireAccess(
  supabase: SupabaseClient,
  resource: ResourceKey,
  fromPath?: string,
): Promise<TierSlug> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginPath = fromPath
      ? `/portal/login?redirect=${encodeURIComponent(fromPath)}`
      : '/portal/login'
    redirect(loginPath)
  }

  const tier = await getMemberTier(supabase)

  if (!hasAccess(tier, resource)) {
    const upgradePath = fromPath
      ? `/portal/upgrade?from=${encodeURIComponent(fromPath)}`
      : '/portal/upgrade'
    redirect(upgradePath)
  }

  return tier
}
