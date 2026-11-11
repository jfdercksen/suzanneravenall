import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BlogPostContent from './BlogPostContent'
import { fetchAllPublishedPosts, fetchPostBySlug, fetchRelatedPosts } from '@/lib/blog/posts'

async function fetchAllSlugs(): Promise<string[]> {
  const posts = await fetchAllPublishedPosts(0, 3600, ['slug'])
  return posts.map((p) => p.slug).filter((s): s is string => Boolean(s))
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
  if (!post) notFound()

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
