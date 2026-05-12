import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import AccountContent from './AccountContent'

export const metadata = {
  title: 'My Account | Member Portal',
}

export default async function AccountPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/portal/login?redirect=/portal/account')
  }

  const { data: subscription } = await supabase
    .from('member_subscriptions')
    .select('tier_id, status, start_date, end_date, membership_tiers(name, slug)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const subscriptionData = subscription as
    | {
        tier_id: string
        status: string
        start_date?: string
        end_date?: string
        membership_tiers: { name: string; slug: string } | null
      }
    | null
    | undefined

  const tier = subscriptionData?.membership_tiers
  const tierName = tier?.name ?? 'Free Member'

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? ''
  const nameParts = fullName.trim().split(/\s+/)
  const firstName = nameParts[0] ?? ''
  const lastName = nameParts.slice(1).join(' ')
  const phone = (user.user_metadata?.phone as string | undefined) ?? ''

  return (
    <AccountContent
      email={user.email ?? ''}
      firstName={firstName}
      lastName={lastName}
      phone={phone}
      tierName={tierName}
      memberSince={subscriptionData?.start_date ?? user.created_at ?? null}
      memberUntil={subscriptionData?.end_date ?? null}
    />
  )
}
