// Go-live checks on next.config.mjs (26 Nov 2026): HSTS belongs to nginx only (N3),
// and no image host on hosted Supabase (self-host rule).
import { describe, it, expect, vi } from 'vitest'

vi.mock('@sentry/nextjs', () => ({
  withSentryConfig: (config) => config,
}))

const { default: config } = await import('./next.config.mjs')

describe('next.config.mjs go-live headers and image hosts', () => {
  it('sends no Strict-Transport-Security header, so nginx is the only source of HSTS', async () => {
    const groups = await config.headers()
    const keys = groups.flatMap((g) => g.headers.map((h) => h.key.toLowerCase()))
    expect(keys).not.toContain('strict-transport-security')
  })

  it('never sends includeSubDomains in any header', async () => {
    const groups = await config.headers()
    const values = groups.flatMap((g) => g.headers.map((h) => h.value))
    expect(values.join(' ')).not.toMatch(/includeSubDomains/i)
  })

  it('keeps the other security headers', async () => {
    const groups = await config.headers()
    const keys = groups.flatMap((g) => g.headers.map((h) => h.key))
    expect(keys).toEqual(expect.arrayContaining(['X-Content-Type-Options', 'Referrer-Policy']))
  })

  it('allows no image host on hosted Supabase', () => {
    const hosts = config.images.remotePatterns.map((p) => p.hostname)
    expect(hosts.some((h) => h.endsWith('supabase.co'))).toBe(false)
  })
})
