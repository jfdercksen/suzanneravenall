import { placeholdersIn } from '@/lib/content/richLine'
import { describe, it, expect } from 'vitest'
import {
  pathways,
  personalPathways,
  youthPathways,
  groupPathways,
  pathwayBySlug,
  featuredPathway,
  categoryLabel,
} from './pathways'

describe('personalPathways', () => {
  it('has exactly 7 items', () => {
    expect(personalPathways).toHaveLength(7)
  })

  it('every item has category "personal"', () => {
    for (const p of personalPathways) {
      expect(p.category).toBe('personal')
    }
  })

  it('every item has a non-empty slug string', () => {
    for (const p of personalPathways) {
      expect(typeof p.slug).toBe('string')
      expect(p.slug.length).toBeGreaterThan(0)
    }
  })

  it('every item has a non-empty title string', () => {
    for (const p of personalPathways) {
      expect(typeof p.title).toBe('string')
      expect(p.title.length).toBeGreaterThan(0)
    }
  })

  it('every item has a non-empty description string', () => {
    for (const p of personalPathways) {
      expect(typeof p.description).toBe('string')
      expect(p.description.length).toBeGreaterThan(0)
    }
  })

  it('all slugs are unique within personal pathways', () => {
    const slugs = personalPathways.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('contains exactly the expected personal slugs', () => {
    const slugs = personalPathways.map((p) => p.slug)
    expect(slugs).toEqual([
      'break-the-loop',
      'reclaim-your-power',
      'reinvent-your-life',
      'upgrade-your-operating-system',
      'trauma-to-breakthrough',
      'resilience-fortification',
      'pattern-mastery',
    ])
  })
})

describe('youthPathways', () => {
  it('has exactly 4 items (Suzanne, 8 Nov)', () => {
    expect(youthPathways).toHaveLength(4)
  })

  it('every item has category "youth"', () => {
    for (const p of youthPathways) {
      expect(p.category).toBe('youth')
    }
  })

  it('every item has a non-empty slug string', () => {
    for (const p of youthPathways) {
      expect(typeof p.slug).toBe('string')
      expect(p.slug.length).toBeGreaterThan(0)
    }
  })

  it('every item has a non-empty title string', () => {
    for (const p of youthPathways) {
      expect(typeof p.title).toBe('string')
      expect(p.title.length).toBeGreaterThan(0)
    }
  })

  it('every item has a non-empty description string', () => {
    for (const p of youthPathways) {
      expect(typeof p.description).toBe('string')
      expect(p.description.length).toBeGreaterThan(0)
    }
  })

  it('all slugs are unique within youth pathways', () => {
    const slugs = youthPathways.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('contains exactly the expected youth slugs', () => {
    const slugs = youthPathways.map((p) => p.slug)
    expect(slugs).toEqual([
      'pattern-foundations-children',
      'pattern-foundations-teens',
      'inner-compass',
      'the-family-pattern',
    ])
  })

  it('every pathway for minors carries the safeguarding line; the parents pathway does not need it', () => {
    for (const p of youthPathways) {
      if (p.slug === 'the-family-pattern') continue
      expect(p.detail?.safeguarding, p.slug).toBeDefined()
    }
  })

  it('every young people pathway shows an age band or audience', () => {
    expect(youthPathways.map((p) => p.ageLabel)).toEqual(['Ages 7–12', 'Ages 13–18', 'Ages 10–18', 'For parents'])
  })

  it('keeps the old pathway names as session themes', () => {
    const themes = youthPathways.flatMap((p) => p.detail?.sessionThemes ?? [])
    for (const old of ['Foundations for Life', 'Pattern Foundations', 'Emotional Mastery for Young Minds', 'Young Minds Architecture']) {
      expect(themes).toContain(old)
    }
  })

  it('leaves the format line a visible placeholder for Suzanne', () => {
    for (const p of youthPathways) {
      expect(placeholdersIn(p.detail?.format).map((x) => x.owner), p.slug).toEqual(['Suzanne'])
    }
  })
})

describe('Pattern Mastery (8 Nov copy)', () => {
  const mastery = pathways.find((p) => p.slug === 'pattern-mastery')
  it('carries her copy and both her buttons', () => {
    expect(mastery?.detail?.lead).toMatch(/^Everything repeats until it’s understood/)
    expect(mastery?.detail?.ctas?.map((c) => c.label)).toEqual(['Apply for Pattern Mastery', 'Book a Discovery Call'])
  })
  it('keeps the foundations pathway name and the format as placeholders', () => {
    expect(placeholdersIn(mastery?.detail?.whoItsForNote)).toHaveLength(1)
    expect(placeholdersIn(mastery?.detail?.format)).toHaveLength(1)
  })
})

describe('copy rule', () => {
  it('has no em dash anywhere in the pathway copy', () => {
    expect(JSON.stringify(pathways)).not.toContain('\u2014')
  })
})

describe('pathways (full array)', () => {
  it('has exactly 11 total entries', () => {
    expect(pathways).toHaveLength(11)
  })

  it('personalPathways and youthPathways together account for all entries', () => {
    expect(personalPathways.length + youthPathways.length).toBe(pathways.length)
  })

  it('no slug is duplicated across the full array', () => {
    const slugs = pathways.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('every entry has a boolean featured field', () => {
    for (const p of pathways) {
      expect(typeof p.featured).toBe('boolean')
    }
  })

  it('every entry has a boolean hasDetailContent field', () => {
    for (const p of pathways) {
      expect(typeof p.hasDetailContent).toBe('boolean')
    }
  })

  it('all 11 pathways have supplied detail content', () => {
    expect(pathways.filter((x) => x.hasDetailContent)).toHaveLength(11)
  })

  it('every entry has a detail object with a heroSubhead and whatThisPathwayIs paragraphs', () => {
    for (const p of pathways) {
      expect(p.detail).toBeDefined()
      expect(typeof p.detail?.heroSubhead).toBe('string')
      expect(p.detail!.heroSubhead.length).toBeGreaterThan(0)
      expect(Array.isArray(p.detail?.whatThisPathwayIs)).toBe(true)
      expect(p.detail!.whatThisPathwayIs.length).toBeGreaterThan(0)
      for (const paragraph of p.detail!.whatThisPathwayIs) {
        expect(typeof paragraph).toBe('string')
        expect(paragraph.length).toBeGreaterThan(0)
      }
    }
  })

  it('every entry has a non-empty ctaSectionBody', () => {
    for (const p of pathways) {
      expect(typeof p.detail?.ctaSectionBody).toBe('string')
      expect(p.detail!.ctaSectionBody.length).toBeGreaterThan(0)
    }
  })

  it('the 7 adult pathways each have a primary hero CTA label and a closing statement', () => {
    for (const p of personalPathways) {
      expect(typeof p.detail?.heroCtaPrimaryLabel).toBe('string')
      expect(p.detail?.heroCtaPrimaryLabel?.length).toBeGreaterThan(0)
      // Pattern Mastery (8 Nov copy) closes its outcomes with one bold line instead
      const closing = p.detail?.signatureMessage ?? (p.detail?.outcomesClosing ? [p.detail.outcomesClosing] : [])
      expect(closing.length, p.slug).toBeGreaterThan(0)
    }
  })

  it('the 4 youth pathways have no bespoke primary hero CTA label or signature message', () => {
    for (const p of youthPathways) {
      expect(p.detail?.heroCtaPrimaryLabel).toBeUndefined()
      expect(p.detail?.signatureMessage).toBeUndefined()
    }
  })
})

describe('groupPathways', () => {
  it('has exactly 4 immersions', () => {
    expect(groupPathways).toHaveLength(4)
  })

  it('contains the four immersion titles in order', () => {
    expect(groupPathways.map((g) => g.title)).toEqual([
      '3-Day Immersion',
      '8-Week Immersion',
      '12-Week Immersion',
      '12-Month Immersion',
    ])
  })

  it('every immersion has a unique id and a non-empty description', () => {
    const ids = groupPathways.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const g of groupPathways) {
      expect(g.description.length).toBeGreaterThan(0)
    }
  })
})

describe('pathwayBySlug', () => {
  it('returns the correct entry for a known personal slug', () => {
    const result = pathwayBySlug('break-the-loop')
    expect(result).toBeDefined()
    expect(result?.slug).toBe('break-the-loop')
    expect(result?.title).toBe('Break the Loop')
    expect(result?.category).toBe('personal')
  })

  it('returns the correct entry for a known youth slug', () => {
    const result = pathwayBySlug('inner-compass')
    expect(result).toBeDefined()
    expect(result?.slug).toBe('inner-compass')
    expect(result?.category).toBe('youth')
  })

  it('returns undefined for a slug that does not exist', () => {
    expect(pathwayBySlug('does-not-exist')).toBeUndefined()
  })

  it('returns undefined for an empty string', () => {
    expect(pathwayBySlug('')).toBeUndefined()
  })
})

describe('featuredPathway', () => {
  it('is defined', () => {
    expect(featuredPathway).toBeDefined()
  })

  it('has featured === true', () => {
    expect(featuredPathway?.featured).toBe(true)
  })

  it('is break-the-loop', () => {
    expect(featuredPathway?.slug).toBe('break-the-loop')
  })

  it('exactly one pathway has featured === true', () => {
    const featured = pathways.filter((p) => p.featured)
    expect(featured).toHaveLength(1)
  })
})

describe('categoryLabel', () => {
  it('returns "Young People Pathway" for "youth"', () => {
    expect(categoryLabel('youth')).toBe('Young People Pathway')
  })

  it('returns "Personal Pathway" for "personal"', () => {
    expect(categoryLabel('personal')).toBe('Personal Pathway')
  })
})