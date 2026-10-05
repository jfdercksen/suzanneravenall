import { getHighlightBadge } from '@/data/shopHighlights'
import type { MedusaProduct, ProductVariant } from '@/types/medusa'

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

export interface DisplayPrice {
  /** Minor units (cents), as Medusa stores it. */
  amount: number
  currency_code: string
}

function lowestIn(variants: ProductVariant[], currency: string): number | null {
  const amounts = variants
    .flatMap((v) => v.prices)
    .filter((p) => p.currency_code === currency)
    .map((p) => p.amount)
  return amounts.length > 0 ? Math.min(...amounts) : null
}

/**
 * The "from" price a product card shows: the lowest price in the visitor's
 * currency, falling back to the lowest ZAR price. ProductCard and the price
 * sort both use this, so the sort follows what is on screen.
 */
export function getDisplayPrice(variants: ProductVariant[], currency: string): DisplayPrice | null {
  const inCurrency = lowestIn(variants, currency)
  if (inCurrency !== null) return { amount: inCurrency, currency_code: currency }
  const inZar = lowestIn(variants, 'zar')
  if (inZar !== null) return { amount: inZar, currency_code: 'zar' }
  return null
}

/**
 * Fixed, indicative rand-per-dollar rate used only to order a mixed list of
 * dollar and rand cards. It is never shown and never used to charge anyone.
 */
export const INDICATIVE_ZAR_PER_USD = 18

/**
 * Sort key in ZAR cents for the price the card actually displays.
 *
 * Rule for mixed currencies: a visitor outside South Africa sees dollars on
 * products that have a USD price and rands on the rest. Each displayed
 * amount is converted to ZAR and the list is sorted on that.
 * - Rand amounts are used as they are.
 * - Dollar amounts are converted with one fixed rate (INDICATIVE_ZAR_PER_USD),
 *   not with the product's own ZAR price. The store's ZAR/USD ratios range
 *   from about 4.5 to 47 per product, so a per-product conversion is the same
 *   as sorting by the hidden ZAR price and makes the visible dollar amounts
 *   jump up and down. A single rate keeps the order monotonic within each
 *   currency and slots rand-only cards in at a sensible point.
 * - Any other currency (none are configured today) uses the product's own
 *   ZAR price when it has one.
 */
export function displayPriceSortKey(product: MedusaProduct, currency: string): number | null {
  const shown = getDisplayPrice(product.variants, currency)
  if (!shown) return null
  if (shown.currency_code === 'zar') return shown.amount
  if (shown.currency_code === 'usd') return shown.amount * INDICATIVE_ZAR_PER_USD
  return lowestIn(product.variants, 'zar') ?? shown.amount
}

/**
 * Sort by the price shown on each card (see displayPriceSortKey). `currency`
 * must be the same currency the cards are rendered with. Unpriced products go
 * last in both directions; ties keep the store's order.
 */
export function sortProducts(products: MedusaProduct[], sort: SortOption, currency: string): MedusaProduct[] {
  if (sort === 'price_asc' || sort === 'price_desc') {
    const dir = sort === 'price_asc' ? 1 : -1
    const keys = new Map(products.map((p) => [p.id, displayPriceSortKey(p, currency)]))
    return [...products].sort((a, b) => {
      const pa = keys.get(a.id) ?? null
      const pb = keys.get(b.id) ?? null
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
