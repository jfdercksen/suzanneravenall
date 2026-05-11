import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getMemberTier } from '@/lib/access/check-access'
import VideosContent from './VideosContent'

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

  const tier = await getMemberTier(supabase)

  return <VideosContent tier={tier} />
}
