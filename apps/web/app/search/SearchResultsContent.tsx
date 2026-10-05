'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import type { SearchResultItem, SearchIndex } from '@/lib/search/types'
import { resultBadge } from '@/lib/search/utils'

type TabFilter = 'all' | SearchIndex

const TABS: { id: TabFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'products', label: 'Programmes' },
  { id: 'explore_topics', label: 'Topics' },
  { id: 'pages', label: 'Pages' },
]

const PAGE_SIZE = 20

function formatPrice(cents: number): string {
  return `R${new Intl.NumberFormat('en-ZA').format(cents / 100)}`
}

interface SearchResultsContentProps {
  initialQuery: string
}

export function SearchResultsContent({ initialQuery }: SearchResultsContentProps) {
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  // The page has its own search box (site check M16): `input` is what is typed,
  // `query` is what the results show, updated after a short pause or on submit.
  const [input, setInput] = useState(initialQuery)
  const [query, setQuery] = useState(initialQuery)
  // Ignores a slow response that lands after a newer search has started.
  const requestId = useRef(0)

  // A new ?q= (e.g. a search from the header while already on /search) resets both.
  useEffect(() => {
    setInput(initialQuery)
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    if (input.trim() === query.trim()) return
    const id = setTimeout(() => setQuery(input), 400)
    return () => clearTimeout(id)
  }, [input, query])

  // Keep the address bar in step so the results can be shared or reloaded.
  // history.replaceState (synced by the Next router) avoids a server round trip.
  useEffect(() => {
    const q = query.trim()
    const url = q ? `/search?q=${encodeURIComponent(q)}` : '/search'
    if (window.location.pathname + window.location.search !== url) {
      window.history.replaceState(window.history.state, '', url)
    }
  }, [query])

  const fetchResults = useCallback(async () => {
    if (!query.trim()) {
      requestId.current++
      setResults([])
      setLoading(false)
      return
    }

    const id = ++requestId.current
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: query.trim(),
        limit: String(PAGE_SIZE),
        ...(activeTab !== 'all' ? { index: activeTab } : {}),
      })

      const res = await fetch(`/api/search?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { results: SearchResultItem[] }
      if (id === requestId.current) setResults(data.results)
    } catch {
      if (id === requestId.current) setResults([])
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [query, activeTab])

  useEffect(() => {
    void fetchResults()
  }, [fetchResults])

  return (
    <main className="relative min-h-screen bg-brand-sand py-16 overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
            Search Results
          </p>
          <h1 className="text-3xl lg:text-4xl font-medium tracking-tight text-brand-primary">
            {query.trim() ? (
              <>Results for &ldquo;<span className="text-brand-accent">{query.trim()}</span>&rdquo;</>
            ) : (
              'What are you looking for?'
            )}
          </h1>
          {!loading && query.trim() && results.length > 0 && (
            <p className="text-brand-muted mt-2 text-sm">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
          )}
        </motion.div>

        {/* Search box */}
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            setQuery(input)
          }}
          className="mb-6"
        >
          <label htmlFor="search-page-input" className="sr-only">
            Search the site
          </label>
          <div className="flex items-center gap-3 px-4 py-3 rounded-card bg-white border border-brand-border focus-within:border-brand-accent">
            <Search aria-hidden="true" className="w-5 h-5 text-brand-muted flex-shrink-0" />
            <input
              id="search-page-input"
              type="search"
              placeholder="Search programmes, topics, pages…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent text-brand-ink placeholder-brand-muted outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              className="text-sm font-medium text-brand-accent hover:underline underline-offset-4"
            >
              Search
            </button>
          </div>
        </form>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex gap-1 mb-8 border-b border-brand-border"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-brand-primary border-brand-accent'
                  : 'text-brand-muted border-transparent hover:text-brand-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-card bg-white border border-brand-border animate-pulse">
                <div className="w-16 h-16 rounded bg-brand-border flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-brand-border rounded w-3/4" />
                  <div className="h-3 bg-brand-border rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty — no query */}
        {!loading && !query.trim() && (
          <div className="text-center py-20">
            <Search aria-hidden="true" className="w-12 h-12 text-brand-primary-300 mx-auto mb-4" />
            <p className="text-brand-muted">Enter a search term to find programmes, topics and pages.</p>
          </div>
        )}

        {/* Empty — no results */}
        {!loading && query.trim() && results.length === 0 && (
          <div className="text-center py-20">
            <Search aria-hidden="true" className="w-12 h-12 text-brand-primary-300 mx-auto mb-4" />
            <p className="text-brand-ink text-lg mb-2">No results found</p>
            <p className="text-brand-muted text-sm">
              Try different keywords, or{' '}
              <Link href="/shop" className="text-brand-accent hover:underline">
                browse all programmes
              </Link>
              .
            </p>
          </div>
        )}

        {/* Results list */}
        {!loading && results.length > 0 && (
          <motion.ul
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
            className="space-y-3"
          >
            {results.map((item) => (
              <motion.li
                key={`${item.type}-${item.id}`}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
                }}
              >
                <Link
                  href={item.url}
                  className="flex items-start gap-4 p-4 rounded-card bg-white border border-brand-border hover:shadow-lg transition-all duration-200 group"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 flex-shrink-0 rounded bg-brand-sand overflow-hidden">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt=""
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Search aria-hidden="true" className="w-5 h-5 text-brand-primary-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p
                          className="font-medium text-brand-primary group-hover:underline underline-offset-4 transition-colors duration-150 [&_mark]:bg-brand-accent/15 [&_mark]:text-brand-primary [&_mark]:rounded-sm"
                          dangerouslySetInnerHTML={{ __html: item.title }}
                        />
                        <p
                          className="text-sm text-brand-muted mt-1 line-clamp-2 [&_mark]:bg-brand-accent/10 [&_mark]:text-brand-ink [&_mark]:rounded-sm"
                          dangerouslySetInnerHTML={{ __html: item.subtitle }}
                        />
                      </div>

                      <div className="flex-shrink-0 text-right">
                        {item.price_zar !== null ? (
                          <span className="text-sm font-semibold text-brand-primary">
                            {formatPrice(item.price_zar)}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-brand-sand text-brand-ink border border-brand-border rounded-full">
                            {resultBadge(item)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </main>
  )
}
