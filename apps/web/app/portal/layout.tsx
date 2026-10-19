import { cookies, headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { PATHNAME_HEADER } from '@/utils/supabase/pathname'
import type { TierSlug } from '@/lib/access/tiers'
import { membershipsEnabled } from '@/lib/access/memberships'
import PortalNav from '@/components/portal/PortalNav'
import AuthOverlay from '@/components/portal/AuthOverlay'

// Pages that always render on the plain auth layout. A reset link signs the
// member in, so without this the reset form sat in the signed-in sidebar next
// to Sign Out (KI084).
const AUTH_PAGES = ['/portal/login', '/portal/signup', '/portal/forgot-password', '/portal/reset-password']

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(page + '/'))
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  // Without the header (a path the middleware does not match) this falls back
  // to the member layout, as before KI084.
  const pathname = (await headers()).get(PATHNAME_HEADER) ?? ''

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || isAuthPage(pathname)) {
    // Auth pages (login, signup, forgot-password, reset-password) should be
    // full-screen cinematic dark — no public site header or footer visible.
    // The fixed overlay (z-[100] > header z-50) covers the marketing nav cleanly.
    // The <style> tag prevents body scroll on mobile so the public footer (rendered
    // by the root layout in the document flow) cannot be scrolled into view.
    return (
      <>
        <style>{`html, body { overflow: hidden !important; }`}</style>
        {/* AuthOverlay also makes the covered site chrome inert, so Tab
            cannot reach it (site check M6). */}
        <AuthOverlay className="fixed inset-0 z-[100] bg-brand-primary overflow-auto">
          {children}
        </AuthOverlay>
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
      <PortalNav tier={tier} showTier={membershipsEnabled()} />
      {/* Content offset: right of sidebar on lg, above mobile bottom nav */}
      <div className="lg:pl-64 pb-20 lg:pb-0">
        {children}
      </div>
    </>
  )
}
