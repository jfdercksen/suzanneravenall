'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, X, ArrowRight } from 'lucide-react'
import type { SearchResultItem } from '@/lib/search/types'

function formatPrice(cents: number): string {
  return `R${new Intl.NumberFormat('en-ZA').format(cents / 100)}`
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function SearchBar() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  const openModal = useCallback(() => {
    setOpen(true)
    setQuery('')
    setResults([])
    setActiveIndex(-1)
  }, [])

  const closeModal = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults([])
    setActiveIndex(-1)
  }, [])

  // CMD+K / Ctrl+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) closeModal()
        else openModal()
      }
      if (e.key === 'Escape' && open) closeModal()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, openModal, closeModal])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(id)
    }
  }, [open])

  // Fetch results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setActiveIndex(-1)
      return
    }

    let cancelled = false
    setLoading(true)

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=8`)
      .then((r) => (r.ok ? r.json() : { results: [] }))
      .then((data: { results?: SearchResultItem[] }) => {
        if (!cancelled) {
          setResults(data.results ?? [])
          setActiveIndex(-1)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      const item = results[activeIndex]
      if (item) {
        router.push(item.url)
        closeModal()
      }
    }
  }

  if (!open) {
    return (
      <button
        onClick={openModal}
        aria-label="Open search (Ctrl+K)"
        className="flex items-center gap-1.5 px-3 py-2 text-white/70 hover:text-white rounded-md transition-colors duration-150"
      >
        <Search className="w-4 h-4" />
        <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-white/10 rounded border border-white/20">
          ⌘K
        </kbd>
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
        onClick={closeModal}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="fixed inset-x-4 top-[10vh] z-[201] mx-auto max-w-xl rounded-xl bg-gray-900 shadow-2xl ring-1 ring-white/10 overflow-hidden"
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search programmes, topics…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
              aria-label="Clear search"
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results */}
        {loading && (
          <div className="px-4 py-6 text-center text-sm text-gray-500">Searching…</div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            No results for &ldquo;{query}&rdquo;
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <ul ref={listRef} className="max-h-80 overflow-y-auto py-2">
              {results.map((item, i) => (
                <li key={`${item.type}-${item.id}`}>
                  <Link
                    href={item.url}
                    onClick={closeModal}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors duration-100 ${
                      i === activeIndex ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Thumbnail or placeholder */}
                    <div className="w-10 h-10 flex-shrink-0 rounded bg-gray-800 overflow-hidden">
                      {item.thumbnail ? (
                        <Image
                          src={item.thumbnail}
                          alt=""
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Search className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium text-white truncate [&_mark]:bg-brand-accent/30 [&_mark]:text-white [&_mark]:rounded-sm"
                        dangerouslySetInnerHTML={{ __html: item.title }}
                      />
                      <p className="text-xs text-gray-400 truncate mt-0.5 line-clamp-1">
                        {item.subtitle}
                      </p>
                    </div>

                    {/* Price or badge */}
                    <div className="flex-shrink-0 text-right">
                      {item.price_zar !== null ? (
                        <span className="text-sm font-medium text-white">
                          {formatPrice(item.price_zar)}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-brand-accent/20 text-brand-accent-400 rounded-full">
                          Topic
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* View all results footer */}
            <div className="border-t border-white/10 px-4 py-2">
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={closeModal}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors py-1"
              >
                View all results for &ldquo;{query}&rdquo;
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </>
        )}

        {/* Footer hint */}
        {!query && (
          <div className="px-4 py-3 text-xs text-gray-600 flex items-center gap-4">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
        )}
      </div>
    </>
  )
}
