import type { Metadata } from 'next'
import BlogListingContent from './BlogListingContent'
import type { BlogPost, PayloadResponse } from '@/types/payload'

export const metadata: Metadata = {
  title: 'Blog | Dr. Suzanne Ravenall',
  description:
    'Science-backed perspectives on transformation, pattern mastery, and the art of lasting change, from Dr. Suzanne Ravenall.',
}

async function fetchPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(
      'http://payload:3001/api/blog-posts?where[isPublished][equals]=true&limit=100&page=1&depth=1',
      {
        next: { revalidate: 300 },
      }
    )
    if (!res.ok) return []
    const data: PayloadResponse<BlogPost> = await res.json()
    return data.docs ?? []
  } catch {
    // Payload CMS may not be running during development — degrade gracefully
    return []
  }
}

export default async function BlogPage() {
  const posts = await fetchPosts()

  return <BlogListingContent posts={posts} />
}
