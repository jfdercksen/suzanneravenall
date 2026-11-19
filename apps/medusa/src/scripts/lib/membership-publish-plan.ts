/**
 * The plan behind publish-memberships-2026-11-19.ts (KI071 switch-on, 19 Nov
 * 2026): which membership products may be published, what each still lacks,
 * and what the apply step would change. Pure, so it is tested without Medusa.
 *
 * Published: the 24 tiers a member may buy straight from /portal/upgrade.
 * Never published here: S0211 Guest (the free base level every member already
 * has; a R0 product would only open a free checkout) and the four Novice tiers
 * S0214, S0215, S0227, S0228 (the Certification & Quality Assurance team
 * confirms a Novice and no sign-off gate exists, KI114). The web side refuses
 * them too (apps/web/lib/access/tiers.ts isDirectlyBuyable).
 *
 * Titles must equal apps/web/lib/access/tiers.ts exactly (a test checks it), so
 * a product still named "Energy Clearing ..." means the KI116 rename script has
 * not run yet.
 */

export type MembershipRow = {
  id: string
  handle: string
  title?: string | null
  status?: string | null
  description?: string | null
  metadata?: Record<string, unknown> | null
  sales_channels?: Array<{ id: string } | null> | null
  variants?: Array<{
    id?: string
    manage_inventory?: boolean | null
    prices?: Array<{ currency_code?: string | null; amount?: number | null } | null> | null
  } | null> | null
}

export type TierSpec = { sku: string; handle: string; title: string; zar: number; usd: number }

const t = (sku: string, title: string, zar: number, usd: number): TierSpec => ({
  sku,
  handle: `membership-${sku.toLowerCase()}`,
  title,
  zar,
  usd,
})

const EAO = 'Energy Alignment & Optimisation'

/** The 24 directly buyable tiers, in SKU order, with the site's title and price (rand / dollars). */
export const PUBLISH_TIERS: TierSpec[] = [
  t('S0212', 'Lifestyle Membership', 350, 20),
  t('S0213', 'Akashic Student Membership', 525, 30),
  t('S0216', 'Akashic Practitioner (Prdip) - Basic Membership', 1400, 80),
  t('S0217', 'Akashic Practitioner (Prdip) - Premier Membership', 1750, 100),
  t('S0218', 'Akashic Certified Practitioner (CertPrdip) - Basic Membership', 1750, 100),
  t('S0219', 'Akashic Certified Practitioner (CertPrdip) - Premier Membership', 2100, 120),
  t('S0220', 'Akashic Certified Advanced Practitioner (CertAdvPrdip) - Basic Membership', 1750, 100),
  t('S0221', 'Akashic Certified Advanced Practitioner (CertAdvPrdip) - Premier Membership', 2100, 120),
  t('S0222', 'Akashic Mentor (MentorPrdip) - Premier Membership', 1750, 100),
  t('S0223', 'Akashic Master Practitioner (MasterPrdip) - Premier Membership', 2625, 150),
  t('S0224', 'Akashic Instructor (Inst) - Premier Membership', 2625, 150),
  t('S0225', 'Akashic Certified Master Instructor (CertMasterInst) - Premier Membership', 2625, 150),
  t('S0226', `${EAO} Student Membership`, 525, 30),
  t('S0229', `${EAO} Practitioner (Prdip) - Basic Membership`, 1400, 80),
  t('S0230', `${EAO} Practitioner (Prdip) - Premier Membership`, 1750, 100),
  t('S0231', `${EAO} Certified Practitioner (CertPrdip) - Basic Membership`, 1750, 100),
  t('S0232', `${EAO} Certified Practitioner (CertPrdip) - Premier Membership`, 2100, 120),
  t('S0233', `${EAO} Certified Advanced Practitioner (CertAdvPrdip) - Basic Membership`, 1750, 100),
  t('S0234', `${EAO} Certified Advanced Practitioner (CertAdvPrdip) - Premier Membership`, 2100, 120),
  t('S0235', `${EAO} Mentor (MentorPrdip) - Premier Membership`, 1750, 100),
  t('S0236', `${EAO} Master Practitioner (MasterPrdip) - Premier Membership`, 2625, 150),
  t('S0237', `${EAO} Certified Master Practitioner (CertMasterPrdip) - Premier Membership`, 2625, 150),
  t('S0238', `${EAO} Instructor (Inst) - Premier Membership`, 2625, 150),
  t('S0239', `${EAO} Certified Master Instructor (CertMasterInst) - Premier Membership`, 2625, 150),
]

/** Never published by this script, with why. */
export const HELD_BACK: Record<string, string> = {
  'membership-s0211': 'Guest: the free base level, nothing to buy',
  'membership-s0214': 'Novice: confirmed by the team, no sign-off gate (KI114)',
  'membership-s0215': 'Novice: confirmed by the team, no sign-off gate (KI114)',
  'membership-s0227': 'Novice: confirmed by the team, no sign-off gate (KI114)',
  'membership-s0228': 'Novice: confirmed by the team, no sign-off gate (KI114)',
}

export type TierPlan = {
  spec: TierSpec
  id: string | null
  status: string | null
  /** Stop the apply: selling it now would take money for something that cannot be delivered or would be wrong. */
  blockers: string[]
  /** Worth fixing, does not stop the sale. */
  warnings: string[]
  /** What apply would write; null when nothing is needed. */
  update: { status?: 'published'; sales_channels?: Array<{ id: string }> } | null
}

export type PublishPlan = {
  tiers: TierPlan[]
  /** Held-back products the store has published anyway: unpublish them by hand. */
  heldBackPublished: string[]
  ready: boolean
}

function priceOf(row: MembershipRow, currency: string): number | null {
  for (const v of row.variants ?? []) {
    for (const p of v?.prices ?? []) {
      if (p?.currency_code?.toLowerCase() === currency && typeof p.amount === 'number') return p.amount
    }
  }
  return null
}

/** This store keeps every amount in cents (the seeds and the storefront divide by 100), so R350 is 35000. */
function priceMatches(amount: number | null, expected: number): boolean {
  return amount === expected * 100
}

export function planPublish(rows: MembershipRow[], defaultSalesChannelId: string | null): PublishPlan {
  const byHandle = new Map(rows.map((r) => [r.handle, r]))
  const tiers: TierPlan[] = PUBLISH_TIERS.map((spec) => {
    const row = byHandle.get(spec.handle)
    const blockers: string[] = []
    const warnings: string[] = []
    if (!row) {
      return { spec, id: null, status: null, blockers: ['product missing from the store'], warnings, update: null }
    }

    if (row.title !== spec.title) blockers.push(`title "${row.title ?? ''}" is not the site's "${spec.title}" (run the KI116 rename script first)`)
    const meta = row.metadata ?? {}
    if (meta.product_type !== 'membership') blockers.push('metadata.product_type is not "membership": the order would take the generic path')
    if (typeof meta.tier !== 'string' || meta.tier === '') {
      blockers.push('metadata.tier missing: order-placed skips activation, the buyer pays and gets no portal access (KI128)')
    }
    const zar = priceOf(row, 'zar')
    if (!priceMatches(zar, spec.zar)) blockers.push(`ZAR price ${zar ?? 'none'} (cents) is not R${spec.zar}`)
    const usd = priceOf(row, 'usd')
    if (!priceMatches(usd, spec.usd)) warnings.push(`USD price ${usd ?? 'none'} (cents) is not $${spec.usd}`)
    if (!row.description || row.description.trim() === '') warnings.push('no description: the shop page shows the title and price only')
    if ((row.variants ?? []).some((v) => v?.manage_inventory === true)) {
      warnings.push('a variant manages inventory: without stock the cart refuses it')
    }

    const channels = (row.sales_channels ?? []).filter((c): c is { id: string } => !!c?.id)
    const update: NonNullable<TierPlan['update']> = {}
    if (row.status !== 'published') update.status = 'published'
    if (!defaultSalesChannelId) {
      blockers.push('the store has no default sales channel')
    } else if (!channels.some((c) => c.id === defaultSalesChannelId)) {
      update.sales_channels = [...channels.map((c) => ({ id: c.id })), { id: defaultSalesChannelId }]
    }

    return {
      spec,
      id: row.id,
      status: row.status ?? null,
      blockers,
      warnings,
      update: Object.keys(update).length > 0 ? update : null,
    }
  })

  const heldBackPublished = Object.keys(HELD_BACK).filter((h) => byHandle.get(h)?.status === 'published')
  return { tiers, heldBackPublished, ready: tiers.every((p) => p.blockers.length === 0) && heldBackPublished.length === 0 }
}
