import { describe, expect, it } from 'vitest'
import { FEATURED_MEDIA_ARTICLES, MEDIA_ARTICLES } from './mediaArticles'

// KI025: the old WordPress site lives at suzanneravenall.com until DNS
// cutover, after which any link into its URL structure breaks or bounces
// through the `/article-:slug*` -> /blog catch-all redirect.
const OLD_WP_PATTERNS = [
  /suzanneravenall\.com/i,
  /\/wp-content\//i,
  /\/wp-json\//i,
  /[?&]p=\d+/,
]

describe('media articles data', () => {
  it('renders no href pointing at the old WordPress site', () => {
    const offenders = MEDIA_ARTICLES.filter(
      (a) => a.href && OLD_WP_PATTERNS.some((re) => re.test(a.href!)),
    ).map((a) => a.title)
    expect(offenders).toEqual([])
  })

  it('gives every needs-content-decision entry no rendered href', () => {
    const offenders = MEDIA_ARTICLES.filter(
      (a) => a.status === 'needs-content-decision' && a.href !== undefined,
    ).map((a) => a.title)
    expect(offenders).toEqual([])
  })

  it('gives every external entry a live absolute href', () => {
    const offenders = MEDIA_ARTICLES.filter(
      (a) => a.status === 'external' && !a.href?.startsWith('https://'),
    ).map((a) => a.title)
    expect(offenders).toEqual([])
  })

  it('preserves the legacy WordPress URL on every entry for restorability', () => {
    for (const a of MEDIA_ARTICLES) {
      expect(a.legacyHref, a.title).toMatch(
        /^https:\/\/suzanneravenall\.com\/article-/,
      )
    }
  })

  it('has unique titles and legacy URLs', () => {
    const titles = MEDIA_ARTICLES.map((a) => a.title)
    const legacy = MEDIA_ARTICLES.map((a) => a.legacyHref)
    expect(new Set(titles).size).toBe(titles.length)
    expect(new Set(legacy).size).toBe(legacy.length)
  })

  it('keeps the six original cards featured on /resources/media', () => {
    expect(FEATURED_MEDIA_ARTICLES).toHaveLength(6)
  })
})
