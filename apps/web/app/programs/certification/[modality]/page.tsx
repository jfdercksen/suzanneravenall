import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CERTIFICATION_PATHWAYS, getPathwayBySlug } from '@/data/certificationPathways'
import PathwayContent from './PathwayContent'

type Props = { params: Promise<{ modality: string }> }

/** Header pictures, from the site's own explore set. */
const IMAGES: Record<string, string> = {
  'rapid-repatterning': '/images/generated/explore-repatterning.webp',
  'energy-alignment-optimisation': '/images/generated/explore-energy.webp',
  'akashic-navigation': '/images/generated/explore-akashic.webp',
}

export function generateStaticParams() {
  return CERTIFICATION_PATHWAYS.map((p) => ({ modality: p.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { modality } = await params
  const pathway = getPathwayBySlug(modality)
  if (!pathway) notFound()
  return {
    title: `${pathway.name} Career & Certification Pathway`,
    description: [pathway.subtitle, pathway.tagline].map((s) => s.replace(/\.$/, '')).join('. ') + '.',
  }
}

export default async function PathwayPage({ params }: Props) {
  const { modality } = await params
  const pathway = getPathwayBySlug(modality)
  if (!pathway) notFound()
  return <PathwayContent pathway={pathway} image={IMAGES[pathway.slug] ?? '/images/generated/session-coaching.webp'} />
}
