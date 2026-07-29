import { describe, it, expect } from 'vitest'
import {
  patternQuizzes,
  masterPatternQuizUrl,
  categoryLabel,
  type PatternQuizCategory,
} from './patternQuizzes'

describe('patternQuizzes', () => {
  it('has exactly 8 entries', () => {
    expect(patternQuizzes).toHaveLength(8)
  })

  it('all slugs are unique', () => {
    const slugs = patternQuizzes.map((q) => q.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('every slug is a non-empty string', () => {
    for (const q of patternQuizzes) {
      expect(typeof q.slug).toBe('string')
      expect(q.slug.length).toBeGreaterThan(0)
    }
  })

  it('every title is a non-empty string', () => {
    for (const q of patternQuizzes) {
      expect(typeof q.title).toBe('string')
      expect(q.title.length).toBeGreaterThan(0)
    }
  })

  it('every question is a non-empty string', () => {
    for (const q of patternQuizzes) {
      expect(typeof q.question).toBe('string')
      expect(q.question.length).toBeGreaterThan(0)
    }
  })

  it('every description is a non-empty string', () => {
    for (const q of patternQuizzes) {
      expect(typeof q.description).toBe('string')
      expect(q.description.length).toBeGreaterThan(0)
    }
  })

  it('every icon is a non-empty string', () => {
    for (const q of patternQuizzes) {
      expect(typeof q.icon).toBe('string')
      expect(q.icon.length).toBeGreaterThan(0)
    }
  })

  it('every topicSlug is a non-empty string', () => {
    for (const q of patternQuizzes) {
      expect(typeof q.topicSlug).toBe('string')
      expect(q.topicSlug.length).toBeGreaterThan(0)
    }
  })

  it('all topicSlug values are unique', () => {
    const slugs = patternQuizzes.map((q) => q.topicSlug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('contains a "nervous-system" entry whose topicSlug matches the master quiz URL', () => {
    const nervousSystem = patternQuizzes.find((q) => q.slug === 'nervous-system')
    expect(nervousSystem).toBeDefined()
    expect(masterPatternQuizUrl).toBe(`/explore/${nervousSystem?.topicSlug}/quiz`)
  })

  it('every entry has a category from the PatternQuizCategory union', () => {
    const validCategories: PatternQuizCategory[] = [
      'emotional',
      'relationships',
      'health',
      'identity',
      'leadership',
      'transitions',
      'intuition',
      'vitality',
    ]
    for (const q of patternQuizzes) {
      expect(validCategories).toContain(q.category)
    }
  })

  it('all 8 categories are represented exactly once', () => {
    const categories = patternQuizzes.map((q) => q.category)
    expect(new Set(categories).size).toBe(8)
  })
})

describe('masterPatternQuizUrl', () => {
  it('is a non-empty internal path to the nervous-system quiz', () => {
    expect(typeof masterPatternQuizUrl).toBe('string')
    expect(masterPatternQuizUrl.startsWith('/explore/')).toBe(true)
    expect(masterPatternQuizUrl.endsWith('/quiz')).toBe(true)
  })

  it('matches the nervous-system entry topicSlug exactly', () => {
    const nervousSystem = patternQuizzes.find((q) => q.slug === 'nervous-system')
    expect(masterPatternQuizUrl).toBe(`/explore/${nervousSystem?.topicSlug}/quiz`)
  })
})

describe('categoryLabel', () => {
  it('returns a non-empty string for every category present in patternQuizzes data', () => {
    for (const q of patternQuizzes) {
      const label = categoryLabel(q.category)
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })

  it('returns "Emotional Mastery" for "emotional"', () => {
    expect(categoryLabel('emotional')).toBe('Emotional Mastery')
  })

  it('returns "Relationships" for "relationships"', () => {
    expect(categoryLabel('relationships')).toBe('Relationships')
  })

  it('returns "Health & Energy" for "health"', () => {
    expect(categoryLabel('health')).toBe('Health & Energy')
  })

  it('returns "Identity & Purpose" for "identity"', () => {
    expect(categoryLabel('identity')).toBe('Identity & Purpose')
  })

  it('returns "Leadership" for "leadership"', () => {
    expect(categoryLabel('leadership')).toBe('Leadership')
  })

  it('returns "Life Transitions" for "transitions"', () => {
    expect(categoryLabel('transitions')).toBe('Life Transitions')
  })

  it('returns "Intuition" for "intuition"', () => {
    expect(categoryLabel('intuition')).toBe('Intuition')
  })

  it('returns "Vitality & Longevity" for "vitality"', () => {
    expect(categoryLabel('vitality')).toBe('Vitality & Longevity')
  })
})