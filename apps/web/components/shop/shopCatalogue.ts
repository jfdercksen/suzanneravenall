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

/**
 * Display names for the top-level shop categories where the shop's wording
 * differs from the store's category name. The filter pills and the card
 * eyebrows both use this, so a card under "Practitioner Programmes" does not
 * say "Guided Programmes" (site check C3).
 */
const CATEGORY_LABELS: Record<string, string> = {
  'private-sessions': 'Private Sessions',
  'guided-programmes': 'Practitioner Programmes',
  'group-sessions': 'Group Sessions',
  'products-tools': 'Products & Tools',
}

export function shopCategoryLabel(category: { handle: string; name: string }): string {
  return CATEGORY_LABELS[category.handle] ?? category.name
}

/**
 * The noun in the "<n> sessions" count, matched to what is listed: the active
 * top-level category, the Self-Study filter, or the whole mixed catalogue.
 */
export function catalogueCountNoun(rootCategoryHandle: string | undefined, collectionHandle: string): string {
  if (collectionHandle === SELF_STUDY_COLLECTION) return 'course'
  switch (rootCategoryHandle) {
    case 'private-sessions':
    case 'group-sessions':
      return 'session'
    case 'guided-programmes':
      return 'programme'
    case 'products-tools':
      return 'product'
    default:
      return 'item'
  }
}

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
  return lowestPriceIn(variants.flatMap((v) => v.prices), currency)
}

function lowestPriceIn(prices: ProductVariant['prices'], currency: string): number | null {
  const code = currency.toLowerCase()
  const amounts = prices.filter((p) => p.currency_code.toLowerCase() === code).map((p) => p.amount)
  return amounts.length > 0 ? Math.min(...amounts) : null
}

/**
 * The "from" price a product card shows: the lowest price in the visitor's
 * currency, or null ("Price on request"). Never another currency's price and
 * never a converted one (D021): a USD visitor sees dollars or nothing.
 * ProductCard and the price sort both use this, so the sort follows what is
 * on screen.
 */
export function getDisplayPrice(variants: ProductVariant[], currency: string): DisplayPrice | null {
  const inCurrency = lowestIn(variants, currency)
  return inCurrency !== null ? { amount: inCurrency, currency_code: currency.toLowerCase() } : null
}

/**
 * The same rule for a plain price list (one variant's prices, a homepage
 * card): the lowest price in the visitor's currency, or null.
 */
export function getPriceIn(prices: ProductVariant['prices'] | null | undefined, currency: string): DisplayPrice | null {
  const amount = prices ? lowestPriceIn(prices, currency) : null
  return amount !== null ? { amount, currency_code: currency.toLowerCase() } : null
}

/**
 * A display price as text: "$20", "$17.50", "R1 500". Whole amounts without
 * cents, other amounts with them, so $17.50 is never rounded to $18.
 */
export function formatDisplayPrice(price: DisplayPrice): string {
  const amount = price.amount / 100
  const digits = Number.isInteger(amount) ? 0 : 2
  const opts = { minimumFractionDigits: digits, maximumFractionDigits: digits }
  if (price.currency_code === 'usd') return `$${amount.toLocaleString('en-US', opts)}`
  return `R${amount.toLocaleString('en-ZA', opts)}`
}

/** Sort key for the price the card actually displays, in that currency's cents. */
export function displayPriceSortKey(product: MedusaProduct, currency: string): number | null {
  return getDisplayPrice(product.variants, currency)?.amount ?? null
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
