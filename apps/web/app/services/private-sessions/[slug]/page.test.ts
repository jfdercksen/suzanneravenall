import { describe, it, expect, vi } from 'vitest'

// Mock next/navigation — notFound is called on the server but not exercised here
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

// The page imports a React component — mock it to avoid JSX/DOM concerns in this
// pure-data test.
vi.mock('@/components/services/PrivateSessionDetail', () => ({
  default: vi.fn(),
}))

import { generateStaticParams } from './page'
import { allPrivateSessions } from '@/data/privateSessions'

const EXPECTED_SLUGS = [
  'resonance-repatterning',
  'transformational-coaching',
  'rapid-transformational-therapy',
  'rapid-repatterning',
  'akashic-intuitive-mastery',
  'group-family-coaching',
  'exploring-the-alpha-mind',
  'energetic-realignment-optimisation',
  'executive-coaching',
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
