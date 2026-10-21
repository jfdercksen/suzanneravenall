import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getMemberTier } from '@/lib/access/check-access'
import { fetchMemberProgrammes } from '@/lib/medusa/member-programmes'
import { membershipsEnabled } from '@/lib/access/memberships'
import { isFirstSession } from '@/lib/portal/welcome'
import { loadNextAppointment } from '@/lib/portal/load-appointments'
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

  const { data: subscription } = await supabase
    .from('member_subscriptions')
    .select('tier_id, status, start_date, membership_tiers(name, slug)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const subscriptionData = subscription as
    | { tier_id: string; status: string; start_date?: string; membership_tiers: { name: string; slug: string } | null }
    | null
    | undefined
  const tier = subscriptionData?.membership_tiers
  const tierName = tier?.name ?? 'Free Member'
  const tierSlug = (tier?.slug ?? 'free') as 'free' | 'silver' | 'gold' | 'practitioner'
  const memberSince = subscriptionData?.start_date ?? user.created_at ?? null

  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? ''

  // Same loader as /portal/programmes, so the count and the list agree (KI078).
  // Only a confirmed address proves ownership of the orders placed with it.
  const [programmes, nextAppointment] = await Promise.all([
    user.email && user.email_confirmed_at
      ? fetchMemberProgrammes(user.email).then((items) =>
          items.slice(0, 6).map(({ id, title, thumbnailUrl }) => ({ id, title, thumbnailUrl })),
        )
      : Promise.resolve([]),
    loadNextAppointment(supabase, user),
  ])

  return (
    <DashboardContent
      firstName={firstName}
      tierName={tierName}
      tierSlug={tierSlug}
      programmes={programmes}
      nextAppointment={nextAppointment}
      memberSince={memberSince}
      firstSession={isFirstSession(user)}
      showMemberships={membershipsEnabled()}
    />
  )
}
