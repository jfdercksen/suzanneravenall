import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getMemberTier } from '@/lib/access/check-access'
import { type TierSlug } from '@/lib/access/tiers'
import UpgradeContent from './UpgradeContent'

export const metadata = {
  title: 'Upgrade Membership | Member Portal',
}

const FROM_LABELS: Record<string, string> = {
  '/resources/media': 'the Media Library',
  '/resources/assessments': 'Assessments',
  '/portal/resources': 'the Resource Library',
  '/portal/videos': 'the Video Library',
}

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const tier: TierSlug = user ? await getMemberTier(supabase) : 'free'

  const { from } = await searchParams
  // Only accept relative paths to prevent open-redirect abuse via the `from` param
  const safePath = from && from.startsWith('/') ? decodeURIComponent(from) : null
  const fromLabel = safePath ? (FROM_LABELS[safePath] ?? null) : null

  return <UpgradeContent currentTier={tier} fromLabel={fromLabel} />
}
