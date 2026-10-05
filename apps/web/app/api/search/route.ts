import { NextRequest, NextResponse } from 'next/server'
import type {
  MeiliSearchHitsResponse,
  ProductSearchHit,
  TopicSearchHit,
  SearchResultItem,
  SearchIndex,
} from '@/lib/search/types'
import { logError } from '@/lib/log'
import { sanitizeHighlight, shareLimit } from '@/lib/search/utils'
import {
  PAGE_DOCUMENTS,
  TOPIC_DOCUMENTS,
  fetchBlogDocuments,
  searchDocuments,
} from '@/lib/search/siteSearch'

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
    subtitle: sanitizeHighlight(hit.collection_title ?? hit.category_names[0] ?? 'Programme'),
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
  const VALID_INDEXES = new Set<string>(['all', 'products', 'explore_topics', 'pages'])
  if (!VALID_INDEXES.has(rawIndex)) {
    return NextResponse.json({ error: 'Invalid index' }, { status: 400 })
  }
  const indexParam = rawIndex as SearchIndex | 'all'
  // Up to 100 so the shop can reach every product match (the catalogue is ~100 products).
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '10', 10) || 10, 1), 100)

  if (!q) {
    return NextResponse.json({ results: [], query: '' })
  }

  if (!MEILI_KEY) {
    logError('[api/search] MEILISEARCH_ADMIN_KEY is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  try {
    const wantProducts = indexParam === 'all' || indexParam === 'products'
    const wantTopics = indexParam === 'all' || indexParam === 'explore_topics'
    const wantPages = indexParam === 'all' || indexParam === 'pages'

    // Each source is asked for the full limit; shareLimit then trims the groups
    // so slots one group cannot fill go to the others.
    const [productHits, topicHits, blogDocs] = await Promise.all([
      wantProducts
        ? searchIndex<ProductSearchHit>('products', q, limit, ['title', 'description'])
        : Promise.resolve([] as ProductSearchHit[]),
      wantTopics
        ? searchIndex<TopicSearchHit>('explore_topics', q, limit, ['title', 'shortDescription'])
        : Promise.resolve([] as TopicSearchHit[]),
      wantPages ? fetchBlogDocuments() : Promise.resolve([]),
    ])

    // MeiliSearch only holds each topic's title and one-liner, so the full topic
    // page copy is searched in the app as well (site check C21). Meili hits keep
    // their place; body-copy matches it missed are appended.
    const topicResults = topicHits.map(topicToResult)
    if (wantTopics) {
      const seen = new Set(topicResults.map((r) => r.url))
      for (const r of searchDocuments(TOPIC_DOCUMENTS, q, limit)) {
        if (!seen.has(r.url)) topicResults.push(r)
      }
    }
    const pageResults = wantPages ? searchDocuments([...PAGE_DOCUMENTS, ...blogDocs], q, limit) : []

    const results: SearchResultItem[] = shareLimit(
      [productHits.map(productToResult), topicResults.slice(0, limit), pageResults],
      limit
    ).flat()

    return NextResponse.json({ results, query: q })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logError(`[api/search] query failed: ${msg}`, err)
    return NextResponse.json({ error: 'Search unavailable' }, { status: 503 })
  }
}
