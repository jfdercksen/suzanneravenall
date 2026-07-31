import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { hasAccess, type ResourceKey, type TierSlug, type MembershipTrack } from './tiers'

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

  // supabase-js's generic query-builder typing always treats a parenthesised
  // nested select (e.g. `membership_tiers(slug)`) as a to-many relation and
  // types it as an array, even though `member_id -> membership_tiers` is a
  // to-one foreign key and PostgREST returns a single object at runtime.
  // Handle both shapes defensively so a real array response can't silently
  // widen access (fail closed: only ever look at the first row).
  const rawTier = subscription?.membership_tiers
  const tier = Array.isArray(rawTier) ? rawTier[0] : rawTier
  const slug = tier?.slug

  if (slug === 'silver' || slug === 'gold' || slug === 'practitioner') {
    return slug
  }
  return 'free'
}

export interface MemberAccessInfo {
  accessLevel: number
  track: MembershipTrack | 'both'
  sku: string | null
  annualRenewalDate: string | null
}

/**
 * Returns access_level, track, sku, and annual_renewal_date from the member's
 * active subscription. Reads the columns added by the 20260526_membership_tiers
 * migration. Falls back to guest defaults when not authenticated or no subscription.
 */
export async function getMemberAccessLevel(supabase: SupabaseClient): Promise<MemberAccessInfo> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { accessLevel: 1, track: 'general', sku: null, annualRenewalDate: null }
  }

  const { data } = await supabase
    .from('member_subscriptions')
    .select('access_level, track, sku, annual_renewal_date')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) {
    return { accessLevel: 1, track: 'general', sku: null, annualRenewalDate: null }
  }

  const row = data as Record<string, unknown>
  return {
    accessLevel: typeof row.access_level === 'number' ? row.access_level : 1,
    track: (row.track as MembershipTrack | 'both') ?? 'general',
    sku: typeof row.sku === 'string' ? row.sku : null,
    annualRenewalDate: typeof row.annual_renewal_date === 'string' ? row.annual_renewal_date : null,
  }
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
