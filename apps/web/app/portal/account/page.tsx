import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getMemberAccessLevel } from '@/lib/access/check-access'
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

  const [subscriptionResult, accessInfo] = await Promise.all([
    supabase
      .from('member_subscriptions')
      .select('start_date, end_date, annual_renewal_date, membership_tiers(name, slug)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    getMemberAccessLevel(supabase),
  ])

  type SubRow = {
    start_date?: string
    end_date?: string
    annual_renewal_date?: string
    membership_tiers: { name: string; slug: string } | null
  }
  const subscriptionData = subscriptionResult.data as SubRow | null | undefined

  const tier = subscriptionData?.membership_tiers
  const tierName = tier?.name ?? 'Guest Membership'
  const memberUntil = subscriptionData?.annual_renewal_date ?? subscriptionData?.end_date ?? null

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
      sku={accessInfo.sku}
      track={accessInfo.track}
      accessLevel={accessInfo.accessLevel}
      memberSince={subscriptionData?.start_date ?? user.created_at ?? null}
      memberUntil={memberUntil}
    />
  )
}
