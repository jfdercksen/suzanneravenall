import { describe, expect, it } from 'vitest'
import {
  PROGRAMS,
  getProgramBySlug,
  getProgramsByCategory,
  getProgramsBySeries,
  getRelatedPrograms,
  isResonanceRepatterning,
} from './programs'

describe('programme catalogue data', () => {
  it('has a price for every published programme (no "Contact for pricing")', () => {
    const missing = PROGRAMS.filter(
      (p) => p.isPublished && (p.priceUsd == null || p.priceZar == null),
    ).map((p) => p.slug)
    expect(missing).toEqual([])
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
