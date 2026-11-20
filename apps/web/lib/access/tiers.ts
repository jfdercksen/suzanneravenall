import type { RichLine } from '@/lib/content/richLine'

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
    // The free level is the store's S0211 Guest Membership (KI072, 19 Nov 2026).
    free: 'Guest Member',
    silver: 'Silver Member',
    gold: 'Gold Member',
    practitioner: 'Practitioner',
  }
  return labels[tier]
}

/**
 * The one upgrade destination. requireAccess redirects here, and every
 * "Unlock with ..." / "Upgrade" link points here too, so a member who is
 * bounced by the gate and a member who clicks the lock land on the same page.
 * `from` is the gated path, shown as context on the upgrade page.
 */
export const UPGRADE_PATH = '/portal/upgrade'

export function upgradeHref(fromPath?: string): string {
  return fromPath ? `${UPGRADE_PATH}?from=${encodeURIComponent(fromPath)}` : UPGRADE_PATH
}

export function minimumTierFor(resource: ResourceKey): TierSlug {
  for (const tier of TIER_ORDER) {
    if (TIER_ACCESS[tier][resource]) return tier
  }
  return 'practitioner'
}

// Monochrome since 2026-09-15: the tiers differ by FILL BRIGHTNESS, not by hue,
// and every badge sits on a dark portal ground. The gold badge used to be yellow
// and the practitioner badge brand-accent, which is near-black on black.
export const TIER_BADGE_STYLES: Record<TierSlug, string> = {
  free: 'bg-white/10 text-white/80 border border-white/20',
  silver: 'bg-white/20 text-white border border-white/30',
  gold: 'bg-white/35 text-white border border-white/50',
  practitioner: 'bg-white text-brand-primary border border-white',
}

// ─── 29-tier membership system (Wild Apricot / real structure) ────────────────

/** 'energy-clearing' is the Energy Alignment & Optimisation ladder: the id keeps the old name, it is stored on members (KI116). */
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
  { sku: 'S0213', title: 'Akashic Student Membership', handle: 'membership-s0213', track: 'akashic', level: 'student', tierType: 'standard', accessLevel: 3, zarPrice: 525, usdPrice: 30, requiresTraining: false, canChargeClients: false, annual: true },
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
  { sku: 'S0226', title: 'Energy Alignment & Optimisation Student Membership', handle: 'membership-s0226', track: 'energy-clearing', level: 'student', tierType: 'standard', accessLevel: 3, zarPrice: 525, usdPrice: 30, requiresTraining: false, canChargeClients: false, annual: true },
  { sku: 'S0227', title: 'Energy Alignment & Optimisation Novice Practitioner - Basic Membership', handle: 'membership-s0227', track: 'energy-clearing', level: 'novice', tierType: 'basic', accessLevel: 4, zarPrice: 875, usdPrice: 50, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0228', title: 'Energy Alignment & Optimisation Novice Practitioner - Premier Membership', handle: 'membership-s0228', track: 'energy-clearing', level: 'novice', tierType: 'premier', accessLevel: 4, zarPrice: 1225, usdPrice: 70, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0229', title: 'Energy Alignment & Optimisation Practitioner (Prdip) - Basic Membership', handle: 'membership-s0229', track: 'energy-clearing', level: 'practitioner', tierType: 'basic', accessLevel: 5, zarPrice: 1400, usdPrice: 80, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0230', title: 'Energy Alignment & Optimisation Practitioner (Prdip) - Premier Membership', handle: 'membership-s0230', track: 'energy-clearing', level: 'practitioner', tierType: 'premier', accessLevel: 5, zarPrice: 1750, usdPrice: 100, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0231', title: 'Energy Alignment & Optimisation Certified Practitioner (CertPrdip) - Basic Membership', handle: 'membership-s0231', track: 'energy-clearing', level: 'certified', tierType: 'basic', accessLevel: 6, zarPrice: 1750, usdPrice: 100, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0232', title: 'Energy Alignment & Optimisation Certified Practitioner (CertPrdip) - Premier Membership', handle: 'membership-s0232', track: 'energy-clearing', level: 'certified', tierType: 'premier', accessLevel: 6, zarPrice: 2100, usdPrice: 120, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0233', title: 'Energy Alignment & Optimisation Certified Advanced Practitioner (CertAdvPrdip) - Basic Membership', handle: 'membership-s0233', track: 'energy-clearing', level: 'advanced', tierType: 'basic', accessLevel: 7, zarPrice: 1750, usdPrice: 100, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0234', title: 'Energy Alignment & Optimisation Certified Advanced Practitioner (CertAdvPrdip) - Premier Membership', handle: 'membership-s0234', track: 'energy-clearing', level: 'advanced', tierType: 'premier', accessLevel: 7, zarPrice: 2100, usdPrice: 120, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0235', title: 'Energy Alignment & Optimisation Mentor (MentorPrdip) - Premier Membership', handle: 'membership-s0235', track: 'energy-clearing', level: 'mentor', tierType: 'premier', accessLevel: 8, zarPrice: 1750, usdPrice: 100, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0236', title: 'Energy Alignment & Optimisation Master Practitioner (MasterPrdip) - Premier Membership', handle: 'membership-s0236', track: 'energy-clearing', level: 'master', tierType: 'premier', accessLevel: 9, zarPrice: 2625, usdPrice: 150, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0237', title: 'Energy Alignment & Optimisation Certified Master Practitioner (CertMasterPrdip) - Premier Membership', handle: 'membership-s0237', track: 'energy-clearing', level: 'master', tierType: 'premier', accessLevel: 9, zarPrice: 2625, usdPrice: 150, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0238', title: 'Energy Alignment & Optimisation Instructor (Inst) - Premier Membership', handle: 'membership-s0238', track: 'energy-clearing', level: 'instructor', tierType: 'premier', accessLevel: 9, zarPrice: 2625, usdPrice: 150, requiresTraining: true, canChargeClients: true, annual: true },
  { sku: 'S0239', title: 'Energy Alignment & Optimisation Certified Master Instructor (CertMasterInst) - Premier Membership', handle: 'membership-s0239', track: 'energy-clearing', level: 'master-instructor', tierType: 'premier', accessLevel: 10, zarPrice: 2625, usdPrice: 150, requiresTraining: true, canChargeClients: true, annual: true },
]

/**
 * Who may join which level. Lifestyle and Student have no prerequisites
 * (Suzanne, 12 Nov 2026). Novice follows her Career & Certification Pathway
 * documents of 12 Nov (Johan, 16 Nov: use them as sent; they replace the
 * fundamentals-plus-teacher-sign-off rule of her 12 Nov mail): Akashic Novice
 * Navigator = AN1 + AN2, Energy Alignment & Optimisation Novice Practitioner =
 * EA1 + EA2, Rapid Repatterning Novice Practitioner = RP1 + RP2, each followed
 * by the Session Log, practice sessions and the observation the pathway sets
 * out, after which the Certification & Quality Assurance team confirms the
 * status. Akashic and Energy Alignment & Optimisation are two separate ladders.
 * Resonance Repatterning is not covered by those documents, so no Novice rule
 * is stated for it (KI118). The levels above Novice keep "requires training".
 *
 * Novice is bought, then checked (Suzanne, 19 Nov 2026): the member pays, the
 * site emails what to upload, they upload it at /portal/novice, the team
 * approves it at /staff/novice, and only then does Novice access start
 * (lib/novice/applications.ts). See isDirectlyBuyable.
 */
export type JoiningRequirement = 'none' | 'novice-prerequisites' | 'training'

export function joiningRequirement(tier: MembershipTier): JoiningRequirement {
  if (tier.level === 'guest' || tier.level === 'lifestyle' || tier.level === 'student') return 'none'
  if (tier.level === 'novice') return 'novice-prerequisites'
  return 'training'
}

/**
 * May this tier be bought from /portal/upgrade? Every level but Guest, the
 * free base level every member already has. Novice is bought too (Suzanne,
 * 19 Nov 2026), but its access starts only when the team approves the
 * member's documents (startsOnApproval).
 */
export function isDirectlyBuyable(tier: MembershipTier): boolean {
  return tier.level !== 'guest'
}

/** Novice access starts on the team's approval, not on payment. */
export function startsOnApproval(tier: MembershipTier): boolean {
  return joiningRequirement(tier) === 'novice-prerequisites'
}

/** The member's tier name for display: the free base row reads as the store's Guest Membership (KI072). */
export function memberTierName(tier: { name?: string | null; slug?: string | null } | null | undefined): string {
  if (!tier || !tier.slug || tier.slug === 'free' || !tier.name) return 'Guest Membership'
  return tier.name
}

const PATHWAY = {
  akashic: { link: 'Akashic Navigation Career & Certification Pathway', href: '/programs/certification/akashic-navigation' },
  'energy-clearing': { link: 'Energy Alignment & Optimisation Career & Certification Pathway', href: '/programs/certification/energy-alignment-optimisation' },
  'rapid-repatterning': { link: 'Rapid Repatterning Career & Certification Pathway', href: '/programs/certification/rapid-repatterning' },
} as const

/** The Novice prerequisite of each ladder, as the pathway documents' "levels at a glance" state it. */
export const NOVICE_FUNDAMENTALS: Record<'akashic' | 'energy-clearing', { prerequisite: string; status: string; text: RichLine }> = {
  akashic: {
    prerequisite: 'AN1 + AN2',
    status: 'Novice Navigator',
    text: ['Novice Navigator: AN1 + AN2, then the Session Log, practice readings and observation set out in the ', PATHWAY.akashic, '.'],
  },
  'energy-clearing': {
    prerequisite: 'EA1 + EA2',
    status: 'Novice Practitioner',
    text: ['Novice Practitioner: EA1 + EA2, then the Session Log, practice sessions and observation set out in the ', PATHWAY['energy-clearing'], '.'],
  },
}

/** The short label on a membership card. */
export function joiningLabel(tier: MembershipTier): string {
  switch (joiningRequirement(tier)) {
    case 'none':
      return 'No prerequisites'
    case 'novice-prerequisites':
      return tier.track === 'akashic' || tier.track === 'energy-clearing'
        ? `${NOVICE_FUNDAMENTALS[tier.track].prerequisite} + observation`
        : 'Requires training'
    case 'training':
      return 'Requires training'
  }
}

/** The whole rule, for the top of the upgrade page. The trademarks mark the first use on that page. */
export const MEMBERSHIP_JOINING_RULE: RichLine[] = [
  'Lifestyle and Student memberships have no prerequisites.',
  'Novice: an Akashic Navigation™ Novice Navigator completes AN1 + AN2, an Energy Alignment & Optimisation™ Novice Practitioner EA1 + EA2, and a Rapid Repatterning™ Novice Practitioner RP1 + RP2. The Certification & Quality Assurance team then checks your documents and recordings and confirms your status.',
  ['The steps, sessions to log and fees for every level are in the ', PATHWAY.akashic, ', the ', PATHWAY['energy-clearing'], ' and the ', PATHWAY['rapid-repatterning'], '.'],
  'Akashic and Energy Alignment & Optimisation are separate ladders: you climb each one on its own.',
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

const MEMBERSHIP_PRODUCT_HANDLES = new Set(MEMBERSHIP_TIERS.map((t) => t.handle))

/**
 * Is this store handle a membership product? Memberships are sold only from
 * /portal/upgrade (KI129, Johan 20 Nov 2026): the shop listing, its count,
 * search and the sitemap leave them out even when published, and their
 * product page (the Upgrade Now target) is not indexed. Client-safe.
 */
export function isMembershipProductHandle(handle: string | null | undefined): boolean {
  return typeof handle === 'string' && MEMBERSHIP_PRODUCT_HANDLES.has(handle)
}
