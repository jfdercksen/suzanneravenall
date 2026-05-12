export type TierSlug = 'free' | 'silver' | 'gold' | 'practitioner'

export interface TierPermissions {
  blog: boolean
  explore: boolean
  shop: boolean
  portal_dashboard: boolean
  resources_basic: boolean
  resources_assessments: boolean
  resources_media: boolean
  group_sessions_recorded: boolean
  programmes_self_study: boolean
  live_session_recordings: boolean
  all_programmes: boolean
  practitioner_resources: boolean
  certification_materials: boolean
}

export type ResourceKey = keyof TierPermissions

const free: TierPermissions = {
  blog: true,
  explore: true,
  shop: true,
  portal_dashboard: true,
  resources_basic: true,
  resources_assessments: false,
  resources_media: false,
  group_sessions_recorded: false,
  programmes_self_study: false,
  live_session_recordings: false,
  all_programmes: false,
  practitioner_resources: false,
  certification_materials: false,
}

const silver: TierPermissions = {
  ...free,
  resources_assessments: true,
  resources_media: true,
  group_sessions_recorded: true,
  programmes_self_study: true,
}

const gold: TierPermissions = {
  ...silver,
  live_session_recordings: true,
  all_programmes: true,
}

const practitioner: TierPermissions = {
  ...gold,
  practitioner_resources: true,
  certification_materials: true,
}

export const TIER_ACCESS: Record<TierSlug, TierPermissions> = {
  free,
  silver,
  gold,
  practitioner,
}

export const TIER_ORDER: TierSlug[] = ['free', 'silver', 'gold', 'practitioner']

export function hasAccess(tier: string, resource: ResourceKey): boolean {
  const tierAccess = TIER_ACCESS[tier as TierSlug] ?? TIER_ACCESS.free
  return tierAccess[resource]
}

export function tierLabel(tier: TierSlug): string {
  const labels: Record<TierSlug, string> = {
    free: 'Free Member',
    silver: 'Silver Member',
    gold: 'Gold Member',
    practitioner: 'Practitioner',
  }
  return labels[tier]
}

export function minimumTierFor(resource: ResourceKey): TierSlug {
  for (const tier of TIER_ORDER) {
    if (TIER_ACCESS[tier][resource]) return tier
  }
  return 'practitioner'
}

export const TIER_BADGE_STYLES: Record<TierSlug, string> = {
  free: 'bg-gray-700 text-gray-300',
  silver: 'bg-gray-400/20 text-gray-200 border border-gray-400/40',
  gold: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  practitioner: 'bg-brand-accent/20 text-brand-accent border border-brand-accent/40',
}
