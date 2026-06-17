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
