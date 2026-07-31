import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { getMemberTier } from '@/lib/access/check-access'
import { type TierSlug } from '@/lib/access/tiers'
import ResourcesHero from '@/components/resources/ResourcesHero'
import ResourcesCategories from '@/components/resources/ResourcesCategories'
import MemberResourcesSection from '@/components/resources/MemberResourcesSection'
import ResourcesFeaturedMedia from '@/components/resources/ResourcesFeaturedMedia'
import ResourcesFeaturedAwards from '@/components/resources/ResourcesFeaturedAwards'
import ResourcesNewsletterCTA from '@/components/resources/ResourcesNewsletterCTA'

export function generateMetadata(): Metadata {
  return {
    title: 'Resources | Articles, Media, Awards & Newsletter | Dr. Suzanne Ravenall',
    description:
      'Explore Dr. Suzanne Ravenall\'s resources hub: published articles, media appearances, awards and the monthly insights newsletter covering transformation, consciousness and human potential.',
  }
}

export default async function ResourcesPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let tier: TierSlug | null = null
  if (user) {
    tier = await getMemberTier(supabase)
  }

  return (
    <main>
      <ResourcesHero />
      <ResourcesCategories />
      <MemberResourcesSection tier={tier} />
      <ResourcesFeaturedMedia />
      <ResourcesFeaturedAwards />
      <ResourcesNewsletterCTA />
    </main>
  )
}
