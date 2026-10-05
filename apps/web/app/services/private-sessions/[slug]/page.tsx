import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { allPrivateSessions, privateSessionBySlug } from '@/data/privateSessions'
import PrivateSessionDetail from '@/components/services/PrivateSessionDetail'

// In Next.js 15 App Router, params is a Promise in dynamic routes.
type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams(): Array<{ slug: string }> {
  return allPrivateSessions.map((session) => ({ slug: session.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const session = privateSessionBySlug(slug)
  if (!session) notFound()
  return {
    title: `${session.title} | Private Sessions`,
    description: session.shortDescription,
  }
}

export default async function PrivateSessionPage({ params }: PageProps) {
  const { slug } = await params
  const session = privateSessionBySlug(slug)

  if (!session) notFound()

  return <PrivateSessionDetail session={session} />
}
