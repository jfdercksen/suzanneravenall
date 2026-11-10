import { describe, it, expect } from 'vitest'
import { PROGRAMME_COPY, SERIES_PATHS } from './programmeCopy'
import { getProgramBySlug } from './programs'
import { placeholdersIn } from '@/lib/content/richLine'

describe('data/programmeCopy (8 Nov attachments 03-06)', () => {
  it('only describes published programmes', () => {
    for (const slug of Object.keys(PROGRAMME_COPY)) {
      expect(getProgramBySlug(slug)?.isPublished, slug).toBe(true)
    }
  })

  it('covers both levels of Energy Clearing and Akashic Navigator, The Inner Sanctuary and Present', () => {
    expect(Object.keys(PROGRAMME_COPY).sort()).toEqual(
      [
        'akashic-navigator-advanced',
        'akashic-navigator-basic',
        'energy-clearing-advanced',
        'energy-clearing-basic',
        'meditation',
        'mindfulness',
      ].sort(),
    )
  })

  it('every series path step is a published programme and the bundle is a placeholder for Johan', () => {
    for (const path of Object.values(SERIES_PATHS)) {
      if (!path) continue
      for (const step of path.steps) expect(getProgramBySlug(step.slug)?.isPublished, step.slug).toBe(true)
      expect(placeholdersIn(path.bundle).map((p) => p.owner)).toEqual(['Johan'])
    }
  })

  it('has an Investment row on every page', () => {
    for (const [slug, copy] of Object.entries(PROGRAMME_COPY)) {
      expect(copy.details.some((d) => d.value === 'price'), slug).toBe(true)
    }
  })

  it('contains no em dash', () => {
    const emDash = String.fromCharCode(0x2014)
    expect(JSON.stringify(PROGRAMME_COPY)).not.toContain(emDash)
    expect(JSON.stringify(SERIES_PATHS)).not.toContain(emDash)
  })
})
