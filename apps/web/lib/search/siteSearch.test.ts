import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  PAGE_DOCUMENTS,
  TOPIC_DOCUMENTS,
  blogPostToDocument,
  fetchBlogDocuments,
  highlight,
  searchDocuments,
  stem,
  type SiteDocument,
} from './siteSearch'
import { shareLimit, resultBadge } from './utils'

describe('stem', () => {
  it('brings anxious and anxiety to the same stem', () => {
    expect(stem('anxious')).toBe(stem('anxiety'))
    expect(stem('anxiously')).toBe(stem('anxiety'))
  })

  it('folds plurals and common endings', () => {
    expect(stem('relationships')).toBe(stem('relationship'))
    expect(stem('leaders')).toBe('lead')
    expect(stem('leading')).toBe('lead')
    expect(stem('stress')).toBe('stress')
  })
})

describe('searchDocuments over topic page copy (site check C21)', () => {
  it('finds the emotional mastery topic for "anxiety" and "anxious"', () => {
    for (const q of ['anxiety', 'anxious']) {
      const urls = searchDocuments(TOPIC_DOCUMENTS, q, 10).map((r) => r.url)
      expect(urls).toContain('/explore/emotional-nervous-system-mastery')
    }
  })

  it('shows the matching body passage, highlighted, when the one-liner does not match', () => {
    const [hit] = searchDocuments(TOPIC_DOCUMENTS, 'anxiety', 10).filter(
      (r) => r.url === '/explore/emotional-nervous-system-mastery'
    )
    expect(hit!.subtitle).toMatch(/<mark>anxiety<\/mark>/i)
    expect(hit!.label).toBe('Topic')
  })

  it('needs every meaningful query word to match, ignoring stop words', () => {
    expect(searchDocuments(TOPIC_DOCUMENTS, 'anxiety zzqx', 10)).toHaveLength(0)
    expect(searchDocuments(TOPIC_DOCUMENTS, 'the anxiety', 10).length).toBeGreaterThan(0)
  })

  it('ranks a title match above a body match', () => {
    const [first] = searchDocuments(TOPIC_DOCUMENTS, 'leadership', 10)
    expect(first!.url).toBe('/explore/leadership-high-performance')
  })
})

describe('searchDocuments over pages', () => {
  it('finds the services, about and blog pages', () => {
    expect(searchDocuments(PAGE_DOCUMENTS, 'services', 10).map((r) => r.url)).toContain('/services')
    expect(searchDocuments(PAGE_DOCUMENTS, 'about', 10).map((r) => r.url)).toContain('/about')
    expect(searchDocuments(PAGE_DOCUMENTS, 'blog', 10).map((r) => r.url)).toContain('/blog')
  })

  it('finds private session pages by their body copy', () => {
    const urls = searchDocuments(PAGE_DOCUMENTS, 'executive coaching', 10).map((r) => r.url)
    expect(urls).toContain('/services/private-sessions/executive-coaching')
  })

  it('escapes markup in document text', () => {
    const doc: SiteDocument = {
      type: 'pages',
      id: 'x',
      url: '/x',
      label: 'Page',
      title: 'Calm <script>',
      description: 'Calm & clear',
      body: [],
    }
    const [hit] = searchDocuments([doc], 'calm', 1)
    expect(hit!.title).toBe('<mark>Calm</mark> &lt;script&gt;')
    expect(hit!.subtitle).toBe('<mark>Calm</mark> &amp; clear')
  })
})

describe('highlight', () => {
  it('marks words matching a query stem, including variants', () => {
    expect(highlight('Anxious minds', ['anxi'])).toBe('<mark>Anxious</mark> minds')
  })
})

describe('blog documents', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('indexes the title, description, tags and rich-text body of a post', () => {
    const doc = blogPostToDocument({
      id: '7',
      slug: 'calm-mind',
      title: 'A calm mind',
      isPublished: true,
      seoDescription: 'On regulation',
      tags: [{ id: 't', tag: 'nervous system' }],
      content: { root: { children: [{ children: [{ text: 'Breathing resets the body.' }] }] } },
    })
    expect(doc.url).toBe('/blog/calm-mind')
    expect(doc.label).toBe('Article')
    expect(doc.body).toEqual(['nervous system', 'Breathing resets the body.'])
    expect(searchDocuments([doc], 'breathing', 5)).toHaveLength(1)
  })

  it('returns no documents when Payload is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))
    await expect(fetchBlogDocuments()).resolves.toEqual([])
  })
})

describe('shareLimit', () => {
  it('splits evenly and hands unused slots to the other groups', () => {
    expect(shareLimit([[1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12]], 4)).toEqual([[1, 2], [7, 8]])
    expect(shareLimit([[1], [2, 3, 4, 5], [6, 7]], 5)).toEqual([[1], [2, 3], [6, 7]])
    expect(shareLimit([[], [1, 2, 3]], 2)).toEqual([[], [1, 2]])
  })
})

describe('resultBadge', () => {
  it('prefers the result label and falls back to the result type', () => {
    expect(resultBadge({ type: 'pages', label: 'Article' })).toBe('Article')
    expect(resultBadge({ type: 'explore_topics' })).toBe('Topic')
  })
})
