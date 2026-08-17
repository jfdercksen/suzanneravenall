export type TierSlug = 'free' | 'silver' | 'gold' | 'practitioner'

export interface TierPermissions {
  blog: boolean
  explore: boolean
  shop: boolean
  portal_dashboard: boolean
  resources_basic: boolean
  resources_assessments: boolean
  resources_media: boolean
  resources_awards: boolean
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
  resources_awards: false,
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
  resources_awards: true,
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
  practitioner: 'bg-brand-accent/20 text-brand-accent-300 border border-brand-accent/40',
}

// ─── 29-tier membership system (Wild Apricot / real structure) ────────────────

export type MembershipTrack = 'akashic' | 'energy-clearing' | 'general'
export type MembershipLevel =
  | 'guest' | 'lifestyle' | 'student' | 'novice' | 'practitioner'
  | 'certified' | 'advanced' | 'mentor' | 'master' | 'instructor' | 'master-instructor'
export type TierType = 'basic' | 'premier' | 'standard'

export interface MembershipTier {
  sku: string
  title: string
  handle: string
  track: MembershipTrack
  level: MembershipLevel
  tierType: TierType
  accessLevel: number
  zarPrice: number
  usdPrice: number
  requiresTraining: boolean
  canChargeClients: boolean
  annual: boolean
}

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  { sku: 'S0211', title: 'Guest Membership', handle: 'membership-s0211', track: 'general', level: 'guest', tierType: 'standard', accessLevel: 1, zarPrice: 0, usdPrice: 0, requiresTraining: false, canChargeClients: false, annual: false },
  { sku: 'S0212', title: 'Lifestyle Membership', handle: 'membership-s0212', track: 'general', level: 'lifestyle', tierType: 'standard', accessLevel: 2, zarPrice: 350, usdPrice: 20, requiresTraining: false, canChargeClients: false, annual: true },
  { sku: 'S0213', title: 'Akashic Student Membership', handle: 'membership-s0213', track: 'akashic', level: 'student', tierType: 'standard', accessLevel: 3, zarPrice: 525, usdPrice: 30, requiresTraining: true, canChargeClients: false, annual: true },
  { sku: 'S0214', title: 'Akashic Novice Practitioner - Basic Membership', handle: 'membership-s0214', track: 'akashic', level: 'novice', tierType: 'basic', accessLevel: 4, zarPrice: 875, usdPrice: 50, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0215', title: 'Akashic Novice Practitioner - Premier Membership', handle: 'membership-s0215', track: 'akashic', level: 'novice', tierType: 'premier', accessLevel: 4, zarPrice: 1225, usdPrice: 70, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0216', title: 'Akashic Practitioner (Prdip) - Basic Membership', handle: 'membership-s0216', track: 'akashic', level: 'practitioner', tierType: 'basic', accessLevel: 5, zarPrice: 1400, usdPrice: 80, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0217', title: 'Akashic Practitioner (Prdip) - Premier Membership', handle: 'membership-s0217', track: 'akashic', level: 'practitioner', tierType: 'premier', accessLevel: 5, zarPrice: 1750, usdPrice: 100, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0218', title: 'Akashic Certified Practitioner (CertPrdip) - Basic Membership', handle: 'membership-s0218', track: 'akashic', level: 'certified', tierType: 'basic', accessLevel: 6, zarPrice: 1750, usdPrice: 100, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0219', title: 'Akashic Certified Practitioner (CertPrdip) - Premier Membership', handle: 'membership-s0219', track: 'akashic', level: 'certified', tierType: 'premier', accessLevel: 6, zarPrice: 2100, usdPrice: 120, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0220', title: 'Akashic Certified Advanced Practitioner (CertAdvPrdip) - Basic Membership', handle: 'membership-s0220', track: 'akashic', level: 'advanced', tierType: 'basic', accessLevel: 7, zarPrice: 1750, usdPrice: 100, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0221', title: 'Akashic Certified Advanced Practitioner (CertAdvPrdip) - Premier Membership', handle: 'membership-s0221', track: 'akashic', level: 'advanced', tierType: 'premier', accessLevel: 7, zarPrice: 2100, usdPrice: 120, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0222', title: 'Akashic Mentor (MentorPrdip) - Premier Membership', handle: 'membership-s0222', track: 'akashic', level: 'mentor', tierType: 'premier', accessLevel: 8, zarPrice: 1750, usdPrice: 100, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0223', title: 'Akashic Master Practitioner (MasterPrdip) - Premier Membership', handle: 'membership-s0223', track: 'akashic', level: 'master', tierType: 'premier', accessLevel: 9, zarPrice: 2625, usdPrice: 150, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0224', title: 'Akashic Instructor (Inst) - Premier Membership', handle: 'membership-s0224', track: 'akashic', level: 'instructor', tierType: 'premier', accessLevel: 9, zarPrice: 2625, usdPrice: 150, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0225', title: 'Akashic Certified Master Instructor (CertMasterInst) - Premier Membership', handle: 'membership-s0225', track: 'akashic', level: 'master-instructor', tierType: 'premier', accessLevel: 10, zarPrice: 2625, usdPrice: 150, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0226', title: 'Energy Clearing Student Membership', handle: 'membership-s0226', track: 'energy-clearing', level: 'student', tierType: 'standard', accessLevel: 3, zarPrice: 525, usdPrice: 30, requiresTraining: true, canChargeClients: false, annual: true },
  { sku: 'S0227', title: 'Energy Clearing Novice Practitioner - Basic Membership', handle: 'membership-s0227', track: 'energy-clearing', level: 'novice', tierType: 'basic', accessLevel: 4, zarPrice: 875, usdPrice: 50, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0228', title: 'Energy Clearing Novice Practitioner - Premier Membership', handle: 'membership-s0228', track: 'energy-clearing', level: 'novice', tierType: 'premier', accessLevel: 4, zarPrice: 1225, usdPrice: 70, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0229', title: 'Energy Clearing Practitioner (Prdip) - Basic Membership', handle: 'membership-s0229', track: 'energy-clearing', level: 'practitioner', tierType: 'basic', accessLevel: 5, zarPrice: 1400, usdPrice: 80, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0230', title: 'Energy Clearing Practitioner (Prdip) - Premier Membership', handle: 'membership-s0230', track: 'energy-clearing', level: 'practitioner', tierType: 'premier', accessLevel: 5, zarPrice: 1750, usdPrice: 100, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0231', title: 'Energy Clearing Certified Practitioner (CertPrdip) - Basic Membership', handle: 'membership-s0231', track: 'energy-clearing', level: 'certified', tierType: 'basic', accessLevel: 6, zarPrice: 1750, usdPrice: 100, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0232', title: 'Energy Clearing Certified Practitioner (CertPrdip) - Premier Membership', handle: 'membership-s0232', track: 'energy-clearing', level: 'certified', tierType: 'premier', accessLevel: 6, zarPrice: 2100, usdPrice: 120, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0233', title: 'Energy Clearing Certified Advanced Practitioner (CertAdvPrdip) - Basic Membership', handle: 'membership-s0233', track: 'energy-clearing', level: 'advanced', tierType: 'basic', accessLevel: 7, zarPrice: 1750, usdPrice: 100, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0234', title: 'Energy Clearing Certified Advanced Practitioner (CertAdvPrdip) - Premier Membership', handle: 'membership-s0234', track: 'energy-clearing', level: 'advanced', tierType: 'premier', accessLevel: 7, zarPrice: 2100, usdPrice: 120, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0235', title: 'Energy Clearing Mentor (MentorPrdip) - Premier Membership', handle: 'membership-s0235', track: 'energy-clearing', level: 'mentor', tierType: 'premier', accessLevel: 8, zarPrice: 1750, usdPrice: 100, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0236', title: 'Energy Clearing Master Practitioner (MasterPrdip) - Premier Membership', handle: 'membership-s0236', track: 'energy-clearing', level: 'master', tierType: 'premier', accessLevel: 9, zarPrice: 2625, usdPrice: 150, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0237', title: 'Energy Clearing Certified Master Practitioner (CertMasterPrdip) - Premier Membership', handle: 'membership-s0237', track: 'energy-clearing', level: 'master', tierType: 'premier', accessLevel: 9, zarPrice: 2625, usdPrice: 150, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0238', title: 'Energy Clearing Instructor (Inst) - Premier Membership', handle: 'membership-s0238', track: 'energy-clearing', level: 'instructor', tierType: 'premier', accessLevel: 9, zarPrice: 2625, usdPrice: 150, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0239', title: 'Energy Clearing Certified Master Instructor (CertMasterInst) - Premier Membership', handle: 'membership-s0239', track: 'energy-clearing', level: 'master-instructor', tierType: 'premier', accessLevel: 10, zarPrice: 2625, usdPrice: 150, requiresTraining: true, canChargeClients: true, annual: true },
]

export function checkAccessLevel(memberLevel: number, requiredLevel: number): boolean {
  return memberLevel >= requiredLevel
}

export function tierBySku(sku: string): MembershipTier | undefined {
  return MEMBERSHIP_TIERS.find((t) => t.sku === sku)
}

export function tierByHandle(handle: string): MembershipTier | undefined {
  return MEMBERSHIP_TIERS.find((t) => t.handle === handle)
}
