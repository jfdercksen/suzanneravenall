import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getMemberTier } from '@/lib/access/check-access'
import ResourcesContent from './ResourcesContent'

export const metadata = {
  title: 'Resource Library | Member Portal',
}

export default async function PortalResourcesPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/portal/login?redirect=/portal/resources')
  }

  const tier = await getMemberTier(supabase)

  return <ResourcesContent tier={tier} />
}
