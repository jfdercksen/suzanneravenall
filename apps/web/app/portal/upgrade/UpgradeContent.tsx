'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MEMBERSHIP_TIERS, type MembershipTrack, type MembershipTier } from '@/lib/access/tiers'

const TRACK_LABELS: Record<string, string> = {
  akashic: 'Akashic Track',
  'energy-clearing': 'Energy Clearing Track',
  general: 'General',
  both: 'Both Tracks',
}

function formatZAR(amount: number): string {
  if (amount === 0) return 'Free'
  return `R${amount.toLocaleString('en-ZA')}`
}

interface TierCardProps {
  tier: MembershipTier
  isCurrentTier: boolean
  isUpgrade: boolean
}

function TierCard({ tier, isCurrentTier, isUpgrade }: TierCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px' }}
      transition={{ duration: 0.35 }}
      className={`relative flex flex-col rounded-xl p-5 transition-all duration-300 ${
        isCurrentTier
          ? 'bg-brand-primary ring-2 ring-brand-accent shadow-xl shadow-brand-accent/20'
          : isUpgrade
          ? 'bg-gray-900 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-accent/10'
          : 'bg-gray-900/30 opacity-40 pointer-events-none'
      }`}
    >
      {isCurrentTier && (
        <div className="absolute -top-3 left-4">
          <span className="bg-brand-accent text-white text-[10px] font-semibold uppercase tracking-widest px-3 py-0.5 rounded-full">
            Your Plan
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-brand-accent uppercase tracking-[0.2em] mb-0.5">
            {tier.tierType !== 'standard' ? `${tier.tierType} · level ${tier.accessLevel}` : `level ${tier.accessLevel}`}
          </p>
          <p className="text-white font-semibold text-sm leading-snug">{tier.title}</p>
        </div>
        <span className="text-[10px] text-white/30 font-mono shrink-0 mt-0.5">{tier.sku}</span>
      </div>

      <div className="mb-3">
        <span className="text-white font-semibold">{formatZAR(tier.zarPrice)}</span>
        {tier.usdPrice > 0 && (
          <span className="text-white/40 text-xs ml-1.5">${tier.usdPrice} USD · annual</span>
        )}
        {!tier.annual && tier.zarPrice === 0 && (
          <span className="text-white/40 text-xs ml-1.5">Unlimited</span>
        )}
        {tier.annual && tier.zarPrice > 0 && tier.usdPrice === 0 && (
          <span className="text-white/40 text-xs ml-1.5">per year</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {tier.canChargeClients && (
          <span className="text-[9px] px-2 py-0.5 bg-green-900/40 text-green-400 rounded-full font-medium">
            Can charge clients
          </span>
        )}
        {tier.requiresTraining && (
          <span className="text-[9px] px-2 py-0.5 bg-blue-900/40 text-blue-400 rounded-full font-medium">
            Requires training
          </span>
        )}
      </div>

      {isUpgrade && (
        <Link
          href={`/shop/${tier.handle}`}
          className="mt-auto w-full text-center py-2.5 px-4 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-colors duration-300"
        >
          Upgrade Now
        </Link>
      )}
      {isCurrentTier && (
        <div className="mt-auto w-full text-center py-2.5 px-4 bg-white/5 text-white/40 font-semibold text-xs uppercase tracking-widest rounded-xl cursor-default">
          Current Plan
        </div>
      )}
    </motion.div>
  )
}

export interface UpgradeContentProps {
  currentAccessLevel: number
  currentTrack: MembershipTrack | 'both'
  currentSku: string | null
  currentTierName: string
  fromLabel: string | null
}

export default function UpgradeContent({
  currentAccessLevel,
  currentTrack,
  currentSku,
  currentTierName,
  fromLabel,
}: UpgradeContentProps) {
  const generalTiers = MEMBERSHIP_TIERS.filter((t) => t.track === 'general')
  const akashicTiers = MEMBERSHIP_TIERS.filter((t) => t.track === 'akashic')
  const energyClearingTiers = MEMBERSHIP_TIERS.filter((t) => t.track === 'energy-clearing')

  function isCurrentTier(tier: MembershipTier): boolean {
    return tier.sku === currentSku
  }

  function isUpgrade(tier: MembershipTier): boolean {
    if (isCurrentTier(tier)) return false
    return tier.accessLevel > currentAccessLevel
  }

  const trackDisplay =
    currentTrack !== 'general' && currentTrack !== 'both'
      ? ` (${TRACK_LABELS[currentTrack]})`
      : ''

  return (
    <main className="w-full bg-brand-primary min-h-screen">

      {/* Hero */}
      <section className="w-full bg-brand-primary py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
              Membership Upgrade
            </p>
            <h1 className="text-4xl lg:text-6xl font-light text-white mb-6 leading-tight">
              {fromLabel ? `Unlock ${fromLabel}` : 'Advance your membership'}
            </h1>
            <p className="text-lg lg:text-xl text-white/60 leading-relaxed mb-8">
              You&rsquo;re currently on{' '}
              <span className="text-white font-semibold">{currentTierName}</span>
              {trackDisplay && <span className="text-white/60">{trackDisplay}</span>}
              . Choose the next step in your practitioner journey below.
            </p>
            <p className="text-sm text-white/40 mb-10">
              Both tracks are independent. You may hold memberships in Akashic and Energy Clearing simultaneously.
              Basic tiers give core access; Premier tiers include CPD tracking, community access, and extended resources.
            </p>
            <Link
              href="/portal/dashboard"
              className="inline-flex items-center justify-center px-8 py-4 border border-white/20 hover:border-white/40 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-colors duration-300"
            >
              Back to Dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      {/* General tiers */}
      <section className="w-full bg-gray-950 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
              Open to Everyone
            </p>
            <h2 className="text-3xl lg:text-4xl font-light text-white">Starting Point</h2>
            <p className="text-white/40 text-sm mt-2">
              Entry memberships: no training required.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {generalTiers.map((tier) => (
              <TierCard
                key={tier.sku}
                tier={tier}
                isCurrentTier={isCurrentTier(tier)}
                isUpgrade={isUpgrade(tier)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Practitioner tracks */}
      <section className="w-full bg-brand-primary py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
              Practitioner Pathways
            </p>
            <h2 className="text-3xl lg:text-4xl font-light text-white">Choose your track</h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

            {/* Akashic */}
            <div>
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="text-xl font-semibold text-white mb-6 pb-4 border-b border-white/10"
              >
                Akashic Track
                <span className="ml-2 text-xs font-normal text-white/30 uppercase tracking-widest">S0213 – S0225</span>
              </motion.h3>
              <div className="space-y-4">
                {akashicTiers.map((tier) => (
                  <TierCard
                    key={tier.sku}
                    tier={tier}
                    isCurrentTier={isCurrentTier(tier)}
                    isUpgrade={isUpgrade(tier)}
                  />
                ))}
              </div>
            </div>

            {/* Energy Clearing */}
            <div>
              <motion.h3
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="text-xl font-semibold text-white mb-6 pb-4 border-b border-white/10"
              >
                Energy Clearing Track
                <span className="ml-2 text-xs font-normal text-white/30 uppercase tracking-widest">S0226 – S0239</span>
              </motion.h3>
              <div className="space-y-4">
                {energyClearingTiers.map((tier) => (
                  <TierCard
                    key={tier.sku}
                    tier={tier}
                    isCurrentTier={isCurrentTier(tier)}
                    isUpgrade={isUpgrade(tier)}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

    </main>
  )
}
