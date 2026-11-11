import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { APP_ROUTES, blogSlug, decide, mediaFilename, redirectSource, redirectSources } from './migrate-wordpress'

const wp = (slug: string) =>
  ({ slug }) as Parameters<typeof decide>[0]

describe('migrate-wordpress scope', () => {
  it('migrates newsletters with the newsletter tag', () => {
    expect(decide(wp('june-newsletter%e2%9c%a8inspire'), ['Newsletter'])).toEqual({ include: true, tags: ['newsletter'] })
  })

  it('skips the conference stubs and the placeholder filed under Newsletter', () => {
    expect(decide(wp('conference-sr-speaks-at-hr-afica'), ['Newsletter']).include).toBe(false)
    expect(decide(wp('blog-post-1'), ['Newsletter']).include).toBe(false)
  })

  it('migrates her written articles and skips the old site structure with a reason', () => {
    expect(decide(wp('conversations-with-my-brain'), ['Uncategorised'])).toEqual({ include: true, tags: ['article'] })
    expect(decide(wp('exploring-the-alpha-mind'), ['Uncategorized']).include).toBe(false)
    expect(decide(wp('beyond-outsourcing-2-2'), ['Beyond Outsourcing']).include).toBe(true)
    expect(decide(wp('award-ravenall-institute-global-100'), ['Awards', 'Media'])).toEqual({
      include: false,
      reason: 'award entry; listed on /resources/awards',
    })
    expect(decide(wp('getting-unstuck'), ['Uncategorized'])).toMatchObject({ include: false })
  })
})

describe('migrate-wordpress slugs and media names', () => {
  it('keeps her slug, and makes emoji slugs plain ASCII', () => {
    expect(blogSlug('achieving-work-life-balance-2')).toBe('achieving-work-life-balance-2')
    expect(blogSlug('june-newsletter%e2%9c%a8inspire-growthshape-your-future')).toBe('june-newsletter-inspire-growthshape-your-future')
  })

  it('names media the same way every run, so a re-run finds the upload', () => {
    const src = 'https://suzanneravenall.com/wp-content/uploads/2021/07/Work Life.jpg'
    expect(mediaFilename(src)).toBe(mediaFilename(src))
    expect(mediaFilename(src)).toMatch(/^wp-[0-9a-f]{10}-work-life\.jpg$/)
    expect(mediaFilename('https://x/a.png')).not.toBe(mediaFilename('https://y/a.png'))
  })
})

describe('migrate-wordpress redirects', () => {
  const appDir = join(__dirname, '..', 'app')

  it('knows every first-level route of the new site, so no redirect shadows a page', () => {
    const routes = readdirSync(appDir).filter((name) => statSync(join(appDir, name)).isDirectory() && !name.startsWith('('))
    for (const route of routes) expect(APP_ROUTES.has(route), route).toBe(true)
  })

  it('escapes path-to-regexp syntax in old URLs', () => {
    expect(redirectSource('/a-(b):c')).toBe('/a-\\(b\\)\\:c')
    expect(redirectSource('/june-newsletter\u2728inspire')).toBe('/june-newsletter\u2728inspire')
  })

  it('matches emoji paths as browsers send them: encoded, in both hex cases', () => {
    expect(redirectSources('/june-newsletter\u2728inspire')).toEqual([
      '/june-newsletter%E2%9C%A8inspire',
      '/june-newsletter%e2%9c%a8inspire',
    ])
    expect(redirectSources('/achieving-work-life-balance-2')).toEqual(['/achieving-work-life-balance-2'])
  })

  it('the committed redirect list sends old URLs to /blog posts only and repeats no source', () => {
    const list = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'wordpress-redirects.json'), 'utf8')) as Array<{
      source: string
      destination: string
    }>
    const sources = list.map((r) => r.source)
    expect(new Set(sources).size).toBe(sources.length)
    for (const r of list) {
      expect(r.destination).toMatch(/^\/blog\/[a-z0-9-]+$/)
      expect(APP_ROUTES.has(r.source.split('/')[1] ?? ''), r.source).toBe(false)
    }
  })
})
