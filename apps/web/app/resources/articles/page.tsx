import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { requireAccess } from '@/lib/access/check-access'
import ArticlesContent from '@/components/resources/ArticlesContent'

export function generateMetadata(): Metadata {
  return {
    title: 'Articles & Publications',
    description:
      'Thought leadership from Dr. Suzanne Ravenall, published in CEO Magazine, Leadership Magazine and other business publications.',
  }
}

// Same gate as /resources/media: these are the same press articles, listed in
// full, so they must not be visible to more tiers than the media page is.
export default async function ArticlesPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  await requireAccess(supabase, 'resources_media', '/resources/articles')

  return <ArticlesContent />
}
