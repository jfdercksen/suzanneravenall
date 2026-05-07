'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search } from 'lucide-react'
import type { SearchResultItem, SearchIndex } from '@/lib/search/types'

type TabFilter = 'all' | SearchIndex

const TABS: { id: TabFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'products', label: 'Programmes' },
  { id: 'explore_topics', label: 'Topics' },
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

  const fetchResults = useCallback(async () => {
    if (!initialQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: initialQuery,
        limit: String(PAGE_SIZE),
        ...(activeTab !== 'all' ? { index: activeTab } : {}),
      })

      const res = await fetch(`/api/search?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { results: SearchResultItem[] }
      setResults(data.results)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [initialQuery, activeTab])

  useEffect(() => {
    void fetchResults()
  }, [fetchResults])

  useEffect(() => {
    setResults([])
  }, [activeTab])

  return (
    <div className="min-h-screen bg-gray-950 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
            Search Results
          </p>
          <h1 className="text-3xl lg:text-4xl font-light text-white">
            {initialQuery ? (
              <>Results for &ldquo;<span className="text-brand-accent">{initialQuery}</span>&rdquo;</>
            ) : (
              'What are you looking for?'
            )}
          </h1>
          {!loading && initialQuery && results.length > 0 && (
            <p className="text-gray-400 mt-2 text-sm">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-white border-brand-accent'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-lg bg-gray-900 animate-pulse">
                <div className="w-16 h-16 rounded bg-gray-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !initialQuery && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400">Enter a search term to find programmes and topics.</p>
          </div>
        )}

        {!loading && initialQuery && results.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-300 text-lg mb-2">No results found</p>
            <p className="text-gray-500 text-sm">
              Try different keywords, or{' '}
              <Link href="/shop" className="text-brand-accent hover:underline">
                browse all programmes
              </Link>
              .
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <ul className="space-y-3">
            {results.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <Link
                  href={item.url}
                  className="flex items-start gap-4 p-4 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors duration-200 group"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 flex-shrink-0 rounded bg-gray-800 overflow-hidden">
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
                        <Search className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p
                          className="font-medium text-white group-hover:text-brand-accent transition-colors duration-150 [&_mark]:bg-brand-accent/30 [&_mark]:text-white [&_mark]:rounded-sm"
                          dangerouslySetInnerHTML={{ __html: item.title }}
                        />
                        <p
                          className="text-sm text-gray-400 mt-1 line-clamp-2 [&_mark]:bg-brand-accent/20 [&_mark]:text-gray-300 [&_mark]:rounded-sm"
                          dangerouslySetInnerHTML={{ __html: item.subtitle }}
                        />
                      </div>

                      <div className="flex-shrink-0 text-right">
                        {item.price_zar !== null ? (
                          <span className="text-sm font-semibold text-white">
                            {formatPrice(item.price_zar)}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-brand-accent/20 text-brand-accent rounded-full">
                            Topic
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
