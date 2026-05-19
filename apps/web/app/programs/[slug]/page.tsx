import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PROGRAMS, getProgramBySlug, getProgramsByCategory } from '@/data/programs'
import ProgramDetailClient from './ProgramDetailClient'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return PROGRAMS.filter((p) => p.isPublished).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const program = getProgramBySlug(slug)
  if (!program) return { title: 'Programme Not Found | Dr. Suzanne Ravenall' }
  return {
    title: `${program.name} | Dr. Suzanne Ravenall`,
    description: program.shortDescription,
  }
}

export default async function ProgramDetailPage({ params }: Props) {
  const { slug } = await params
  const program = getProgramBySlug(slug)
  if (!program || !program.isPublished) return notFound()

  const related = getProgramsByCategory(program.category)
    .filter((p) => p.slug !== slug)
    .slice(0, 3)

  return <ProgramDetailClient program={program} relatedPrograms={related} />
}
