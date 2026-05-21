import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import type { TierSlug } from '@/lib/access/tiers'
import PortalNav from '@/components/portal/PortalNav'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Auth pages (login, signup, forgot-password, reset-password) should be
    // full-screen cinematic dark — no public site header or footer visible.
    // The fixed overlay (z-[100] > header z-50) covers the marketing nav cleanly.
    // The <style> tag prevents body scroll on mobile so the public footer (rendered
    // by the root layout in the document flow) cannot be scrolled into view.
    return (
      <>
        <style>{`html, body { overflow: hidden !important; }`}</style>
        <div className="fixed inset-0 z-[100] bg-brand-primary overflow-auto">
          {children}
        </div>
      </>
    )
  }

  // Inline the tier fetch to reuse the confirmed user — avoids a second getUser() round-trip
  const { data: subscription } = await supabase
    .from('member_subscriptions')
    .select('membership_tiers(slug)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const tierSlug = (subscription?.membership_tiers as { slug: string } | null)?.slug
  const tier: TierSlug =
    tierSlug === 'silver' || tierSlug === 'gold' || tierSlug === 'practitioner'
      ? tierSlug
      : 'free'

  return (
    <>
      <PortalNav tier={tier} />
      {/* Content offset: right of sidebar on lg, above mobile bottom nav */}
      <div className="lg:pl-64 pb-20 lg:pb-0">
        {children}
      </div>
    </>
  )
}
