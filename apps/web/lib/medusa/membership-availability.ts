import { trainingLevelsOnSale } from '@suzanne/integrations'
import { isOnSaleNow, MEMBERSHIP_TIERS } from '@/lib/access/tiers'

/**
 * Which membership products the store API actually returns (KI071, reopened
 * 17 Nov 2026). The 29 membership products are drafts on the review box, and
 * the store API never returns a draft, so an "Upgrade Now" link to one is a
 * 404. The upgrade page only links the handles this finds; the rest read
 * "Opens at launch". Server side only. Any failure counts as none available.
 */

const PAGE = 100
const MAX_PAGES = 20

/**
 * The handles of levels on sale now among the products the store returned:
 * never Guest, and a training level only with MEMBERSHIP_TRAINING_LEVELS=on
 * (KI133), even when its product is published.
 */
export function membershipHandlesIn(products: Array<{ handle?: string | null }>, trainingOpen: boolean = trainingLevelsOnSale()): string[] {
  const onSale = new Set(MEMBERSHIP_TIERS.filter((t) => isOnSaleNow(t, trainingOpen)).map((t) => t.handle))
  return products.map((p) => p.handle ?? '').filter((h) => onSale.has(h))
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
