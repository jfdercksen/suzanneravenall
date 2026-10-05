import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const BUILD = '2026-10-01T08:00:00.000Z'

async function loadSitemap() {
  vi.resetModules()
  const mod = await import('./sitemap')
  return mod.default
}

describe('sitemap (site check M4)', () => {
  beforeEach(() => {
    vi.stubEnv('SITE_BUILD_DATE', BUILD)
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.test')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            products: [{ handle: 'mug', updated_at: '2026-09-12T10:00:00.000Z' }, { handle: 'book' }],
            count: 2,
          }),
          { status: 200 },
        ),
      ),
    )
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('never uses the request time as lastmod', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T00:00:00.000Z'))
    try {
      const sitemap = await loadSitemap()
      const entries = await sitemap()
      for (const entry of entries) {
        expect(String(entry.lastModified)).not.toContain('2030')
      }
    } finally {
      vi.useRealTimers()
    }
  })

  it('dates site pages with the build date', async () => {
    const sitemap = await loadSitemap()
    const entries = await sitemap()
    const home = entries.find((e) => e.url === 'https://example.test')
    expect(home?.lastModified).toBe(BUILD)
  })

  it('dates products with their Medusa updated_at, falling back to the build date', async () => {
    const sitemap = await loadSitemap()
    const entries = await sitemap()
    expect(entries.find((e) => e.url.endsWith('/shop/mug'))?.lastModified).toBe(
      '2026-09-12T10:00:00.000Z',
    )
    expect(entries.find((e) => e.url.endsWith('/shop/book'))?.lastModified).toBe(BUILD)
  })

  it('leaves lastmod out when no build date was inlined', async () => {
    vi.stubEnv('SITE_BUILD_DATE', '')
    const sitemap = await loadSitemap()
    const entries = await sitemap()
    const home = entries.find((e) => e.url === 'https://example.test')
    expect(home?.lastModified).toBeUndefined()
  })

  it('lists /pattern-coach', async () => {
    const sitemap = await loadSitemap()
    const entries = await sitemap()
    expect(entries.map((e) => e.url)).toContain('https://example.test/pattern-coach')
  })
})
