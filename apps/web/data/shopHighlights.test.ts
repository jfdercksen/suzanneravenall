import { describe, it, expect, afterEach } from 'vitest'
import {
  getHighlightBadge,
  CURATED_HIGHLIGHTS,
  type HighlightBadgeType,
} from './shopHighlights'

function makeProduct(overrides: {
  handle?: string
  metadata?: Record<string, unknown> | null
} = {}) {
  return {
    handle: overrides.handle ?? 'some-programme',
    metadata: overrides.metadata,
  }
}

describe('getHighlightBadge', () => {
  afterEach(() => {
    // Tests below temporarily add curated entries — always restore the
    // shipped state (empty map, no default badges).
    for (const key of Object.keys(CURATED_HIGHLIGHTS)) {
      delete CURATED_HIGHLIGHTS[key]
    }
  })

  it('returns Most Popular when metadata.badge is most_popular', () => {
    const badge = getHighlightBadge(makeProduct({ metadata: { badge: 'most_popular' } }))
    expect(badge).toEqual({ type: 'most_popular', label: 'Most Popular' })
  })

  it('returns Recommended when metadata.badge is recommended', () => {
    const badge = getHighlightBadge(makeProduct({ metadata: { badge: 'recommended' } }))
    expect(badge).toEqual({ type: 'recommended', label: 'Recommended' })
  })

  it('returns null when metadata has no badge key', () => {
    expect(getHighlightBadge(makeProduct({ metadata: { other: 'x' } }))).toBeNull()
  })

  it('returns null for unknown badge values — never invents a badge', () => {
    expect(getHighlightBadge(makeProduct({ metadata: { badge: 'bestseller' } }))).toBeNull()
    expect(getHighlightBadge(makeProduct({ metadata: { badge: 1 } }))).toBeNull()
    expect(getHighlightBadge(makeProduct({ metadata: { badge: null } }))).toBeNull()
  })

  it('returns null when metadata is null or absent and nothing is curated', () => {
    expect(getHighlightBadge(makeProduct({ metadata: null }))).toBeNull()
    expect(getHighlightBadge(makeProduct())).toBeNull()
  })

  it('ships with an empty curated map — no default highlights', () => {
    expect(Object.keys(CURATED_HIGHLIGHTS)).toHaveLength(0)
  })

  it('falls back to the curated map by handle when metadata is absent', () => {
    CURATED_HIGHLIGHTS['curated-programme'] = 'recommended' as HighlightBadgeType
    const badge = getHighlightBadge(makeProduct({ handle: 'curated-programme' }))
    expect(badge).toEqual({ type: 'recommended', label: 'Recommended' })

    // Uncurated handle still renders nothing
    expect(getHighlightBadge(makeProduct({ handle: 'other-programme' }))).toBeNull()
  })

  it('prefers metadata over the curated map when both are present', () => {
    CURATED_HIGHLIGHTS['curated-programme'] = 'recommended' as HighlightBadgeType
    const badge = getHighlightBadge(
      makeProduct({ handle: 'curated-programme', metadata: { badge: 'most_popular' } })
    )
    expect(badge).toEqual({ type: 'most_popular', label: 'Most Popular' })
  })
})
