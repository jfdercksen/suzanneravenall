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
  it('has exactly 5 items', () => {
    expect(youthPathways).toHaveLength(5)
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
      'children-young-people-foundations-for-life',
      'emotional-mastery-for-young-minds',
      'young-minds-architecture',
      'pattern-foundations',
      'inner-compass',
    ])
  })
})

describe('pathways (full array)', () => {
  it('has exactly 12 total entries', () => {
    expect(pathways).toHaveLength(12)
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

  it('young-minds-architecture has hasDetailContent === false', () => {
    const p = pathways.find((x) => x.slug === 'young-minds-architecture')
    expect(p?.hasDetailContent).toBe(false)
  })

  it('reclaim-your-power has hasDetailContent === false (source page is a stub)', () => {
    const p = pathways.find((x) => x.slug === 'reclaim-your-power')
    expect(p?.hasDetailContent).toBe(false)
  })

  it('exactly 10 of 12 pathways have supplied detail content', () => {
    expect(pathways.filter((x) => x.hasDetailContent)).toHaveLength(10)
  })

  it('entries with hasDetailContent === true have a detail object with tagline and overview paragraphs', () => {
    for (const p of pathways.filter((x) => x.hasDetailContent)) {
      expect(p.detail).toBeDefined()
      expect(typeof p.detail?.tagline).toBe('string')
      expect(p.detail!.tagline.length).toBeGreaterThan(0)
      expect(Array.isArray(p.detail?.overview)).toBe(true)
      expect(p.detail!.overview.length).toBeGreaterThan(0)
      for (const paragraph of p.detail!.overview) {
        expect(typeof paragraph).toBe('string')
        expect(paragraph.length).toBeGreaterThan(0)
      }
    }
  })

  it('entries with hasDetailContent === false carry no detail object', () => {
    for (const p of pathways.filter((x) => !x.hasDetailContent)) {
      expect(p.detail).toBeUndefined()
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