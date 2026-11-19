import { isDirectlyBuyable, MEMBERSHIP_TIERS } from '@/lib/access/tiers'

/**
 * Which membership products the store API actually returns (KI071, reopened
 * 17 Nov 2026). The 29 membership products are drafts on the review box, and
 * the store API never returns a draft, so an "Upgrade Now" link to one is a
 * 404. The upgrade page only links the handles this finds; the rest read
 * "Opens at launch". Server side only. Any failure counts as none available.
 */

const PAGE = 100
const MAX_PAGES = 20

// Only tiers that may be bought directly: a published Guest or Novice product
// still gets no Upgrade Now link (KI114).
const MEMBERSHIP_HANDLES = new Set(MEMBERSHIP_TIERS.filter(isDirectlyBuyable).map((t) => t.handle))

/** The directly buyable membership handles among the products the store returned. */
export function membershipHandlesIn(products: Array<{ handle?: string | null }>): string[] {
  return products.map((p) => p.handle ?? '').filter((h) => MEMBERSHIP_HANDLES.has(h))
}

type StorePage = { products?: Array<{ handle?: string | null }>; count?: number }

export async function fetchAvailableMembershipHandles(fetchImpl: typeof fetch = fetch): Promise<string[]> {
  const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_URL ?? ''
  const MEDUSA_PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''
  if (!MEDUSA_URL) return []
  const found: string[] = []
  try {
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const offset = page * PAGE
      const res = await fetchImpl(`${MEDUSA_URL}/store/products?fields=handle&limit=${PAGE}&offset=${offset}`, {
        headers: { 'x-publishable-api-key': MEDUSA_PUB_KEY },
        cache: 'no-store',
      })
      if (!res.ok) return []
      const data = (await res.json()) as StorePage
      const products = data.products ?? []
      found.push(...membershipHandlesIn(products))
      if (products.length < PAGE || (typeof data.count === 'number' && offset + products.length >= data.count)) break
    }
    return found
  } catch {
    return []
  }
}
