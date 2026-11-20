/**
 * The plan behind publish-memberships-2026-11-19.ts (KI071 switch-on, KI128):
 * which membership products may be published, what each still lacks, and
 * what the apply step would change. Pure, so it is tested without Medusa.
 *
 * Published: the 28 levels S0212 to S0239, the four Novice levels included
 * (Suzanne, 19 Nov: Novice is bought, then access starts on the team's
 * approval). Never published: S0211 Guest, the free base level every member
 * already has.
 *
 * Besides status and sales channel, apply writes metadata.tier = the SKU
 * when it is missing (order-placed reads it to know the level, KI128), merged
 * into the product's other metadata. A tier that is set to anything else is a
 * blocker: fix it by hand rather than overwrite it.
 *
 * Titles and prices come from packages/integrations memberships.ts, which a
 * test keeps equal to apps/web/lib/access/tiers.ts. A product still named
 * "Energy Clearing ..." means the KI116 rename script has not run yet.
 */

import { isSellableLevel, MEMBERSHIP_LEVELS, membershipHandle } from '@suzanne/integrations'

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

/** The 28 sellable levels, in SKU order, with the site's title and price (rand / dollars). */
export const PUBLISH_TIERS: TierSpec[] = MEMBERSHIP_LEVELS.filter(isSellableLevel).map((l) => ({
  sku: l.sku,
  handle: membershipHandle(l),
  title: l.title,
  zar: l.zar,
  usd: l.usd,
}))

/** Never published by this script, with why. */
export const HELD_BACK: Record<string, string> = {
  'membership-s0211': 'Guest: the free base level, nothing to buy',
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
  update: { status?: 'published'; sales_channels?: Array<{ id: string }>; metadata?: Record<string, unknown> } | null
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
    const tierMissing = meta.tier === undefined || meta.tier === null || meta.tier === ''
    if (!tierMissing && meta.tier !== spec.sku) {
      blockers.push(`metadata.tier is "${String(meta.tier)}", not ${spec.sku}: fix it by hand (the script never overwrites a level)`)
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
    if (tierMissing) update.metadata = { ...meta, tier: spec.sku }
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
