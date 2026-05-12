import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getMemberTier } from '@/lib/access/check-access'
import VideosContent, { type VideoRow } from './VideosContent'

export const metadata = {
  title: 'Video Library | Member Portal',
}

export default async function PortalVideosPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/portal/login?redirect=/portal/videos')
  }

  const [tier, { data: videos }] = await Promise.all([
    getMemberTier(supabase),
    supabase
      .from('video_content')
      .select(
        'id, bunny_video_id, title, description, duration_seconds, category, resource_key, status, thumbnail_url, sort_order',
      )
      .eq('status', 'ready')
      .order('sort_order', { ascending: true }),
  ])

  return <VideosContent tier={tier} videos={(videos as VideoRow[]) ?? []} />
}
