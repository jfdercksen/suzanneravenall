import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { pathways, pathwayBySlug } from '@/data/pathways'
import PathwayDetail from '@/components/pathways/PathwayDetail'

// In Next.js 14 App Router, params is a Promise in dynamic routes.
type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams(): Array<{ slug: string }> {
  return pathways.map((pathway) => ({ slug: pathway.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const pathway = pathwayBySlug(slug)
  if (!pathway) {
    return { title: 'Transformation Pathways | Dr. Suzanne Ravenall' }
  }
  return {
    title: `${pathway.title} | Transformation Pathways | Dr. Suzanne Ravenall`,
    description: pathway.description,
  }
}

export default async function PathwayPage({ params }: PageProps) {
  const { slug } = await params
  const pathway = pathwayBySlug(slug)

  if (!pathway) notFound()

  return <PathwayDetail pathway={pathway} />
}
