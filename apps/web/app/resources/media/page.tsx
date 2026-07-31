import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { requireAccess } from '@/lib/access/check-access'
import MediaContent from '@/components/resources/MediaContent'

export function generateMetadata(): Metadata {
  return {
    title: 'Media & Press | Dr. Suzanne Ravenall',
    description:
      'Dr. Suzanne Ravenall featured in Leadership Magazine, CEO Magazine and Business Excellence Award press. Read the coverage.',
  }
}

export default async function MediaPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  await requireAccess(supabase, 'resources_media', '/resources/media')

  return <MediaContent />
}
