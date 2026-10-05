'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { CategoryFilterBar } from './CategoryFilterBar'
import { ProductCard } from './ProductCard'
import { ProductGridSkeleton } from './ProductGridSkeleton'
import { ShopHeroBanner } from './ShopHeroBanner'
import { ShopPagination } from './ShopPagination'
import { ShopFinalCTA } from './ShopFinalCTA'
import {
  catalogueCountNoun,
  orderBySearchHits,
  parseShopParams,
  shopStateToQuery,
  SELF_STUDY_COLLECTION,
  sortProducts,
  type SortOption,
} from './shopCatalogue'
import { isSelfStudyProduct } from './productKind'
import { useCart } from '@/lib/cart'
import type { MedusaProduct } from '@/types/medusa'
import type { SearchResultItem } from '@/lib/search/types'

interface MedusaCategory {
  id: string
  handle: string
  name: string
  parent_category_id: string | null
}

interface ProductsResponse {
  products: MedusaProduct[]
  count: number
}

interface FilterState {
  categoryId: string
  collectionHandle: string
}

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_URL ?? ''
const MEDUSA_PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''
const PAGE_SIZE = 12
// The catalogue is small (about 100 products), so the whole filtered list is
// loaded and then sorted and paged in the browser. Medusa's store API cannot
// order by price, and sorting one page at a time gave the wrong order.
const FETCH_BATCH = 100
// Upper bound the search API allows for a single index.
const SEARCH_LIMIT = 100

const medusaHeaders = { 'x-publishable-api-key': MEDUSA_PUB_KEY }

function getCategoryAndDescendantIds(
  categoryId: string,
  allCategories: MedusaCategory[]
): string[] {
  const children = allCategories.filter((c) => c.parent_category_id === categoryId)
  return [categoryId, ...children.flatMap((c) => getCategoryAndDescendantIds(c.id, allCategories))]
}

interface ShopCatalogueContentProps {
  initialCategories: MedusaCategory[]
  defaultCurrency?: string
}

export function ShopCatalogueContent({ initialCategories, defaultCurrency = 'zar' }: ShopCatalogueContentProps) {
  const searchParams = useSearchParams()
  const { cart } = useCart()
  // The currency the cards render prices in (ProductCard resolves it the same
  // way), so a price sort follows the amounts the visitor actually sees.
  const displayCurrency = cart?.currency_code ?? defaultCurrency

  // Shop state is kept in the URL (category, page, sort, search) so Back
  // returns to the same view and links such as /shop?category=books open
  // filtered. The URL is read once on mount; app/shop/page.tsx keys this
  // component on the query string so a navigation to new params remounts it.
  const [initial] = useState(() => {
    const parsed = parseShopParams(searchParams ?? new URLSearchParams())
    const category = parsed.categoryHandle
      ? initialCategories.find((c) => c.handle === parsed.categoryHandle)
      : undefined
    return {
      filters: { categoryId: category?.id ?? '', collectionHandle: parsed.collectionHandle },
      page: parsed.page,
      sort: parsed.sort,
      q: parsed.q,
    }
  })
  const [products, setProducts] = useState<MedusaProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(initial.page)
  const [sort, setSort] = useState<SortOption>(initial.sort)
  const [filters, setFilters] = useState<FilterState>(initial.filters)

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setPage(0)
  }

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort)
    setPage(0)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    document.getElementById('programmes')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const [searchQuery, setSearchQuery] = useState(initial.q)
  // Product ids matched by the search, in relevance order. null = not searching.
  const [searchIds, setSearchIds] = useState<string[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)

  const handleSearchChange = (q: string) => {
    setSearchQuery(q)
    setPage(0)
  }

  // Private sessions are sessions, not programmes. The count label must match
  // the active category (Suzanne feedback, 27 Jul 2026), including its
  // sub-categories such as ?category=akashic-coaching, and must not call a
  // book a programme (site check C3).
  const activeCategoryHandle = filters.categoryId
    ? initialCategories.find((c) => c.id === filters.categoryId)?.handle
    : undefined
  const activeRootHandle = (() => {
    let current = initialCategories.find((c) => c.id === filters.categoryId)
    const seen = new Set<string>()
    while (current?.parent_category_id && !seen.has(current.id)) {
      seen.add(current.id)
      const parentId: string = current.parent_category_id
      current = initialCategories.find((c) => c.id === parentId)
    }
    return current?.handle
  })()
  const countNoun = catalogueCountNoun(activeRootHandle, filters.collectionHandle)

  // Write state to the URL without adding history entries or a server round trip.
  useEffect(() => {
    const query = shopStateToQuery({
      categoryHandle: activeCategoryHandle ?? '',
      collectionHandle: filters.collectionHandle,
      page,
      sort,
      q: searchQuery,
    })
    const current = window.location.search.replace(/^\?/, '')
    if (current !== query) {
      window.history.replaceState(null, '',`${window.location.pathname}${query ? `?${query}` : ''}`)
    }
  }, [activeCategoryHandle, filters.collectionHandle, page, sort, searchQuery])

  const fetchSeq = useRef(0)
  const fetchProducts = useCallback(async () => {
    const seq = ++fetchSeq.current
    setLoading(true)
    setError(false)

    try {
      const baseParams = new URLSearchParams({
        limit: String(FETCH_BATCH),
        fields:
          'id,handle,title,description,thumbnail,metadata,*variants,*variants.prices,+variants.inventory_quantity,*categories,*collection',
      })

      if (filters.categoryId) {
        const ids = getCategoryAndDescendantIds(filters.categoryId, initialCategories)
        ids.forEach((id) => baseParams.append('category_id[]', id))
      }

      const all: MedusaProduct[] = []
      let total = Infinity
      while (all.length < total) {
        const params = new URLSearchParams(baseParams)
        params.set('offset', String(all.length))
        const res = await fetch(`${MEDUSA_URL}/store/products?${params.toString()}`, {
          headers: medusaHeaders,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = (await res.json()) as ProductsResponse
        all.push(...data.products)
        total = data.count
        if (data.products.length === 0) break
      }

      if (seq !== fetchSeq.current) return
      // The Self-Study pill used to list the "programmes" collection, which
      // also holds about 20 live courses. It now lists what is actually sold
      // as self-study, from any collection (site check C3, productKind.ts).
      setProducts(
        filters.collectionHandle === SELF_STUDY_COLLECTION ? all.filter(isSelfStudyProduct) : all
      )
    } catch {
      if (seq === fetchSeq.current) setError(true)
    } finally {
      if (seq === fetchSeq.current) setLoading(false)
    }
  }, [filters, initialCategories])

  useEffect(() => {
    void fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) {
      setSearchIds(null)
      setSearchLoading(false)
      return
    }

    let cancelled = false
    setSearchLoading(true)
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}&index=products&limit=${SEARCH_LIMIT}`)
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((data: { results?: SearchResultItem[] }) => {
          if (!cancelled) setSearchIds((data.results ?? []).map((r) => r.id))
        })
        .catch(() => {
          if (!cancelled) setSearchIds([])
        })
        .finally(() => {
          if (!cancelled) setSearchLoading(false)
        })
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchQuery])

  const isSearching = searchQuery.trim() !== ''

  // Search results are limited to the products in the active filter, and keep
  // relevance order unless a price sort is chosen.
  const visibleProducts = useMemo(() => {
    if (isSearching) {
      const matched = orderBySearchHits(products, searchIds ?? [])
      return sort === 'featured' ? matched : sortProducts(matched, sort, displayCurrency)
    }
    return sortProducts(products, sort, displayCurrency)
  }, [isSearching, products, searchIds, sort, displayCurrency])

  const totalCount = visibleProducts.length
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const currentPage = Math.min(page, Math.max(totalPages - 1, 0))
  const pageProducts = visibleProducts.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
  const busy = loading || (isSearching && (searchLoading || searchIds === null))

  return (
    <main className="min-h-screen">
      {/* 1: Video-backed header (PageHeader) and black stats band */}
      <ShopHeroBanner />

      {/* 2: Light sticky filter bar (cream) */}
      <CategoryFilterBar
        categories={initialCategories}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* 3: Light product grid (sand so white cards read as cards) */}
      <section id="programmes" className="w-full bg-brand-sand scroll-mt-48">
        {/* Search + sort toolbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search programmes…"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-brand-cream border border-brand-border text-brand-ink text-sm rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:border-brand-accent transition-colors duration-200 placeholder-brand-muted"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-ink transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <p className="text-sm text-brand-muted whitespace-nowrap">
              {isSearching && searchLoading
                ? 'Searching…'
                : busy
                ? 'Loading…'
                : isSearching
                ? `${totalCount} result${totalCount !== 1 ? 's' : ''}`
                : `${totalCount} ${countNoun}${totalCount !== 1 ? 's' : ''}`}
            </p>
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              aria-label="Sort programmes"
              className="bg-brand-cream border border-brand-border text-brand-ink text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-accent transition-colors duration-200"
            >
              <option value="featured">{isSearching ? 'Best match' : 'Featured'}</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Grid area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {busy && (
            <div role="status" aria-label={isSearching ? 'Searching' : 'Loading programmes'}>
              <ProductGridSkeleton />
            </div>
          )}

          {!busy && error && (
            <div className="flex flex-col items-center gap-6 py-24 text-center">
              <p className="text-brand-muted text-lg">Unable to load programmes. Please try again.</p>
              <button
                onClick={() => void fetchProducts()}
                className="px-6 py-3 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-medium rounded-button transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          )}

          {!busy && !error && pageProducts.length === 0 && (
            isSearching ? (
              <EmptyState
                message={`No programmes match "${searchQuery}".`}
                action={{ label: 'Clear search', onClick: () => handleSearchChange('') }}
              />
            ) : (
              <EmptyState
                message="No programmes match your selection."
                action={{ label: 'Clear filters', onClick: () => handleFiltersChange({ categoryId: '', collectionHandle: '' }) }}
              />
            )
          )}

          {!busy && !error && pageProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} allCategories={initialCategories} defaultCurrency={defaultCurrency} />
              ))}
            </div>
          )}

          {!busy && !error && totalPages > 1 && (
            <ShopPagination page={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </div>
      </section>

      {/* 4: Photo-backed final CTA (dark, allowed as CTA band) */}
      <ShopFinalCTA />
    </main>
  )
}

interface EmptyStateProps {
  message: string
  action: { label: string; onClick: () => void }
}

function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-4 py-24 text-center"
    >
      <p className="text-brand-muted text-lg">{message}</p>
      <button
        onClick={action.onClick}
        className="px-5 py-2.5 border border-brand-border hover:border-brand-accent text-brand-muted hover:text-brand-accent rounded-lg text-sm transition-all duration-200"
      >
        {action.label}
      </button>
    </motion.div>
  )
}
