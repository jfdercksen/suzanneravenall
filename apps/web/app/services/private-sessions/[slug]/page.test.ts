import { describe, it, expect, vi } from 'vitest'

// Mock next/navigation. notFound throws in Next; the mock does the same so the
// unknown-slug path can be asserted.
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

// The page imports a React component — mock it to avoid JSX/DOM concerns in this
// pure-data test.
vi.mock('@/components/services/PrivateSessionDetail', () => ({
  default: vi.fn(),
}))

import { generateStaticParams, generateMetadata } from './page'
import { allPrivateSessions } from '@/data/privateSessions'

// Resonance Repatterning deliberately last — Suzanne wants it findable but
// never front-and-centre (feedback, 27 Jul 2026).
const EXPECTED_SLUGS = [
  'transformational-coaching',
  'rapid-transformational-therapy',
  'rapid-repatterning',
  'akashic-intuitive-mastery',
  'group-family-coaching',
  'exploring-the-alpha-mind',
  'energetic-realignment-optimisation',
  'executive-coaching',
  'resonance-repatterning',
]

describe('generateStaticParams', () => {
  it('returns exactly 9 param objects', () => {
    const params = generateStaticParams()
    expect(params).toHaveLength(9)
  })

  it('every returned object has only a slug key', () => {
    const params = generateStaticParams()
    for (const param of params) {
      expect(Object.keys(param)).toEqual(['slug'])
      expect(typeof param.slug).toBe('string')
    }
  })

  it('returned slugs exactly match allPrivateSessions slugs in order', () => {
    const params = generateStaticParams()
    const returnedSlugs = params.map((p) => p.slug)
    const sourceSlugs = allPrivateSessions.map((s) => s.slug)
    expect(returnedSlugs).toEqual(sourceSlugs)
  })

  it('returned slugs match the expected slug list', () => {
    const params = generateStaticParams()
    const returnedSlugs = params.map((p) => p.slug)
    expect(returnedSlugs).toEqual(EXPECTED_SLUGS)
  })

  it('all returned slugs are unique', () => {
    const params = generateStaticParams()
    const slugs = params.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

describe('generateMetadata (site check M1)', () => {
  it('calls notFound for an unknown slug instead of a fallback title', async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ slug: 'no-such-session' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('titles a known session', async () => {
    const first = allPrivateSessions[0]!
    const meta = await generateMetadata({ params: Promise.resolve({ slug: first.slug }) })
    expect(meta.title).toBe(`${first.title} | Private Sessions`)
  })
})
