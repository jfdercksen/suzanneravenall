import { describe, it, expect } from 'vitest'
import { allPrivateSessions, privateSessionBySlug } from './privateSessions'

// Resonance Repatterning is deliberately last — Suzanne wants it findable but
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

describe('allPrivateSessions', () => {
  it('contains exactly 9 entries', () => {
    expect(allPrivateSessions).toHaveLength(9)
  })

  it('every entry has a non-empty slug string', () => {
    for (const session of allPrivateSessions) {
      expect(typeof session.slug).toBe('string')
      expect(session.slug.length).toBeGreaterThan(0)
    }
  })

  it('every entry has a non-empty title string', () => {
    for (const session of allPrivateSessions) {
      expect(typeof session.title).toBe('string')
      expect(session.title.length).toBeGreaterThan(0)
    }
  })

  it('every entry has a non-empty shortDescription string', () => {
    for (const session of allPrivateSessions) {
      expect(typeof session.shortDescription).toBe('string')
      expect(session.shortDescription.length).toBeGreaterThan(0)
    }
  })

  it('every entry has a non-empty medusaHandle string', () => {
    for (const session of allPrivateSessions) {
      expect(typeof session.medusaHandle).toBe('string')
      expect(session.medusaHandle.length).toBeGreaterThan(0)
    }
  })

  it('every entry has bodyContent that is a string or null', () => {
    for (const session of allPrivateSessions) {
      expect(session.bodyContent === null || typeof session.bodyContent === 'string').toBe(true)
    }
  })

  it('every entry has a boolean thinContent field', () => {
    for (const session of allPrivateSessions) {
      expect(typeof session.thinContent).toBe('boolean')
    }
  })

  it('all slugs are unique', () => {
    const slugs = allPrivateSessions.map((s) => s.slug)
    const unique = new Set(slugs)
    expect(unique.size).toBe(slugs.length)
  })

  it('slugs match the expected set exactly', () => {
    const slugs = allPrivateSessions.map((s) => s.slug)
    expect(slugs).toEqual(EXPECTED_SLUGS)
  })
})

describe('privateSessionBySlug', () => {
  it('returns the correct entry for akashic-intuitive-mastery', () => {
    const result = privateSessionBySlug('akashic-intuitive-mastery')
    expect(result).toBeDefined()
    expect(result?.slug).toBe('akashic-intuitive-mastery')
    expect(result?.title).toBe('Akashic Intuitive Mastery')
  })

  it('returns undefined for a slug that does not exist', () => {
    const result = privateSessionBySlug('does-not-exist')
    expect(result).toBeUndefined()
  })

  it('returns undefined for an empty string', () => {
    expect(privateSessionBySlug('')).toBeUndefined()
  })

  it('returns the correct entry for every known slug', () => {
    for (const slug of EXPECTED_SLUGS) {
      const result = privateSessionBySlug(slug)
      expect(result).toBeDefined()
      expect(result?.slug).toBe(slug)
    }
  })
})

describe('dualProduct field', () => {
  it('only transformational-coaching has a dualProduct', () => {
    const withDual = allPrivateSessions.filter((s) => s.dualProduct !== undefined)
    expect(withDual).toHaveLength(1)
    expect(withDual[0].slug).toBe('transformational-coaching')
  })

  it('transformational-coaching dualProduct has handle executive-coaching-30-mins', () => {
    const session = privateSessionBySlug('transformational-coaching')
    expect(session?.dualProduct?.handle).toBe('executive-coaching-30-mins')
  })
})

describe('bodyContent and thinContent specifics', () => {
  it('executive-coaching has bodyContent === null', () => {
    const session = privateSessionBySlug('executive-coaching')
    expect(session?.bodyContent).toBeNull()
  })

  it('akashic-intuitive-mastery has thinContent === true', () => {
    const session = privateSessionBySlug('akashic-intuitive-mastery')
    expect(session?.thinContent).toBe(true)
  })

  it('group-family-coaching has thinContent === true', () => {
    const session = privateSessionBySlug('group-family-coaching')
    expect(session?.thinContent).toBe(true)
  })

  it('executive-coaching has thinContent === false', () => {
    const session = privateSessionBySlug('executive-coaching')
    expect(session?.thinContent).toBe(false)
  })

  it('resonance-repatterning has non-null bodyContent', () => {
    const session = privateSessionBySlug('resonance-repatterning')
    expect(session?.bodyContent).not.toBeNull()
    expect(typeof session?.bodyContent).toBe('string')
  })
})
