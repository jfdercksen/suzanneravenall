'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { CategoryFilterBar } from './CategoryFilterBar'
import { ProductCard } from './ProductCard'
import { ProductGridSkeleton } from './ProductGridSkeleton'
import type { ProductSearchHit } from '@/lib/search/types'

interface MedusaProduct {
  id: string
  handle: string
  title: string
  description: string | null
  thumbnail: string | null
  variants: Array<{
    id: string
    title: string
    prices: Array<{ currency_code: string; amount: number }>
  }>
  categories: Array<{ id: string; handle: string; name: string }>
  collection: { id: string; handle: string; title: string } | null
}

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
        params.append('category_id[]', filters.categoryId)
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
  }, [page, filters, collectionIdMap])

  useEffect(() => {
    void fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    setPage(0)
  }, [filters])

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
    <main className="min-h-screen bg-gray-950">
      <HeroBanner />

      <CategoryFilterBar
        categories={initialCategories}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <div className="w-full bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search programmes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-white/10 text-white text-sm rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:border-brand-accent transition-colors duration-200 placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-400 whitespace-nowrap">
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
                className="bg-gray-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-accent transition-colors duration-200"
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            )}
          </div>
        </div>
      </div>

      <section id="programmes" className="w-full bg-gray-950 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Search results mode */}
          {searchResults !== null && (
            <>
              {searchLoading && (
                <div role="status" aria-label="Searching"><ProductGridSkeleton /></div>
              )}
              {!searchLoading && searchResults.length === 0 && (
                <div className="flex flex-col items-center gap-4 py-24 text-center">
                  <p className="text-white/60 text-lg">No programmes match &ldquo;{searchQuery}&rdquo;.</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-5 py-2.5 border border-white/20 hover:border-brand-accent text-white/70 hover:text-brand-accent rounded-lg text-sm transition-all duration-200"
                  >
                    Clear search
                  </button>
                </div>
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
              {loading ? (
                <div role="status" aria-label="Loading programmes">
                  <ProductGridSkeleton />
                </div>
              ) : null}

              {!loading && error && (
                <div className="flex flex-col items-center gap-6 py-24 text-center">
                  <p className="text-white/60 text-lg">
                    Unable to load programmes — please try again.
                  </p>
                  <button
                    onClick={() => void fetchProducts()}
                    className="px-6 py-3 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && sortedProducts.length === 0 && (
                <div className="flex flex-col items-center gap-4 py-24 text-center">
                  <p className="text-white/60 text-lg">No programmes match your selection.</p>
                  <button
                    onClick={() => setFilters({ categoryId: '', collectionHandle: '' })}
                    className="px-5 py-2.5 border border-white/20 hover:border-brand-accent text-white/70 hover:text-brand-accent rounded-lg text-sm transition-all duration-200"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {!loading && !error && sortedProducts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              )}

              {!loading && !error && totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}

function HeroBanner() {
  return (
    <section className="w-full bg-brand-primary min-h-[60vh] flex items-center py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
          >
            Transform Your Life
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl lg:text-6xl font-light text-white mb-6 leading-tight"
          >
            Invest in Your
            <br />
            <span className="text-brand-accent">Transformation</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg lg:text-xl text-white/70 leading-relaxed mb-10"
          >
            Private sessions, guided programmes, and group coaching designed to create lasting change.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button
              onClick={() =>
                document.getElementById('programmes')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Explore All Programmes
            </button>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 border border-white/40 hover:border-white text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Book a Discovery Call
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i)

  const visiblePages = pages.filter(
    (p) => p === 0 || p === totalPages - 1 || Math.abs(p - page) <= 1
  )

  return (
    <div className="flex items-center justify-center gap-2 mt-16">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {visiblePages.map((p, i) => {
        const prev = visiblePages[i - 1]
        const showEllipsis = prev !== undefined && p - prev > 1

        return (
          <span key={p} className="flex items-center gap-2">
            {showEllipsis && (
              <span className="text-white/30 px-1 select-none">…</span>
            )}
            <button
              onClick={() => onPageChange(p)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                p === page
                  ? 'bg-brand-accent-600 text-white'
                  : 'border border-white/10 text-white/60 hover:text-white hover:border-white/30'
              }`}
            >
              {p + 1}
            </button>
          </span>
        )
      })}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages - 1}
        className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        aria-label="Next page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
