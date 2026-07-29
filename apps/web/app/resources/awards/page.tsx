import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { requireAccess } from '@/lib/access/check-access'
import AwardsContent from '@/components/resources/AwardsContent'

export function generateMetadata(): Metadata {
  return {
    title: 'Awards & Honours | Dr. Suzanne Ravenall',
    description:
      'Dr. Suzanne Ravenall and the Ravenall Institute — recognised with Global 100, CRF and Healthcare & Pharmaceutical Excellence Awards.',
  }
}

export default async function AwardsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  await requireAccess(supabase, 'resources_awards', '/resources/awards')

  return <AwardsContent />
}
