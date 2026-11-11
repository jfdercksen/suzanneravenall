import { payloadBaseUrl } from '@/lib/intake/forms'
import type { BlogPost, PayloadResponse } from '@/types/payload'

/**
 * Blog posts from Payload over the internal network. Payload runs under
 * basePath /cms, so the REST API is /cms/api (the old /api URL answered 404,
 * which is why the blog showed no posts). Never throws: Payload being down
 * shows an empty blog, not an error page.
 */

/** Payload's page size for the reads below; the listing pages its cards itself. */
export const PAYLOAD_PAGE_SIZE = 100
/** Stop after this many pages (10,000 posts) so a bad response cannot loop. */
const MAX_PAGES = 100

const published = 'where[isPublished][equals]=true'

async function getJson<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${payloadBaseUrl()}/api/${path}`, { next: { revalidate } })
    if (!res?.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

/** The fields the listing cards use: no bodies, so the read stays small and cacheable. */
export const LISTING_FIELDS = ['title', 'slug', 'tags', 'publishedAt', 'seoDescription', 'featuredImage', 'author']

/**
 * Every published post, newest first, read page by page. `fields` limits the
 * read (Payload select); omit it for full documents.
 */
export async function fetchAllPublishedPosts(depth = 1, revalidate = 300, fields?: string[]): Promise<BlogPost[]> {
  const select = (fields ?? []).map((f) => `&select[${f}]=true`).join('')
  const posts: BlogPost[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await getJson<Partial<PayloadResponse<BlogPost>>>(
      `blog-posts?${published}&sort=-publishedAt&limit=${PAYLOAD_PAGE_SIZE}&page=${page}&depth=${depth}${select}`,
      revalidate,
    )
    if (!data || !Array.isArray(data.docs)) break
    posts.push(...data.docs)
    if (!data.hasNextPage) break
  }
  return posts
}

/** One published post by slug, with its media populated. */
export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  const data = await getJson<Partial<PayloadResponse<BlogPost>>>(
    `blog-posts?where[slug][equals]=${encodeURIComponent(slug)}&${published}&depth=1&limit=1`,
    300,
  )
  return data?.docs?.[0] ?? null
}

/** The newest published posts other than one, for "Related posts". */
export async function fetchRelatedPosts(excludeId: string, limit = 3): Promise<BlogPost[]> {
  const data = await getJson<Partial<PayloadResponse<BlogPost>>>(
    `blog-posts?${published}&where[id][not_equals]=${encodeURIComponent(excludeId)}&sort=-publishedAt&limit=${limit}&depth=1`,
    300,
  )
  return data?.docs ?? []
}
