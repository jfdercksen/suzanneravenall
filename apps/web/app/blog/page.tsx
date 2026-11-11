import type { Metadata } from 'next'
import BlogListingContent from './BlogListingContent'
import { LISTING_FIELDS, fetchAllPublishedPosts } from '@/lib/blog/posts'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Science-backed perspectives on transformation, pattern mastery, and the art of lasting change, from Dr. Suzanne Ravenall.',
}

type Props = { searchParams: Promise<{ tag?: string | string[] }> }

export default async function BlogPage({ searchParams }: Props) {
  const [posts, { tag }] = await Promise.all([fetchAllPublishedPosts(1, 300, LISTING_FIELDS), searchParams])
  // /blog?tag=newsletter opens the newsletters (linked from /resources).
  const initialTag = typeof tag === 'string' ? tag : undefined
  return <BlogListingContent posts={posts} initialTag={initialTag} />
}
