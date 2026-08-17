import { NextRequest, NextResponse } from 'next/server'
import type {
  MeiliSearchHitsResponse,
  ProductSearchHit,
  TopicSearchHit,
  SearchResultItem,
  SearchIndex,
} from '@/lib/search/types'
import { logError } from '@/lib/log'
import { sanitizeHighlight } from '@/lib/search/utils'

const MEILI_HOST = process.env.MEILISEARCH_HOST ?? 'http://meilisearch:7700'
const MEILI_KEY = process.env.MEILISEARCH_ADMIN_KEY ?? ''

// Simple in-memory rate limiter: 20 requests per IP per 60-second window.
// Suitable for single-instance Docker deployment — use Redis for multi-instance.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }

  if (entry.count >= 20) return true
  entry.count++
  return false
}

// Prune stale entries every 5 minutes to prevent unbounded memory growth.
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip)
  }
}, 300_000)

async function searchIndex<T>(
  index: string,
  q: string,
  limit: number,
  attributesToHighlight: string[]
): Promise<T[]> {
  const res = await fetch(`${MEILI_HOST}/indexes/${index}/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MEILI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q,
      limit,
      attributesToHighlight,
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`MeiliSearch ${index} error ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as MeiliSearchHitsResponse<T>
  return data.hits
}

function productToResult(hit: ProductSearchHit): SearchResultItem {
  return {
    type: 'products',
    id: hit.id,
    title: sanitizeHighlight(hit._formatted?.title ?? hit.title),
    subtitle: hit.collection_title ?? hit.category_names[0] ?? 'Programme',
    url: `/shop/${hit.handle}`,
    thumbnail: hit.thumbnail,
    price_zar: hit.price_zar,
  }
}

function topicToResult(hit: TopicSearchHit): SearchResultItem {
  return {
    type: 'explore_topics',
    id: hit.id,
    title: sanitizeHighlight(hit._formatted?.title ?? hit.title),
    subtitle: sanitizeHighlight(hit._formatted?.shortDescription ?? hit.shortDescription),
    url: hit.url,
    thumbnail: null,
    price_zar: null,
  }
}

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim()
  const rawIndex = searchParams.get('index') ?? 'all'
  const VALID_INDEXES = new Set<string>(['all', 'products', 'explore_topics'])
  if (!VALID_INDEXES.has(rawIndex)) {
    return NextResponse.json({ error: 'Invalid index' }, { status: 400 })
  }
  const indexParam = rawIndex as SearchIndex | 'all'
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '10', 10), 1), 50)

  if (!q) {
    return NextResponse.json({ results: [], query: '' })
  }

  if (!MEILI_KEY) {
    logError('[api/search] MEILISEARCH_ADMIN_KEY is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  try {
    const results: SearchResultItem[] = []

    if (indexParam === 'all' || indexParam === 'products') {
      const productHits = await searchIndex<ProductSearchHit>(
        'products',
        q,
        indexParam === 'all' ? Math.ceil(limit / 2) : limit,
        ['title', 'description']
      )
      results.push(...productHits.map(productToResult))
    }

    if (indexParam === 'all' || indexParam === 'explore_topics') {
      const topicHits = await searchIndex<TopicSearchHit>(
        'explore_topics',
        q,
        indexParam === 'all' ? Math.floor(limit / 2) : limit,
        ['title', 'shortDescription']
      )
      results.push(...topicHits.map(topicToResult))
    }

    return NextResponse.json({ results, query: q })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logError(`[api/search] query failed: ${msg}`, err)
    return NextResponse.json({ error: 'Search unavailable' }, { status: 503 })
  }
}
