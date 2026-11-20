import type { SupabaseClient } from '@supabase/supabase-js'
import { membershipAccessFields, membershipTierSlug, type MembershipLevel } from '@suzanne/integrations'

/**
 * Makes a member active on a level for a year from `start` (KI128). The same
 * write the store makes after a paid order (apps/medusa/src/subscribers/
 * order-placed.ts syncSupabaseMembership), used here when the team approves
 * a Novice: the term then runs from the approval, not from the payment.
 * Service-role client only. Returns the end of the term, or an error message.
 */
export async function activateLevel(
  supabase: SupabaseClient,
  userId: string,
  level: MembershipLevel,
  start: Date,
): Promise<{ ok: true; endDate: string } | { ok: false; error: string }> {
  const { data: tier, error: tierError } = await supabase
    .from('membership_tiers')
    .select('id')
    .eq('slug', membershipTierSlug(level))
    .maybeSingle()
  if (tierError) return { ok: false, error: `tier lookup: ${tierError.message}` }
  if (!tier) return { ok: false, error: `membership_tiers has no row ${membershipTierSlug(level)} (run migration 20261120090000)` }

  const fields = membershipAccessFields(level, start)
  const tierId = (tier as { id: string }).id

  const { data: existing, error: findError } = await supabase
    .from('member_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('tier_id', tierId)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (findError) return { ok: false, error: `row lookup: ${findError.message}` }

  const { error } = existing
    ? await supabase.from('member_subscriptions').update(fields).eq('id', (existing as { id: string }).id)
    : await supabase.from('member_subscriptions').insert({ user_id: userId, tier_id: tierId, ...fields })
  if (error) return { ok: false, error: `row write: ${error.message}` }

  return { ok: true, endDate: fields.end_date }
}
