import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BlogPostContent from './BlogPostContent'
import type { BlogPost, PayloadResponse } from '@/types/payload'

async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(
      `http://payload:3001/api/blog-posts?where[slug][equals]=${encodeURIComponent(slug)}&where[isPublished][equals]=true&depth=1`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return null
    const data: PayloadResponse<BlogPost> = await res.json()
    return data.docs?.[0] ?? null
  } catch {
    return null
  }
}

async function fetchRelatedPosts(excludeId: string): Promise<BlogPost[]> {
  try {
    const res = await fetch(
      `http://payload:3001/api/blog-posts?where[isPublished][equals]=true&where[id][not_equals]=${excludeId}&limit=3&depth=1`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return []
    const data: PayloadResponse<BlogPost> = await res.json()
    return data.docs ?? []
  } catch {
    return []
  }
}

async function fetchAllSlugs(): Promise<string[]> {
  try {
    const res = await fetch(
      'http://payload:3001/api/blog-posts?where[isPublished][equals]=true&limit=200&depth=0',
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data: PayloadResponse<BlogPost> = await res.json()
    return data.docs?.map((p) => p.slug).filter((s): s is string => Boolean(s)) ?? []
  } catch {
    return []
  }
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await fetchAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await fetchPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? '',
    openGraph: {
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? '',
      type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author ? [post.author] : undefined,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await fetchPostBySlug(slug)

  // Check immediately — do not await related posts if post is missing
  if (!post) return notFound()

  const relatedPosts = await fetchRelatedPosts(post.id)

  return <BlogPostContent post={post} relatedPosts={relatedPosts} />
}
