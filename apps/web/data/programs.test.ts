import { describe, expect, it } from 'vitest'
import {
  PROGRAMS,
  SELF_STUDY_EDITIONS,
  selfStudyEditionOf,
  getProgramBySlug,
  getProgramCta,
  getProgramsByCategory,
  getProgramsBySeries,
  getRelatedPrograms,
  isResonanceRepatterning,
} from './programs'

describe('programme catalogue data', () => {
  it('has a price for every published programme (no "Contact for pricing")', () => {
    // Energy Ninja Level 2 has no sourced ZAR price (sourcing report 6 Oct, section 7)
    const NO_SOURCED_ZAR = ['become-an-energy-ninja-level-2']
    const missing = PROGRAMS.filter(
      (p) =>
        p.isPublished &&
        (p.priceUsd == null || (p.priceZar == null && !NO_SOURCED_ZAR.includes(p.slug))),
    ).map((p) => p.slug)
    expect(missing).toEqual([])
  })

  it('uses the live-shop self-study prices (sourcing report 6 Oct, decision 4)', () => {
    const zar = (slug: string) => getProgramBySlug(slug)?.priceZar
    expect(zar('energy-clearing-basic')).toBe(4650)
    expect(zar('energy-clearing-advanced')).toBe(4650)
    expect(zar('resonance-repatterning-08-principles-of-relationship')).toBe(4205)
    expect(zar('resonance-repatterning-09-energetics-of-relationship')).toBe(4205)
    expect(zar('trauma-to-transcendence')).toBe(3500)
    expect(getProgramBySlug('trauma-to-transcendence')?.priceUsd).toBe(399)
    expect(zar('love-and-relationships')).toBe(995)
    expect(zar('intuition-in-my-personal-capacity')).toBe(995)
    expect(zar('intuition-in-business')).toBe(995)
    expect(zar('become-an-energy-ninja')).toBe(3320)
    expect(zar('become-an-energy-ninja-level-2')).toBeUndefined()
  })

  it('carries no live dates, "coming soon" or "6 x 2 hours" durations', () => {
    for (const p of PROGRAMS) {
      expect(p.duration ?? '', p.slug).not.toMatch(/coming soon|to be announced|2 hours each/i)
    }
  })

  it('gives the group series their sourced 4 x 90 minute format', () => {
    for (const slug of ['money-mastery', 'career-progression', 'shedding-excess-weight', 'love-and-relationships']) {
      expect(getProgramBySlug(slug)?.duration, slug).toMatch(/4 sessions of 90 minutes/)
    }
  })

  it('links every prerequisite to a published programme', () => {
    for (const p of PROGRAMS) {
      if (!p.prerequisite?.slug) continue
      expect(getProgramBySlug(p.prerequisite.slug)?.isPublished, p.slug).toBe(true)
    }
  })

  it('has unique slugs', () => {
    const slugs = PROGRAMS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('assigns a series to every practitioner programme', () => {
    const withoutSeries = PROGRAMS.filter(
      (p) => p.category === 'practitioner' && !p.series,
    ).map((p) => p.slug)
    expect(withoutSeries).toEqual([])
  })

  it('groups the four Resonance Repatterning programmes under the RR series', () => {
    const rr = getProgramsBySeries('resonance-repatterning').map((p) => p.slug)
    expect(rr).toEqual([
      'resonance-repatterning-basic-5-series',
      'resonance-repatterning-06-inner-cultivation',
      'resonance-repatterning-08-principles-of-relationship',
      'resonance-repatterning-09-energetics-of-relationship',
    ])
  })

  it('labels all Resonance Repatterning programmes as self-study', () => {
    for (const p of getProgramsBySeries('resonance-repatterning')) {
      expect(p.duration).toMatch(/self-study/i)
      expect(p.duration).not.toMatch(/coming soon/i)
    }
  })

  it('keeps Energy Clearing and Akashic Navigator as Basic/Advanced pairs', () => {
    expect(getProgramsBySeries('energy-clearing')).toHaveLength(2)
    expect(getProgramsBySeries('akashic-navigator')).toHaveLength(2)
  })

  it('returns a programme by slug', () => {
    expect(getProgramBySlug('coherence-muscle-testing')?.name).toBe(
      'Coherence Muscle Testing',
    )
    expect(getProgramBySlug('does-not-exist')).toBeUndefined()
  })
})

describe('getProgramCta', () => {
  it('says "View in Shop" when a product exists, since the button opens the shop page', () => {
    const p = getProgramBySlug('getting-unstuck')
    expect(p && getProgramCta(p)).toEqual({ label: 'View in Shop', href: '/shop/getting-unstuck-self-study' })
  })

  it('points the live Meditation programme at the live product, not self-study', () => {
    const p = getProgramBySlug('meditation')
    expect(p?.shopHandle).toBe('meditation-live-via-zoom')
  })

  it('links the recorded group series that have a shop product', () => {
    expect(getProgramBySlug('money-mastery')?.shopHandle).toBe('money-mastery-group-session')
    expect(getProgramBySlug('career-progression')?.shopHandle).toBe('career-progression-group-session')
    expect(getProgramBySlug('attraction-frequency')?.shopHandle).toBe(
      'group-session-attraction-frequency-recorded',
    )
    expect(getProgramBySlug('develop-super-confidence')?.shopHandle).toBe(
      'group-session-develop-super-confidence',
    )
  })

  it('sends a programme without a product to a named /contact enquiry', () => {
    const p = getProgramBySlug('overcoming-the-need-to-fix-others')
    expect(p).toBeDefined()
    if (!p) return
    const cta = getProgramCta(p)
    expect(cta.label).toBe('Enquire')
    const url = new URL(cta.href, 'https://example.com')
    expect(url.pathname).toBe('/contact')
    expect(url.searchParams.get('enquiry')).toBe('Group Program')
    expect(url.searchParams.get('topic')).toBe('Overcoming the Need to Fix Others')
  })

  it('sends live Zoom programmes without dates to a register-interest enquiry', () => {
    for (const slug of ['mindfulness', 'meditation', 'become-an-energy-ninja-level-2']) {
      const p = getProgramBySlug(slug)
      expect(p?.registerInterest, slug).toBe(true)
      if (!p) continue
      const cta = getProgramCta(p)
      expect(cta.label).toBe('Register Interest')
      const url = new URL(cta.href, 'https://example.com')
      expect(url.pathname).toBe('/contact')
      expect(url.searchParams.get('topic')).toBe(`${p.name} (live via Zoom)`)
    }
  })

  it('never labels a programme button "Add to Cart" or "Book Now"', () => {
    for (const p of PROGRAMS) {
      expect(['Add to Cart', 'Book Now']).not.toContain(getProgramCta(p).label)
    }
  })
})

describe('getRelatedPrograms', () => {
  it('never recommends Resonance Repatterning from a non-RR practitioner page', () => {
    const akashic = getProgramBySlug('akashic-navigator-basic')
    expect(akashic).toBeDefined()
    if (!akashic) return
    const related = getRelatedPrograms(akashic, 3)
    expect(related.length).toBeGreaterThan(0)
    expect(related.some((p) => isResonanceRepatterning(p))).toBe(false)
  })

  it('never recommends Resonance Repatterning from a self-study page', () => {
    const gettingUnstuck = getProgramBySlug('getting-unstuck')
    expect(gettingUnstuck).toBeDefined()
    if (!gettingUnstuck) return
    const related = getRelatedPrograms(gettingUnstuck, 3)
    expect(related.length).toBeGreaterThan(0)
    expect(related.some((p) => isResonanceRepatterning(p))).toBe(false)
  })

  it('allows RR programmes to relate other RR programmes on RR pages', () => {
    const basicFive = getProgramBySlug('resonance-repatterning-basic-5-series')
    expect(basicFive).toBeDefined()
    if (!basicFive) return
    const related = getRelatedPrograms(basicFive, 3)
    expect(related.length).toBeGreaterThan(0)
    for (const p of related) {
      expect(p.category).toBe('practitioner')
    }
  })

  it('excludes the current programme and unpublished programmes', () => {
    for (const program of getProgramsByCategory('self-paced')) {
      const related = getRelatedPrograms(program, 3)
      expect(related.every((p) => p.slug !== program.slug)).toBe(true)
      expect(related.every((p) => p.isPublished)).toBe(true)
      expect(related.length).toBeLessThanOrEqual(3)
    }
  })
})

// Johan, 10 Nov 2026: "If it says self-study the product must sell as self-study."
// selfStudyVariant mirrors the review box catalogue (a published Self Study
// variant on the programme's shopHandle product, read 10 Nov).
describe('self-study rule (Johan 10 Nov)', () => {
  it('every programme whose product sells self-study offers it to buy now (no exceptions, Johan 10 Nov)', () => {
    for (const p of PROGRAMS.filter((x) => x.isPublished && x.selfStudyVariant)) {
      const edition = selfStudyEditionOf(p)
      if (edition) {
        // A live programme with the recorded self-study beside it: same product,
        // the edition priced at the Self Study variant and sold from the shop.
        expect(edition.shopHandle, p.slug).toBe(p.shopHandle)
        expect(edition.registerInterest, p.slug).toBeFalsy()
        expect(getProgramCta(edition).href, p.slug).toBe(`/shop/${p.shopHandle}`)
        expect(p.duration, p.slug).toMatch(/Self-study/)
        continue
      }
      expect(p.registerInterest, p.slug).toBeFalsy()
      expect(p.category, p.slug).not.toBe('live')
      expect(p.duration, p.slug).toMatch(/^Self-study/)
      expect(getProgramCta(p).href, p.slug).toBe(`/shop/${p.shopHandle}`)
    }
  })

  it('The Inner Sanctuary and Present stay live and also sell the recorded self-study (KI106)', () => {
    for (const slug of ['meditation', 'mindfulness']) {
      const p = getProgramBySlug(slug)!
      expect(p.category, slug).toBe('live')
      expect(p.registerInterest, slug).toBe(true)
      expect(selfStudyEditionOf(p)?.priceZar, slug).toBe(1660)
      expect(SELF_STUDY_EDITIONS.map((e) => e.slug)).toContain(`${slug}--self-study`)
    }
  })

  it('covers the four programmes Suzanne listed in item 8.2, as the catalogue sells them', () => {
    for (const slug of ['love-and-relationships', 'intuition-in-my-personal-capacity', 'become-an-energy-ninja']) {
      const p = getProgramBySlug(slug)!
      expect(p.selfStudyVariant, slug).toBe(true)
      expect(p.duration, slug).toMatch(/Live via Zoom: register your interest$/)
    }
    const level2 = getProgramBySlug('become-an-energy-ninja-level-2')!
    expect(level2.selfStudyVariant).toBeFalsy()
    expect(level2.category).toBe('live')
    expect(level2.registerInterest).toBe(true)
  })
})
