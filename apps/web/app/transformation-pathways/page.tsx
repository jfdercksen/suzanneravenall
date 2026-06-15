import type { Metadata } from 'next'
import PathwaysHero from '@/components/pathways/PathwaysHero'
import PathwaysIntro from '@/components/pathways/PathwaysIntro'
import PathwaysGrid from '@/components/pathways/PathwaysGrid'
import PathwaysQuizCTA from '@/components/pathways/PathwaysQuizCTA'

export function generateMetadata(): Metadata {
  return {
    title: 'Transformation Pathways | Dr. Suzanne Ravenall',
    description:
      'Structured pathways for deep, lasting transformation — focused journeys to uncover hidden patterns, interrupt old loops, and support meaningful personal change.',
  }
}

export default function TransformationPathwaysPage() {
  return (
    <main>
      <PathwaysHero />
      <PathwaysIntro />
      <PathwaysGrid />
      <PathwaysQuizCTA />
    </main>
  )
}
