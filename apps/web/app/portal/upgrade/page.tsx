import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { getMemberAccessLevel } from '@/lib/access/check-access'
import type { MembershipTrack } from '@/lib/access/tiers'
import { membershipsEnabled } from '@/lib/access/memberships'
import { NOT_FOUND_TITLE } from '@/lib/seo/notFoundTitle'
import UpgradeContent from './UpgradeContent'

// While memberships are off the page is the 404 page, tab title included (KI071).
export function generateMetadata(): Metadata {
  return membershipsEnabled()
    ? { title: 'Upgrade Membership | Member Portal' }
    : { title: { absolute: NOT_FOUND_TITLE }, robots: { index: false } }
}

const FROM_LABELS: Record<string, string> = {
  '/resources/media': 'the Media Library',
  '/resources/articles': 'Articles & Publications',
  '/resources/assessments': 'Assessments',
  '/portal/resources': 'the Resource Library',
  '/portal/videos': 'the Video Library',
}

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  if (!membershipsEnabled()) notFound()

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentAccessLevel = 1
  let currentTrack: MembershipTrack | 'both' = 'general'
  let currentSku: string | null = null
  let currentTierName = 'Guest Membership'

  if (user) {
    const accessInfo = await getMemberAccessLevel(supabase)
    currentAccessLevel = accessInfo.accessLevel
    currentTrack = accessInfo.track
    currentSku = accessInfo.sku

    // Resolve display name from membership_tiers relation
    const { data: sub } = await supabase
      .from('member_subscriptions')
      .select('membership_tiers(name)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    const tierData = (sub as { membership_tiers: { name: string } | null } | null)
      ?.membership_tiers
    if (tierData?.name) currentTierName = tierData.name
  }

  const { from } = await searchParams
  const safePath = from && from.startsWith('/') ? decodeURIComponent(from) : null
  const fromLabel = safePath ? (FROM_LABELS[safePath] ?? null) : null

  return (
    <UpgradeContent
      currentAccessLevel={currentAccessLevel}
      currentTrack={currentTrack}
      currentSku={currentSku}
      currentTierName={currentTierName}
      fromLabel={fromLabel}
    />
  )
}
