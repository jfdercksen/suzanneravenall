/**
 * The membership catalogue, shared by the store (order-placed, the publish
 * and metadata scripts) and the website (Novice approval) so a level means
 * the same thing everywhere (KI128, Johan 20 Nov 2026).
 *
 * Words, as Suzanne uses them (19 Nov): a PROGRAMME is Akashic Navigation or
 * Energy Alignment & Optimisation (the id 'energy-clearing' keeps the old
 * name on purpose, KI116); a LEVEL is Student, Novice, Practitioner and up.
 * 'general' memberships (Guest, Lifestyle) belong to no programme.
 *
 * Every membership product carries its SKU in `metadata.tier`. A paid order
 * gives the buyer that level for MEMBERSHIP_TERM_DAYS from payment; a Novice
 * order gives nothing until the team approves the member's documents, and the
 * term then runs from the approval. One payment a year, nothing renews.
 *
 * RENEWAL HOOK: there is no renewal yet. When it is built it starts from the
 * member_subscriptions rows whose annual_renewal_date is close (a Medusa
 * scheduled job in apps/medusa/src/jobs/, per docs/n8n-migration-plan.md),
 * sends a link to buy the same SKU again, and a paid renewal calls the same
 * activation as a first purchase, extending from the current end date
 * (membershipTermEnd(currentEnd)) instead of from today.
 */

export type MembershipProgramme = 'general' | 'akashic' | 'energy-clearing'
export type MembershipLevelKey =
  | 'guest' | 'lifestyle' | 'student' | 'novice' | 'practitioner'
  | 'certified' | 'advanced' | 'mentor' | 'master' | 'instructor' | 'master-instructor'
export type MembershipTierType = 'basic' | 'premier' | 'standard'

export interface MembershipLevel {
  sku: string
  title: string
  programme: MembershipProgramme
  level: MembershipLevelKey
  tierType: MembershipTierType
  accessLevel: number
  /** Rand and dollars, whole units (the store keeps cents). */
  zar: number
  usd: number
  annual: boolean
}

const EAO = 'Energy Alignment & Optimisation'

const m = (
  sku: string,
  title: string,
  programme: MembershipProgramme,
  level: MembershipLevelKey,
  tierType: MembershipTierType,
  accessLevel: number,
  zar: number,
  usd: number,
): MembershipLevel => ({ sku, title, programme, level, tierType, accessLevel, zar, usd, annual: sku !== 'S0211' })

export const MEMBERSHIP_LEVELS: readonly MembershipLevel[] = [
  m('S0211', 'Guest Membership', 'general', 'guest', 'standard', 1, 0, 0),
  m('S0212', 'Lifestyle Membership', 'general', 'lifestyle', 'standard', 2, 350, 20),
  m('S0213', 'Akashic Student Membership', 'akashic', 'student', 'standard', 3, 525, 30),
  m('S0214', 'Akashic Novice Practitioner - Basic Membership', 'akashic', 'novice', 'basic', 4, 875, 50),
  m('S0215', 'Akashic Novice Practitioner - Premier Membership', 'akashic', 'novice', 'premier', 4, 1225, 70),
  m('S0216', 'Akashic Practitioner (Prdip) - Basic Membership', 'akashic', 'practitioner', 'basic', 5, 1400, 80),
  m('S0217', 'Akashic Practitioner (Prdip) - Premier Membership', 'akashic', 'practitioner', 'premier', 5, 1750, 100),
  m('S0218', 'Akashic Certified Practitioner (CertPrdip) - Basic Membership', 'akashic', 'certified', 'basic', 6, 1750, 100),
  m('S0219', 'Akashic Certified Practitioner (CertPrdip) - Premier Membership', 'akashic', 'certified', 'premier', 6, 2100, 120),
  m('S0220', 'Akashic Certified Advanced Practitioner (CertAdvPrdip) - Basic Membership', 'akashic', 'advanced', 'basic', 7, 1750, 100),
  m('S0221', 'Akashic Certified Advanced Practitioner (CertAdvPrdip) - Premier Membership', 'akashic', 'advanced', 'premier', 7, 2100, 120),
  m('S0222', 'Akashic Mentor (MentorPrdip) - Premier Membership', 'akashic', 'mentor', 'premier', 8, 1750, 100),
  m('S0223', 'Akashic Master Practitioner (MasterPrdip) - Premier Membership', 'akashic', 'master', 'premier', 9, 2625, 150),
  m('S0224', 'Akashic Instructor (Inst) - Premier Membership', 'akashic', 'instructor', 'premier', 9, 2625, 150),
  m('S0225', 'Akashic Certified Master Instructor (CertMasterInst) - Premier Membership', 'akashic', 'master-instructor', 'premier', 10, 2625, 150),
  m('S0226', `${EAO} Student Membership`, 'energy-clearing', 'student', 'standard', 3, 525, 30),
  m('S0227', `${EAO} Novice Practitioner - Basic Membership`, 'energy-clearing', 'novice', 'basic', 4, 875, 50),
  m('S0228', `${EAO} Novice Practitioner - Premier Membership`, 'energy-clearing', 'novice', 'premier', 4, 1225, 70),
  m('S0229', `${EAO} Practitioner (Prdip) - Basic Membership`, 'energy-clearing', 'practitioner', 'basic', 5, 1400, 80),
  m('S0230', `${EAO} Practitioner (Prdip) - Premier Membership`, 'energy-clearing', 'practitioner', 'premier', 5, 1750, 100),
  m('S0231', `${EAO} Certified Practitioner (CertPrdip) - Basic Membership`, 'energy-clearing', 'certified', 'basic', 6, 1750, 100),
  m('S0232', `${EAO} Certified Practitioner (CertPrdip) - Premier Membership`, 'energy-clearing', 'certified', 'premier', 6, 2100, 120),
  m('S0233', `${EAO} Certified Advanced Practitioner (CertAdvPrdip) - Basic Membership`, 'energy-clearing', 'advanced', 'basic', 7, 1750, 100),
  m('S0234', `${EAO} Certified Advanced Practitioner (CertAdvPrdip) - Premier Membership`, 'energy-clearing', 'advanced', 'premier', 7, 2100, 120),
  m('S0235', `${EAO} Mentor (MentorPrdip) - Premier Membership`, 'energy-clearing', 'mentor', 'premier', 8, 1750, 100),
  m('S0236', `${EAO} Master Practitioner (MasterPrdip) - Premier Membership`, 'energy-clearing', 'master', 'premier', 9, 2625, 150),
  m('S0237', `${EAO} Certified Master Practitioner (CertMasterPrdip) - Premier Membership`, 'energy-clearing', 'master', 'premier', 9, 2625, 150),
  m('S0238', `${EAO} Instructor (Inst) - Premier Membership`, 'energy-clearing', 'instructor', 'premier', 9, 2625, 150),
  m('S0239', `${EAO} Certified Master Instructor (CertMasterInst) - Premier Membership`, 'energy-clearing', 'master-instructor', 'premier', 10, 2625, 150),
]

export const MEMBERSHIP_TERM_DAYS = 365

const DAY_MS = 24 * 60 * 60 * 1000

/** The level for a SKU ("S0216", any case), or undefined. */
export function membershipBySku(sku: string | null | undefined): MembershipLevel | undefined {
  if (typeof sku !== 'string') return undefined
  const key = sku.trim().toUpperCase()
  return MEMBERSHIP_LEVELS.find((l) => l.sku === key)
}

/** The store handle of a level's product. */
export function membershipHandle(level: MembershipLevel): string {
  return `membership-${level.sku.toLowerCase()}`
}

const MEMBERSHIP_HANDLES = new Set(MEMBERSHIP_LEVELS.map((l) => membershipHandle(l)))

/**
 * Is this store handle one of the 29 membership products? Memberships are sold
 * only from /portal/upgrade (KI129, Johan 20 Nov 2026), so the shop listing,
 * search and the sitemap leave them out even when they are published.
 */
export function isMembershipHandle(handle: string | null | undefined): boolean {
  return typeof handle === 'string' && MEMBERSHIP_HANDLES.has(handle)
}

/** The membership_tiers slug of a level (supabase/migrations/20261120090000_membership_levels.sql). */
export function membershipTierSlug(level: MembershipLevel): string {
  return level.sku.toLowerCase()
}

/** Novice access starts only when the team approves the member's documents (Suzanne, 19 Nov). */
export function isNoviceLevel(level: MembershipLevel): boolean {
  return level.level === 'novice'
}

/** Guest is the free base level every member has: never sold. */
export function isSellableLevel(level: MembershipLevel): boolean {
  return level.level !== 'guest'
}

/** When a term that starts at `start` ends: MEMBERSHIP_TERM_DAYS later. */
export function membershipTermEnd(start: Date): Date {
  return new Date(start.getTime() + MEMBERSHIP_TERM_DAYS * DAY_MS)
}

/** The member_subscriptions fields an active level carries (besides user_id and tier_id). */
export interface MembershipAccessFields {
  status: 'active'
  start_date: string
  end_date: string
  annual_renewal_date: string
  access_level: number
  track: MembershipProgramme
  sku: string
}

export function membershipAccessFields(level: MembershipLevel, start: Date): MembershipAccessFields {
  const end = membershipTermEnd(start).toISOString()
  return {
    status: 'active',
    start_date: start.toISOString(),
    end_date: end,
    annual_renewal_date: end,
    access_level: level.accessLevel,
    track: level.programme,
    sku: level.sku,
  }
}

const PROGRAMME_NAMES: Record<MembershipProgramme, string | null> = {
  general: null,
  akashic: 'Akashic Navigation',
  'energy-clearing': EAO,
}

/** The programme's name, or null for a general membership. */
export function membershipProgrammeName(level: MembershipLevel): string | null {
  return PROGRAMME_NAMES[level.programme]
}

// ── What is on sale (KI133, Johan 20 Nov 2026) ───────────────────────────────

/**
 * Memberships open with Lifestyle, Student and Novice only (both programmes
 * where they apply). The training levels, Practitioner up to Certified Master
 * Instructor, are not for sale at launch: buying one would give its access at
 * once and skip the Novice approval. The rule for selling them later is open.
 */
const LAUNCH_LEVELS: ReadonlySet<MembershipLevelKey> = new Set(['lifestyle', 'student', 'novice'])

export function isLaunchLevel(level: MembershipLevel): boolean {
  return LAUNCH_LEVELS.has(level.level)
}

/** The training levels (Practitioner and up). */
export function isTrainingLevel(level: MembershipLevel): boolean {
  return isSellableLevel(level) && !isLaunchLevel(level)
}

/**
 * The one switch that puts the training levels on sale: MEMBERSHIP_TRAINING_LEVELS=on
 * (server env of web and medusa; the publish script reads it too). Off by default.
 */
export function trainingLevelsOnSale(env: Record<string, string | undefined> = process.env): boolean {
  return env.MEMBERSHIP_TRAINING_LEVELS === 'on'
}

/** May this level be bought now? Never Guest; training levels only with the switch on. */
export function isOnSale(level: MembershipLevel, env: Record<string, string | undefined> = process.env): boolean {
  return isSellableLevel(level) && (isLaunchLevel(level) || trainingLevelsOnSale(env))
}

/** The level whose product has this store handle, or undefined. */
export function membershipByHandle(handle: string | null | undefined): MembershipLevel | undefined {
  if (!isMembershipHandle(handle)) return undefined
  return membershipBySku(String(handle).replace(/^membership-/, ''))
}

/** What the store says when a level is not open for purchase. */
export function notOpenForPurchaseMessage(title: string): string {
  return `${title} is not open for purchase yet. Please contact the team.`
}

