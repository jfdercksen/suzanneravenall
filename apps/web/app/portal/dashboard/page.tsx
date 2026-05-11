import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import DashboardContent from './DashboardContent'

export const metadata = {
  title: 'Dashboard | Member Portal',
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/portal/login')
  }

  // Fetch the member's active subscription with tier details
  const { data: subscription } = await supabase
    .from('member_subscriptions')
    .select('tier_id, status, membership_tiers(name, slug)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const tier = subscription?.membership_tiers as
    | { name: string; slug: string }
    | null
    | undefined
  const tierName = tier?.name ?? 'Free Member'
  const tierSlug = tier?.slug ?? 'free'

  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? ''

  return (
    <DashboardContent
      firstName={firstName}
      tierName={tierName}
      tierSlug={tierSlug}
    />
  )
}
