import { describe, it, expect } from 'vitest'
import { CERTIFICATION_PATHWAYS, getPathwayBySlug, pathwayForProgramme, pathwayHref } from '.'
import { getProgramBySlug } from '@/data/programs'

// Suzanne's Career & Certification Pathway documents of 12 Nov 2026 (v1.0), used as sent.

/** Every string in a pathway, joined: the text the page can show. */
function allText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(allText).join('\n')
  if (value && typeof value === 'object') return Object.values(value).map(allText).join('\n')
  return ''
}
const ALL_TEXT = (p: (typeof CERTIFICATION_PATHWAYS)[number]) => allText(p)

describe('certification pathway data', () => {
  it.each(CERTIFICATION_PATHWAYS.map((p) => [p.slug, p] as const))('%s: every level has parts A to D, and the glance table matches the levels', (_slug, p) => {
    expect(p.levels.map((l) => [l.level, l.status])).toEqual(p.levelsAtAGlance.map((g) => [g.level, g.status]))
    for (const level of p.levels) {
      expect(level.parts.map((part) => part.key).slice(0, 4), level.status).toEqual(['A', 'B', 'C', 'D'])
      for (const part of level.parts) expect(part.items.length, `${level.status} ${part.key}`).toBeGreaterThan(0)
    }
    expect(p.levels.find((l) => l.status === 'Instructor')?.parts.map((x) => x.key)).toEqual(['A', 'B', 'C', 'D', 'E'])
  })

  it.each(CERTIFICATION_PATHWAYS.map((p) => [p.slug, p] as const))('%s: every "point(s) N above" in part B names an item that exists and comes before it', (_slug, p) => {
    let checked = 0
    for (const level of p.levels) {
      const b = level.parts.find((part) => part.key === 'B')!
      b.items.forEach((item, index) => {
        const m = item.text.match(/points? (\d+)(?: and (\d+))?/)
        if (!m) return
        for (const n of [m[1], m[2]].filter(Boolean).map(Number)) {
          expect(n, `${level.status}: "${item.text}"`).toBeLessThanOrEqual(index)
          expect(b.items[n - 1], `${level.status} point ${n}`).toBeDefined()
        }
        checked += 1
      })
    }
    expect(checked).toBeGreaterThanOrEqual(5)
  })

  it.each(CERTIFICATION_PATHWAYS.map((p) => [p.slug, p] as const))('%s: none of the editorial furniture, no em dash', (_slug, p) => {
    const text = ALL_TEXT(p)
    expect(text).not.toMatch(/DRAFT|For review|working titles|insert the external body|Accreditation:|Appendix B|attorney|\u2014/)
    expect(text).not.toMatch(/\[[^\]]*\]/)
    expect(p.nb).toMatch(/^NB: Certification requirements change from time to time\./)
    expect(text).toContain('support@ravenallinstitute.com')
    // Suzanne 24 Nov: "just use support@"; membersupport@ and certification@ do not exist.
    expect(text).not.toMatch(/membersupport@|certification@/)
  })

  it('links each modality to its course pages (Rapid Repatterning has no published page)', () => {
    expect(pathwayForProgramme(getProgramBySlug('energy-alignment-optimisation-basic')!)?.slug).toBe('energy-alignment-optimisation')
    expect(pathwayForProgramme(getProgramBySlug('akashic-navigator-advanced')!)?.slug).toBe('akashic-navigation')
    expect(pathwayForProgramme(getProgramBySlug('rapid-repatterning-introduction')!)?.slug).toBe('rapid-repatterning')
    expect(pathwayForProgramme(getProgramBySlug('getting-unstuck')!)).toBeUndefined()
    expect(getPathwayBySlug('nope')).toBeUndefined()
    expect(pathwayHref(CERTIFICATION_PATHWAYS[0]!)).toBe('/programs/certification/rapid-repatterning')
  })
})
