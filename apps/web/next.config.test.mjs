// Tests for next.config.mjs redirects() — pure data assertions, no network calls.
//
// next.config.mjs calls withSentryConfig() from @sentry/nextjs at module level.
// We mock that package so the module loads cleanly in Vitest without Sentry SDK
// side-effects (source-map plugin, webpack mutations, etc.).
//
// Note: this file is .mjs so Vitest handles the ESM import correctly.

import { describe, it, expect, vi } from 'vitest'

vi.mock('@sentry/nextjs', () => ({
  withSentryConfig: (_config, _sentryOptions) => _config,
}))

// Dynamic import happens after the mock is registered.
const { default: config } = await import('./next.config.mjs')

const redirects = await config.redirects()

describe('next.config.mjs redirects — catch-all removal', () => {
  it('does NOT contain a redirect with source /services/private-sessions', () => {
    const match = redirects.find((r) => r.source === '/services/private-sessions')
    expect(match).toBeUndefined()
  })

  it('does NOT contain a redirect with source /services/private-sessions/:path*', () => {
    const match = redirects.find((r) => r.source === '/services/private-sessions/:path*')
    expect(match).toBeUndefined()
  })
})

describe('next.config.mjs redirects — repointed slug destinations', () => {
  const EXPECTED_REDIRECTS = [
    {
      source: '/akashic-clearing',
      destination: '/services/private-sessions/akashic-intuitive-mastery',
    },
    {
      source: '/transformational-behavioural-coaching',
      destination: '/services/private-sessions/transformational-coaching',
    },
    {
      source: '/energetic-clearing',
      destination: '/services/private-sessions/energetic-realignment-optimisation',
    },
    {
      source: '/group-family-coaching',
      destination: '/services/private-sessions/group-family-coaching',
    },
    {
      source: '/resonance-repatterning-session',
      destination: '/services/private-sessions/resonance-repatterning',
    },
    {
      source: '/rapid-repatterning-2',
      destination: '/services/private-sessions/rapid-repatterning',
    },
    {
      source: '/exploring-the-alpha-mind',
      destination: '/services/private-sessions/exploring-the-alpha-mind',
    },
    {
      source: '/services/rapid-transformational-therapy',
      destination: '/services/private-sessions/rapid-transformational-therapy',
    },
    {
      source: '/programs/nice-or-not-nice-communication',
      destination: '/programs/coherent-communication',
    },
    // Energy Clearing renamed Energy Alignment & Optimisation (Suzanne, 12 Nov 2026)
    {
      source: '/programs/energy-clearing-basic',
      destination: '/programs/energy-alignment-optimisation-basic',
    },
    {
      source: '/programs/energy-clearing-advanced',
      destination: '/programs/energy-alignment-optimisation-advanced',
    },
  ]

  for (const { source, destination } of EXPECTED_REDIRECTS) {
    it(`${source} → ${destination} with permanent: true`, () => {
      const match = redirects.find((r) => r.source === source)
      expect(match).toBeDefined()
      expect(match?.destination).toBe(destination)
      expect(match?.permanent).toBe(true)
    })
  }
})

describe('next.config.mjs redirects — /basket still present', () => {
  it('/basket redirects to /cart (not removed)', () => {
    const match = redirects.find((r) => r.source === '/basket')
    expect(match).toBeDefined()
    expect(match?.destination).toBe('/cart')
    expect(match?.permanent).toBe(true)
  })
})

describe('next.config.mjs redirects: Energy Clearing paths never chain (Suzanne, 12 Nov 2026)', () => {
  const sources = new Set(redirects.map((r) => r.source))

  it('no redirect lands on an old energy-clearing programme path', () => {
    expect(redirects.filter((r) => r.destination.startsWith('/programs/energy-clearing'))).toEqual([])
  })

  it('every energy-clearing source ends on a page that is not itself redirected', () => {
    const ec = redirects.filter((r) => r.source.includes('energy-clearing'))
    expect(ec.length).toBeGreaterThanOrEqual(5)
    for (const r of ec) {
      expect(r.permanent, r.source).toBe(true)
      expect(sources.has(r.destination), `${r.source} -> ${r.destination}`).toBe(false)
    }
  })
})
