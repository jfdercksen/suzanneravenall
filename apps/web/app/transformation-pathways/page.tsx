import type { Metadata } from 'next'
import PathwaysHero from '@/components/pathways/PathwaysHero'
import PathwaysIntro from '@/components/pathways/PathwaysIntro'
import PathwaysGrid from '@/components/pathways/PathwaysGrid'
import PathwaysGroupSection from '@/components/pathways/PathwaysGroupSection'
import PathwaysQuizCTA from '@/components/pathways/PathwaysQuizCTA'

export function generateMetadata(): Metadata {
  return {
    title: 'Individual & Group Transformation Pathways | Dr. Suzanne Ravenall',
    description:
      'Individual Transformation Pathways for adults and young people: focused journeys to uncover hidden patterns, interrupt old loops, and support lasting change, plus upcoming Group Transformation Pathway immersions guided live by Suzanne.',
  }
}

export default function TransformationPathwaysPage() {
  return (
    <main>
      <PathwaysHero />
      <PathwaysIntro />
      <PathwaysGrid />
      <PathwaysGroupSection />
      <PathwaysQuizCTA />
    </main>
  )
}
