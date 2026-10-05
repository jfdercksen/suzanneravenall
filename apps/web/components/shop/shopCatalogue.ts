import { getHighlightBadge } from '@/data/shopHighlights'
import type { MedusaProduct } from '@/types/medusa'

/**
 * Pure helpers for the /shop catalogue: URL state, sorting and search ordering.
 * Kept out of ShopCatalogueContent so they can be unit tested.
 */

export type SortOption = 'featured' | 'price_asc' | 'price_desc'

const SORT_OPTIONS: readonly SortOption[] = ['featured', 'price_asc', 'price_desc']

/** The only collection the filter bar exposes (the "Self-Study" pill). */
export const SELF_STUDY_COLLECTION = 'programmes'

/** Shop state as it lives in the URL. `page` is 0-based here, 1-based in the URL. */
export interface ShopUrlState {
  categoryHandle: string
  collectionHandle: string
  page: number
  sort: SortOption
  q: string
}

interface ReadableParams {
  get(name: string): string | null
}

export function parseShopParams(params: ReadableParams): ShopUrlState {
  const categoryHandle = (params.get('category') ?? '').trim()
  // Only the collection the UI can select is honoured, so stale links such as
  // ?collection=membership keep showing the full catalogue rather than an empty one.
  const rawCollection = (params.get('collection') ?? '').trim()
  const collectionHandle = !categoryHandle && rawCollection === SELF_STUDY_COLLECTION ? rawCollection : ''
  const rawSort = params.get('sort') ?? ''
  const sort = (SORT_OPTIONS as readonly string[]).includes(rawSort) ? (rawSort as SortOption) : 'featured'
  const pageNum = parseInt(params.get('page') ?? '', 10)
  const page = Number.isFinite(pageNum) && pageNum > 1 ? pageNum - 1 : 0
  const q = params.get('q') ?? ''
  return { categoryHandle, collectionHandle, page, sort, q }
}

/** Serialise shop state to a query string, leaving out defaults so /shop stays clean. */
export function shopStateToQuery(state: ShopUrlState): string {
  const params = new URLSearchParams()
  if (state.categoryHandle) params.set('category', state.categoryHandle)
  else if (state.collectionHandle) params.set('collection', state.collectionHandle)
  if (state.q.trim()) params.set('q', state.q)
  if (state.sort !== 'featured') params.set('sort', state.sort)
  if (state.page > 0) params.set('page', String(state.page + 1))
  return params.toString()
}

function lowestPrice(product: MedusaProduct, currency: string): number | null {
  const amounts = product.variants
    .flatMap((v) => v.prices)
    .filter((p) => p.currency_code === currency)
    .map((p) => p.amount)
  return amounts.length > 0 ? Math.min(...amounts) : null
}

/**
 * Sort the whole list in one currency. The visitor's currency is used only
 * when every product is priced in it; otherwise everything is compared in ZAR,
 * so dollar and rand amounts are never compared as raw numbers. Unpriced
 * products go last in both directions.
 */
export function sortProducts(products: MedusaProduct[], sort: SortOption, currency: string): MedusaProduct[] {
  if (sort === 'price_asc' || sort === 'price_desc') {
    const sortCurrency =
      products.length > 0 && products.every((p) => lowestPrice(p, currency) !== null) ? currency : 'zar'
    const dir = sort === 'price_asc' ? 1 : -1
    return [...products].sort((a, b) => {
      const pa = lowestPrice(a, sortCurrency)
      const pb = lowestPrice(b, sortCurrency)
      if (pa === null && pb === null) return 0
      if (pa === null) return 1
      if (pb === null) return -1
      return (pa - pb) * dir
    })
  }
  // Featured (default): highlighted products first, otherwise preserve the
  // store's own order (Array.prototype.sort is stable). No-op when nothing
  // is flagged, see data/shopHighlights.ts.
  return [...products].sort(
    (a, b) => (getHighlightBadge(a) === null ? 1 : 0) - (getHighlightBadge(b) === null ? 1 : 0)
  )
}

/**
 * Keep only the products that matched a search, in search relevance order.
 * Products outside the active filter are not in `products`, so they drop out.
 */
export function orderBySearchHits(products: MedusaProduct[], hitIds: string[]): MedusaProduct[] {
  const byId = new Map(products.map((p) => [p.id, p]))
  const seen = new Set<string>()
  const out: MedusaProduct[] = []
  for (const id of hitIds) {
    const product = byId.get(id)
    if (product && !seen.has(id)) {
      seen.add(id)
      out.push(product)
    }
  }
  return out
}
