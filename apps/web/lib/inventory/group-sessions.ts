import { getSpotsInfo, isLiveVariantTitle } from './spots'

/**
 * Server-side fetch for the homepage's real "next cohort" widget.
 *
 * Source of truth for which products count as group sessions:
 * apps/medusa/src/scripts/seed-group-session-inventory.ts (GROUP_SESSION_PRODUCTS).
 * Excludes "group-session-attraction-frequency-recorded", which has no "Live"
 * variant at all (recorded-only).
 *
 * Deliberately does NOT fabricate a cohort date — no real schedule data
 * exists yet (see apps/web/app/events/EventsContent.tsx, which is honest
 * about dates being unconfirmed). Callers must render an honest fallback
 * when this returns null rather than inventing one.
 */
const GROUP_SESSION_HANDLES = [
  'group-session-being-a-great-boundary-setter-booked-as-a-series-only',
  'career-progression-group-session',
  'group-session-develop-super-confidence',
  'love-relationships-group-session',
  'money-mastery-group-session',
  'group-session-nice-or-not-nice-in-communication-booked-as-a-series-only',
  'group-session-shedding-excess-weight',
] as const

const GROUP_SESSION_HANDLE_SET = new Set<string>(GROUP_SESSION_HANDLES)

/**
 * Whether a product is one of the real, capacity-limited group sessions.
 * Deliberately an explicit handle allowlist, NOT a title/regex match on the
 * variant ("Live", "Live via Zoom", etc.) — many unrelated self-paced course
 * products also have variants titled "Live via Zoom" / "Live Retaker"
 * (Resonance Repatterning, Akashic Navigator, Energy Clearing levels — see
 * migrate-woocommerce.ts), and a title heuristic would show a fabricated
 * spots-left/sold-out badge on all of them. Callers (ProductCard,
 * VariantSelector) MUST gate on this before trusting `inventory_quantity` /
 * `isLiveVariantTitle` on an arbitrary product.
 */
export function isCapacityLimitedHandle(handle: string | null | undefined): boolean {
  return handle != null && GROUP_SESSION_HANDLE_SET.has(handle)
}

// Kept in sync by hand with SEAT_CAPACITY in
// apps/medusa/src/scripts/seed-group-session-inventory.ts — cross-app
// imports aren't available in this monorepo without a shared package (see
// no-bad-patterns.md re: CATEGORY_ACCESS_MAP). This value is only used for
// the "X people max" copy; the real spotsRemaining count always comes from
// live inventory_quantity, so a drift here is cosmetic, not a data-integrity risk.
const SEAT_CAPACITY = 12

export interface FeaturedCohort {
  productTitle: string
  productHandle: string
  variantTitle: string
  spotsRemaining: number
  capacity: number
  priceZar: number | null
  duration: string | null
}

interface StoreVariant {
  id: string
  title: string
  prices: Array<{ currency_code: string; amount: number }>
  inventory_quantity?: number | null
}

interface StoreProduct {
  id: string
  handle: string
  title: string
  metadata?: Record<string, unknown> | null
  variants: StoreVariant[]
}

interface ProductsResponse {
  products: StoreProduct[]
}

/**
 * Picks the "most urgent" real cohort: the configured Live variant with the
 * fewest spots remaining that still has at least 1 open. Falls back to a
 * sold-out one (so the UI can still point at something real + a waitlist
 * CTA) only if every configured cohort is full. Returns null if none of the
 * group-session products have been seeded with real inventory yet (the
 * seed script hasn't been run in this environment) — callers must not
 * invent placeholder numbers in that case.
 */
export async function getFeaturedCohort(): Promise<FeaturedCohort | null> {
  const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_URL ?? ''
  const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''
  if (!medusaUrl) return null

  const params = new URLSearchParams({
    fields:
      'id,handle,title,metadata,*variants,*variants.prices,+variants.inventory_quantity',
    limit: String(GROUP_SESSION_HANDLES.length),
  })
  GROUP_SESSION_HANDLES.forEach((handle) => params.append('handle[]', handle))

  let products: StoreProduct[]
  try {
    const res = await fetch(`${medusaUrl}/store/products?${params.toString()}`, {
      headers: { 'x-publishable-api-key': pubKey },
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as ProductsResponse
    products = Array.isArray(data.products) ? data.products : []
  } catch {
    return null
  }

  const candidates: FeaturedCohort[] = []

  for (const product of products) {
    const liveVariant = product.variants.find((v) => isLiveVariantTitle(v.title))
    if (!liveVariant) continue

    const spots = getSpotsInfo(liveVariant.inventory_quantity)
    // null means this variant isn't inventory-tracked yet in this
    // environment (seed script not run) — skip rather than guess.
    if (spots === null) continue

    const zarPrice = liveVariant.prices.find((p) => p.currency_code === 'zar')

    candidates.push({
      productTitle: product.title,
      productHandle: product.handle,
      variantTitle: liveVariant.title,
      spotsRemaining: spots.spotsRemaining,
      capacity: SEAT_CAPACITY,
      priceZar: zarPrice ? zarPrice.amount / 100 : null,
      duration: typeof product.metadata?.duration === 'string' ? product.metadata.duration : null,
    })
  }

  if (candidates.length === 0) return null

  const withSpots = candidates.filter((c) => c.spotsRemaining > 0)
  const pool = withSpots.length > 0 ? withSpots : candidates
  return pool.reduce((most, current) =>
    current.spotsRemaining < most.spotsRemaining ? current : most
  )
}
