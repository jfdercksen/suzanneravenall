import { describe, expect, it } from 'vitest'
import { FEATURED_MEDIA_ARTICLES, MEDIA_ARTICLES } from './mediaArticles'

// KI025: the old WordPress site lives at suzanneravenall.com until DNS
// cutover, after which any link into its URL structure breaks or bounces
// through the `/article-:slug*` -> /blog catch-all redirect.
// ravenallinstitute.com is a separate WordPress site that is NOT cut over,
// so its /wp-content/ PDF scans are safe destinations (sourcing, 6 Oct).
const OLD_WP_PATTERNS = [
  /suzanneravenall\.com/i,
  /^(?!https:\/\/ravenallinstitute\.com\/).*\/wp-content\//i,
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

  // Sourced 6 Oct (content-sourcing-2026-10-06.md section 3): every entry
  // links its PDF scan on ravenallinstitute.com, which survives cutover.
  it('links every article to its PDF scan on ravenallinstitute.com', () => {
    for (const a of MEDIA_ARTICLES) {
      expect(a.status, a.title).toBe('external')
      expect(a.href, a.title).toMatch(
        /^https:\/\/ravenallinstitute\.com\/wp-content\/uploads\/2021\/12\/.+\.pdf$/,
      )
    }
  })

  it('carries no unsourced dates or descriptions', () => {
    for (const a of MEDIA_ARTICLES) {
      expect(a.date, a.title).toBeUndefined()
      expect(a.description, a.title).toBeUndefined()
    }
  })

  it('keeps the six original cards featured on /resources/media', () => {
    expect(FEATURED_MEDIA_ARTICLES).toHaveLength(6)
  })
})
