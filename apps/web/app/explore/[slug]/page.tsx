import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { topics, topicBySlug } from '@/app/explore/topics'
import TopicHero from '@/components/explore/TopicHero'
import TopicOverview from '@/components/explore/TopicOverview'
import TopicDiscover from '@/components/explore/TopicDiscover'
import TopicApproach from '@/components/explore/TopicApproach'
import TopicRelated from '@/components/explore/TopicRelated'
import TopicCTA from '@/components/explore/TopicCTA'

// In Next.js 14 App Router, params is a Promise in dynamic routes.
type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams(): Array<{ slug: string }> {
  return topics.map((topic) => ({ slug: topic.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const topic = topicBySlug(slug)
  if (!topic) {
    return { title: 'Explore | Dr. Suzanne Ravenall' }
  }
  return {
    title: topic.metaTitle,
    description: topic.metaDescription,
  }
}

export default async function TopicPage({ params }: PageProps) {
  const { slug } = await params
  const topic = topicBySlug(slug)

  // notFound() throws — TypeScript doesn't narrow past it, so we assert below.
  if (!topic) notFound()

  return (
    <main>
      <TopicHero topic={topic!} />
      <TopicOverview topic={topic!} />
      <TopicDiscover topic={topic!} />
      <TopicApproach topic={topic!} />
      <TopicRelated slug={topic!.slug} />
      <TopicCTA topic={topic!} />
    </main>
  )
}
