import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchAllPublishedPosts, fetchPostBySlug } from './posts'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const page = (n: number, count: number, hasNextPage: boolean) => ({
  ok: true,
  json: async () => ({
    docs: Array.from({ length: count }, (_, i) => ({ id: `${n}-${i}`, slug: `post-${n}-${i}` })),
    hasNextPage,
  }),
})

describe('blog posts from Payload', () => {
  it('reads the API under /cms (the old /api URL answered 404)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(page(1, 1, false))
    vi.stubGlobal('fetch', fetchMock)
    await fetchAllPublishedPosts()
    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/^http:\/\/payload:3001\/cms\/api\/blog-posts\?/)
  })

  it('reads every page, newest first, so 158 posts all arrive', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(page(1, 100, true)).mockResolvedValueOnce(page(2, 58, false))
    vi.stubGlobal('fetch', fetchMock)
    const posts = await fetchAllPublishedPosts()
    expect(posts).toHaveLength(158)
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('page=2')
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('sort=-publishedAt')
  })

  it('returns what it has when Payload fails part way, and nothing when it is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(page(1, 100, true)).mockResolvedValueOnce({ ok: false }))
    expect(await fetchAllPublishedPosts()).toHaveLength(100)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
    expect(await fetchAllPublishedPosts()).toEqual([])
  })

  it('limits the listing read to the fields its cards use', async () => {
    const fetchMock = vi.fn().mockResolvedValue(page(1, 1, false))
    vi.stubGlobal('fetch', fetchMock)
    await fetchAllPublishedPosts(1, 300, ['title', 'slug'])
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('&select[title]=true&select[slug]=true')
  })

  it('looks a post up by its encoded slug', async () => {
    const fetchMock = vi.fn().mockResolvedValue(page(1, 1, false))
    vi.stubGlobal('fetch', fetchMock)
    expect((await fetchPostBySlug('a b'))?.slug).toBe('post-1-0')
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('where[slug][equals]=a%20b')
  })
})
