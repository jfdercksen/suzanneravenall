import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(params: Record<string, string>, ip = '1.2.3.4'): NextRequest {
  const url = new URL('http://localhost/api/search')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString(), {
    headers: { 'x-forwarded-for': ip },
  })
}

function makeMeiliResponse<T>(hits: T[]) {
  return {
    hits,
    estimatedTotalHits: hits.length,
    query: '',
    processingTimeMs: 1,
  }
}

const productHit = {
  id: 'prod-1',
  handle: 'clarity-programme',
  title: 'Clarity Programme',
  description: 'A great programme',
  thumbnail: 'https://cdn.example.com/img.jpg',
  price_zar: 49900,
  collection_title: 'Coaching',
  collection_handle: 'coaching',
  category_names: ['Mindset'],
}

const topicHit = {
  id: 'topic-1',
  title: 'Finding Purpose',
  shortDescription: 'Discover your purpose',
  corePrinciple: 'Clarity',
  url: '/explore/finding-purpose',
}

// ---------------------------------------------------------------------------
// Module-level state: the rate-limit map is module-level in route.ts, so we
// re-import the route handler fresh between test groups via vi.resetModules().
// ---------------------------------------------------------------------------

describe('GET /api/search — empty query', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('MEILISEARCH_ADMIN_KEY', 'test-key')
    vi.stubEnv('MEILISEARCH_HOST', 'http://meilisearch:7700')
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('returns 200 with empty results when q is an empty string', async () => {
    const { GET } = await import('./route')
    const res = await GET(makeRequest({ q: '' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ results: [], query: '' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns 200 with empty results when q is whitespace only', async () => {
    const { GET } = await import('./route')
    const res = await GET(makeRequest({ q: '   ' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ results: [], query: '' })
  })
})

describe('GET /api/search — missing MEILISEARCH_ADMIN_KEY', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('MEILISEARCH_ADMIN_KEY', '')
    vi.stubEnv('MEILISEARCH_HOST', 'http://meilisearch:7700')
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('returns 500 when MEILISEARCH_ADMIN_KEY is not set', async () => {
    const { GET } = await import('./route')
    const res = await GET(makeRequest({ q: 'programme' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ error: 'Server configuration error' })
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('GET /api/search — rate limiting', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('MEILISEARCH_ADMIN_KEY', 'test-key')
    vi.stubEnv('MEILISEARCH_HOST', 'http://meilisearch:7700')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => makeMeiliResponse([productHit]),
      })
    )
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('returns 429 after 20 requests from the same IP within the window', async () => {
    const { GET } = await import('./route')
    const ip = '10.0.0.99'

    // First 20 requests should succeed (or hit Meili, not rate-limited)
    for (let i = 0; i < 20; i++) {
      const res = await GET(makeRequest({ q: 'test' }, ip))
      expect(res.status).not.toBe(429)
    }

    // 21st request from the same IP must be rate limited
    const res = await GET(makeRequest({ q: 'test' }, ip))
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body).toEqual({ error: 'Too many requests' })
  })

  it('does not rate-limit different IPs independently', async () => {
    const { GET } = await import('./route')

    for (let i = 0; i < 20; i++) {
      await GET(makeRequest({ q: 'test' }, '192.168.1.1'))
    }

    // Different IP should still succeed
    const res = await GET(makeRequest({ q: 'test' }, '192.168.1.2'))
    expect(res.status).not.toBe(429)
  })
})

describe('GET /api/search — correct Authorization header sent to MeiliSearch', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('MEILISEARCH_ADMIN_KEY', 'super-secret-key')
    vi.stubEnv('MEILISEARCH_HOST', 'http://meilisearch:7700')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('sends Bearer token from MEILISEARCH_ADMIN_KEY in the Authorization header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeMeiliResponse([]),
    })
    vi.stubGlobal('fetch', mockFetch)

    const { GET } = await import('./route')
    await GET(makeRequest({ q: 'mindset' }))

    expect(mockFetch).toHaveBeenCalled()
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    const headers = init.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer super-secret-key')
  })
})

describe('GET /api/search — index=all returns merged results', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('MEILISEARCH_ADMIN_KEY', 'test-key')
    vi.stubEnv('MEILISEARCH_HOST', 'http://meilisearch:7700')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('calls both products and explore_topics endpoints and merges results when index=all', async () => {
    const mockFetch = vi.fn()
      .mockImplementationOnce(async (url: string) => {
        expect(url).toContain('/indexes/products/search')
        return {
          ok: true,
          json: async () => makeMeiliResponse([productHit]),
        }
      })
      .mockImplementationOnce(async (url: string) => {
        expect(url).toContain('/indexes/explore_topics/search')
        return {
          ok: true,
          json: async () => makeMeiliResponse([topicHit]),
        }
      })
    vi.stubGlobal('fetch', mockFetch)

    const { GET } = await import('./route')
    const res = await GET(makeRequest({ q: 'clarity', index: 'all' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.results).toHaveLength(2)
    expect(body.results[0].type).toBe('products')
    expect(body.results[1].type).toBe('explore_topics')
    expect(body.results[0].url).toBe('/shop/clarity-programme')
    expect(body.results[1].url).toBe('/explore/finding-purpose')
  })
})

describe('GET /api/search — index=products only', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('MEILISEARCH_ADMIN_KEY', 'test-key')
    vi.stubEnv('MEILISEARCH_HOST', 'http://meilisearch:7700')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('only calls the products index and returns product results when index=products', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeMeiliResponse([productHit]),
    })
    vi.stubGlobal('fetch', mockFetch)

    const { GET } = await import('./route')
    const res = await GET(makeRequest({ q: 'programme', index: 'products' }))

    expect(res.status).toBe(200)
    const body = await res.json()

    // Only one fetch call (products only)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/indexes/products/search')

    expect(body.results).toHaveLength(1)
    expect(body.results[0].type).toBe('products')
  })
})

describe('GET /api/search — MeiliSearch error returns 503', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('MEILISEARCH_ADMIN_KEY', 'test-key')
    vi.stubEnv('MEILISEARCH_HOST', 'http://meilisearch:7700')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('returns 503 when the MeiliSearch fetch throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))

    const { GET } = await import('./route')
    const res = await GET(makeRequest({ q: 'test' }))

    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body).toEqual({ error: 'Search unavailable' })
  })

  it('returns 503 when MeiliSearch responds with a non-ok status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal error',
      })
    )

    const { GET } = await import('./route')
    const res = await GET(makeRequest({ q: 'test' }))

    expect(res.status).toBe(503)
  })
})
