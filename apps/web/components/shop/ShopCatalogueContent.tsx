'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { CategoryFilterBar } from './CategoryFilterBar'
import { ProductCard } from './ProductCard'
import { ProductGridSkeleton } from './ProductGridSkeleton'
import { ShopHeroBanner } from './ShopHeroBanner'
import { ShopPagination } from './ShopPagination'
import { ShopFinalCTA } from './ShopFinalCTA'
import type { MedusaProduct } from '@/types/medusa'
import type { ProductSearchHit } from '@/lib/search/types'

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

type SortOption = 'featured' | 'price_asc' | 'price_desc'

interface FilterState {
  categoryId: string
  collectionHandle: string
}

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_URL ?? ''
const MEDUSA_PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''
const PAGE_SIZE = 12

const medusaHeaders = { 'x-publishable-api-key': MEDUSA_PUB_KEY }

function getLowestZarPrice(product: MedusaProduct): number {
  const prices = product.variants
    .flatMap((v) => v.prices)
    .filter((p) => p.currency_code === 'zar')
    .map((p) => p.amount)

  return prices.length > 0 ? Math.min(...prices) : Infinity
}

function sortProducts(products: MedusaProduct[], sort: SortOption): MedusaProduct[] {
  if (sort === 'price_asc') {
    return [...products].sort((a, b) => getLowestZarPrice(a) - getLowestZarPrice(b))
  }
  if (sort === 'price_desc') {
    return [...products].sort((a, b) => getLowestZarPrice(b) - getLowestZarPrice(a))
  }
  return products
}

function getCategoryAndDescendantIds(
  categoryId: string,
  allCategories: MedusaCategory[]
): string[] {
  const children = allCategories.filter((c) => c.parent_category_id === categoryId)
  return [categoryId, ...children.flatMap((c) => getCategoryAndDescendantIds(c.id, allCategories))]
}

function searchHitToProduct(hit: ProductSearchHit): MedusaProduct {
  return {
    id: hit.id,
    handle: hit.handle,
    title: hit.title,
    description: hit.description,
    thumbnail: hit.thumbnail,
    variants:
      hit.price_zar !== null
        ? [{ id: `${hit.id}-default`, title: 'Default', prices: [{ currency_code: 'zar', amount: hit.price_zar }] }]
        : [],
    categories: [],
    collection: hit.collection_handle
      ? { id: '', handle: hit.collection_handle, title: hit.collection_title ?? '' }
      : null,
  }
}

interface ShopCatalogueContentProps {
  initialCategories: MedusaCategory[]
}

export function ShopCatalogueContent({ initialCategories }: ShopCatalogueContentProps) {
  const [products, setProducts] = useState<MedusaProduct[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<SortOption>('featured')
  const [filters, setFilters] = useState<FilterState>({ categoryId: '', collectionHandle: '' })
  const [collectionIdMap, setCollectionIdMap] = useState<Record<string, string>>({})

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setPage(0)
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MedusaProduct[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch(`${MEDUSA_URL}/store/collections?limit=20`, { headers: medusaHeaders })
      .then((r) => (r.ok ? r.json() : { collections: [] }))
      .then((data: { collections?: Array<{ id: string; handle: string }> }) => {
        const map: Record<string, string> = {}
        ;(data.collections ?? []).forEach((c) => { map[c.handle] = c.id })
        setCollectionIdMap(map)
      })
      .catch(() => {})
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(false)

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
        fields: 'id,handle,title,description,thumbnail,*variants,*variants.prices,*categories,*collection',
      })

      if (filters.categoryId) {
        const ids = getCategoryAndDescendantIds(filters.categoryId, initialCategories)
        ids.forEach((id) => params.append('category_id[]', id))
      }

      const collectionId = filters.collectionHandle ? collectionIdMap[filters.collectionHandle] : undefined
      if (collectionId) {
        params.append('collection_id[]', collectionId)
      }

      const res = await fetch(`${MEDUSA_URL}/store/products?${params.toString()}`, {
        headers: medusaHeaders,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = (await res.json()) as ProductsResponse
      setProducts(data.products)
      setTotalCount(data.count)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [page, filters, collectionIdMap, initialCategories])

  useEffect(() => {
    void fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)

    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }

    searchDebounceRef.current = setTimeout(() => {
      setSearchLoading(true)
      fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&index=products&limit=24`)
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((data: { results?: ProductSearchHit[] }) => {
          setSearchResults((data.results ?? []).map(searchHitToProduct))
          setSearchLoading(false)
        })
        .catch(() => setSearchLoading(false))
    }, 300)

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [searchQuery])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const sortedProducts = useMemo(() => sortProducts(products, sort), [products, sort])

  return (
    <main className="min-h-screen">
      {/* 1 — Dark hero */}
      <ShopHeroBanner />

      {/* 2 — Dark sticky filter bar */}
      <CategoryFilterBar
        categories={initialCategories}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* 3 — Light product grid */}
      <section id="programmes" className="w-full bg-white scroll-mt-48">
        {/* Search + sort toolbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search programmes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:border-brand-accent transition-colors duration-200 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500 whitespace-nowrap">
              {searchLoading
                ? 'Searching…'
                : searchResults !== null
                ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`
                : loading
                ? 'Loading…'
                : `${totalCount} programme${totalCount !== 1 ? 's' : ''}`}
            </p>
            {searchResults === null && (
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-accent transition-colors duration-200"
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            )}
          </div>
        </div>

        {/* Grid area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {/* Search results mode */}
          {searchResults !== null && (
            <>
              {searchLoading && (
                <div role="status" aria-label="Searching"><ProductGridSkeleton /></div>
              )}
              {!searchLoading && searchResults.length === 0 && (
                <EmptyState
                  message={`No programmes match "${searchQuery}".`}
                  action={{ label: 'Clear search', onClick: () => setSearchQuery('') }}
                />
              )}
              {!searchLoading && searchResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Normal browse mode */}
          {searchResults === null && (
            <>
              {loading && (
                <div role="status" aria-label="Loading programmes">
                  <ProductGridSkeleton />
                </div>
              )}

              {!loading && error && (
                <div className="flex flex-col items-center gap-6 py-24 text-center">
                  <p className="text-gray-500 text-lg">Unable to load programmes — please try again.</p>
                  <button
                    onClick={() => void fetchProducts()}
                    className="px-6 py-3 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-medium rounded-button transition-colors duration-200"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && sortedProducts.length === 0 && (
                <EmptyState
                  message="No programmes match your selection."
                  action={{ label: 'Clear filters', onClick: () => handleFiltersChange({ categoryId: '', collectionHandle: '' }) }}
                />
              )}

              {!loading && !error && sortedProducts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              )}

              {!loading && !error && totalPages > 1 && (
                <ShopPagination page={page} totalPages={totalPages} onPageChange={setPage} />
              )}
            </>
          )}
        </div>
      </section>

      {/* 4 — Dark final CTA */}
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
      <p className="text-gray-500 text-lg">{message}</p>
      <button
        onClick={action.onClick}
        className="px-5 py-2.5 border border-gray-200 hover:border-brand-accent text-gray-500 hover:text-brand-accent rounded-lg text-sm transition-all duration-200"
      >
        {action.label}
      </button>
    </motion.div>
  )
}
