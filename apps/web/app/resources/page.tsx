import type { Metadata } from 'next'
import ResourcesHero from '@/components/resources/ResourcesHero'
import ResourcesCategories from '@/components/resources/ResourcesCategories'
import ResourcesFeaturedMedia from '@/components/resources/ResourcesFeaturedMedia'
import ResourcesFeaturedAwards from '@/components/resources/ResourcesFeaturedAwards'
import ResourcesNewsletterCTA from '@/components/resources/ResourcesNewsletterCTA'

export function generateMetadata(): Metadata {
  return {
    title: 'Resources | Articles, Media, Awards & Newsletter — Dr. Suzanne Ravenall',
    description:
      'Explore Dr. Suzanne Ravenall\'s resources hub — published articles, media appearances, awards and the monthly insights newsletter covering transformation, consciousness and human potential.',
  }
}

export default function ResourcesPage() {
  return (
    <main>
      <ResourcesHero />
      <ResourcesCategories />
      <ResourcesFeaturedMedia />
      <ResourcesFeaturedAwards />
      <ResourcesNewsletterCTA />
    </main>
  )
}
