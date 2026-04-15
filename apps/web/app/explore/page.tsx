import type { Metadata } from 'next'
import ExploreHero from '@/components/explore/ExploreHero'
import ExploreTopicGrid from '@/components/explore/ExploreTopicGrid'
import ExploreFinalCTA from '@/components/explore/ExploreFinalCTA'

export function generateMetadata(): Metadata {
  return {
    title: 'Explore | Every Area of Your Life, Transformed | Dr. Suzanne Ravenall',
    description:
      'Pattern-based transformation across the areas that shape your life — emotions, relationships, health, leadership, identity and purpose.',
  }
}

export default function ExplorePage() {
  return (
    <main>
      <ExploreHero />
      <ExploreTopicGrid />
      <ExploreFinalCTA />
    </main>
  )
}
