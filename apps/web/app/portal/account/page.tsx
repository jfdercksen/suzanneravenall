import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getMemberAccessLevel } from '@/lib/access/check-access'
import ProfileForm from './ProfileForm'
import PasswordForm from './PasswordForm'
import styles from './account.module.css'

export const metadata = {
  title: 'My Account | Member Portal',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTrack(track: string | null): string {
  if (!track || track === 'general') return ''
  if (track === 'energy-clearing') return 'Energy Clearing'
  if (track === 'akashic') return 'Akashic'
  if (track === 'both') return 'Akashic & Energy Clearing'
  return track
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
  const memberSince = subscriptionData?.start_date ?? user.created_at ?? null

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? ''
  const nameParts = fullName.trim().split(/\s+/)
  const firstName = nameParts[0] ?? ''
  const lastName = nameParts.slice(1).join(' ')
  const phone = (user.user_metadata?.phone as string | undefined) ?? ''

  const trackLabel = formatTrack(accessInfo.track)

  return (
    <main className="relative w-full bg-brand-primary min-h-screen py-16 lg:py-24 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute bg-brand-accent/10 blur-[140px] rounded-full w-96 h-96 top-1/4 left-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className={`mb-10 ${styles.fadeUp}`}>
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-4">
            Member Portal
          </p>
          <h1 className="text-3xl lg:text-5xl font-light text-white mb-3">My Account</h1>
          <p className="text-lg text-white/60">Manage your profile, password, and membership details.</p>
        </div>

        {/* Profile section (client — form state + save handler) */}
        <ProfileForm
          email={user.email ?? ''}
          initialFirstName={firstName}
          initialLastName={lastName}
          initialPhone={phone}
          className={`${styles.fadeUp} ${styles.delay1}`}
        />

        {/* Password section (client — form state + update handler) */}
        <PasswordForm className={`${styles.fadeUp} ${styles.delay2}`} />

        {/* Membership details — read-only, server-rendered (KI016) */}
        <section
          className={`mb-8 p-6 lg:p-8 bg-gray-900 rounded-card ${styles.fadeUp} ${styles.delay3}`}
          aria-labelledby="membership-heading"
        >
          <h2 id="membership-heading" className="text-lg font-semibold text-white mb-6">Membership Details</h2>
          <dl className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
              <dt className="text-white/50 text-sm">Current tier</dt>
              <dd className="text-white font-semibold text-sm">{tierName}</dd>
            </div>
            {accessInfo.sku && (
              <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
                <dt className="text-white/50 text-sm">Membership code</dt>
                <dd className="text-white font-semibold text-sm font-mono">{accessInfo.sku}</dd>
              </div>
            )}
            {trackLabel && (
              <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
                <dt className="text-white/50 text-sm">Track</dt>
                <dd className="text-white font-semibold text-sm">{trackLabel}</dd>
              </div>
            )}
            <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
              <dt className="text-white/50 text-sm">Access level</dt>
              <dd className="text-white font-semibold text-sm">Level {accessInfo.accessLevel} of 10</dd>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
              <dt className="text-white/50 text-sm">Member since</dt>
              <dd className="text-white font-semibold text-sm">{formatDate(memberSince)}</dd>
            </div>
            <div className="flex justify-between items-center py-3">
              <dt className="text-white/50 text-sm">Annual renewal</dt>
              <dd className="text-white font-semibold text-sm">{formatDate(memberUntil)}</dd>
            </div>
          </dl>
          <div className="mt-5">
            <Link
              href="/portal/upgrade"
              className="inline-flex items-center gap-2 text-brand-accent-300 text-sm font-medium hover:underline"
            >
              View upgrade options
              <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Danger zone — read-only, server-rendered (KI016) */}
        <section
          className={`p-6 lg:p-8 bg-gray-900 rounded-card border border-red-900/30 ${styles.fadeUp} ${styles.delay4}`}
          aria-labelledby="danger-heading"
        >
          <h2 id="danger-heading" className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-white/50 text-sm mb-5">
            To cancel your membership or delete your account, please contact us directly so we can assist you.
          </p>
          <Link
            href="/contact"
            aria-label="Contact us to cancel membership"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-red-900/50 hover:border-red-700/60 text-red-400 hover:text-red-300 text-sm font-semibold rounded-button transition-colors duration-300"
          >
            Cancel Membership
          </Link>
        </section>

      </div>
    </main>
  )
}
