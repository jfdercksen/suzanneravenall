'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { TIER_ACCESS, tierLabel, type TierSlug } from '@/lib/access/tiers'

interface TierCard {
  slug: TierSlug
  price: string
  features: string[]
  highlighted: boolean
}

const TIER_CARDS: TierCard[] = [
  {
    slug: 'free',
    price: 'Free',
    features: [
      'Member portal dashboard',
      'Blog and resource articles',
      'Explore topics library',
      'Shop access',
    ],
    highlighted: false,
  },
  {
    slug: 'silver',
    price: 'Silver',
    features: [
      'Everything in Free',
      'Full resource library',
      'Self-assessment workbooks',
      'Recorded group sessions',
      'Self-study programme materials',
    ],
    highlighted: false,
  },
  {
    slug: 'gold',
    price: 'Gold',
    features: [
      'Everything in Silver',
      'Live session recordings',
      'All programmes — full access',
      'Priority booking windows',
    ],
    highlighted: true,
  },
  {
    slug: 'practitioner',
    price: 'Practitioner',
    features: [
      'Everything in Gold',
      'Practitioner resource library',
      'Certification materials',
      'Practitioner community',
      'CPD tracking tools',
    ],
    highlighted: false,
  },
]

const TIER_BADGE: Record<TierSlug, string> = {
  free: 'bg-gray-700 text-gray-300',
  silver: 'bg-gray-400/20 text-gray-200 border border-gray-400/40',
  gold: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  practitioner: 'bg-brand-accent/20 text-brand-accent border border-brand-accent/40',
}

interface UpgradeContentProps {
  currentTier: TierSlug
  fromLabel: string | null
}

export default function UpgradeContent({ currentTier, fromLabel }: UpgradeContentProps) {
  const currentIndex = ['free', 'silver', 'gold', 'practitioner'].indexOf(currentTier)

  return (
    <main className="w-full bg-brand-primary min-h-screen">

      {/* Hero */}
      <section className="w-full bg-brand-primary py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
              Membership Upgrade
            </p>
            <h1 className="text-4xl lg:text-6xl font-light text-white mb-6 leading-tight">
              {fromLabel
                ? `Unlock ${fromLabel}`
                : 'Unlock your full potential'}
            </h1>
            <p className="text-xl text-white/60 leading-relaxed mb-8">
              You&rsquo;re currently on the{' '}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-widest ${TIER_BADGE[currentTier]}`}>
                {tierLabel(currentTier)}
              </span>{' '}
              plan. Upgrade to access the resources that accelerate your transformation.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/shop?collection=membership"
                className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold rounded-xl transition-colors duration-300"
              >
                View Membership Plans
              </Link>
              <Link
                href="/portal/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors duration-300"
              >
                Back to Dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tier comparison */}
      <section className="w-full bg-gray-950 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Compare Plans
            </p>
            <h2 className="text-4xl lg:text-5xl font-light text-white">
              Choose your transformation
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIER_CARDS.map((card, i) => {
              const isCurrent = card.slug === currentTier
              const isUpgrade = ['free', 'silver', 'gold', 'practitioner'].indexOf(card.slug) > currentIndex

              return (
                <motion.div
                  key={card.slug}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`relative flex flex-col rounded-2xl p-6 transition-all duration-300 ${
                    card.highlighted && isUpgrade
                      ? 'bg-brand-primary ring-2 ring-brand-accent shadow-2xl shadow-brand-accent/20 -translate-y-2'
                      : 'bg-gray-900'
                  } ${isCurrent ? 'ring-1 ring-white/20' : ''}`}
                >
                  {card.highlighted && isUpgrade && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-brand-accent text-white text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gray-600 text-white text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest mb-4 ${TIER_BADGE[card.slug]}`}>
                      {card.price}
                    </span>
                    <p className="text-white font-semibold text-lg">{tierLabel(card.slug)}</p>
                  </div>

                  <ul className="flex-1 space-y-3 mb-8">
                    {card.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <svg
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isUpgrade || isCurrent ? 'text-brand-accent' : 'text-white/30'}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span className={`text-sm ${isUpgrade || isCurrent ? 'text-white/80' : 'text-white/30'}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {isUpgrade ? (
                    <Link
                      href={`/shop?collection=membership&tier=${card.slug}`}
                      className={`w-full text-center py-3 px-4 rounded-xl font-semibold text-sm transition-colors duration-300 ${
                        card.highlighted
                          ? 'bg-brand-accent-600 hover:bg-brand-accent-700 text-white'
                          : 'bg-gray-800 hover:bg-gray-700 text-white'
                      }`}
                    >
                      Upgrade to {tierLabel(card.slug)}
                    </Link>
                  ) : isCurrent ? (
                    <div className="w-full text-center py-3 px-4 rounded-xl font-semibold text-sm bg-white/5 text-white/40 cursor-default">
                      Current Plan
                    </div>
                  ) : (
                    <div className="w-full text-center py-3 px-4 rounded-xl font-semibold text-sm bg-white/5 text-white/20 cursor-default">
                      Included
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* What unlocks section */}
      <section className="w-full bg-brand-primary py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
                Why Upgrade
              </p>
              <h2 className="text-4xl lg:text-5xl font-light text-white mb-6">
                Every level deepens your transformation
              </h2>
              <p className="text-lg text-white/60 leading-relaxed mb-8">
                Dr. Suzanne Ravenall has distilled over 20 years of clinical and coaching work into
                a structured resource library that meets you exactly where you are — and takes you
                further than you imagined possible.
              </p>
              <Link
                href="/shop?collection=membership"
                className="inline-flex items-center gap-2 px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold rounded-xl transition-colors duration-300"
              >
                View all membership plans
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            <div className="space-y-4">
              {[
                {
                  tier: 'silver' as TierSlug,
                  label: 'Silver — Where the work begins',
                  desc: 'Assessments and workbooks to map your patterns. Group session recordings you can revisit anytime.',
                },
                {
                  tier: 'gold' as TierSlug,
                  label: 'Gold — Full access, full momentum',
                  desc: 'Every programme, every live session recording. The complete toolkit for sustained transformation.',
                },
                {
                  tier: 'practitioner' as TierSlug,
                  label: 'Practitioner — Lead the change',
                  desc: 'Certification-level materials and a professional community for practitioners using this work with clients.',
                },
              ].map(({ tier, label, desc }, i) => (
                <motion.div
                  key={tier}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex gap-4 p-5 bg-gray-900 rounded-xl"
                >
                  <span className={`inline-flex items-center self-start px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-widest flex-shrink-0 mt-0.5 ${TIER_BADGE[tier]}`}>
                    {tierLabel(tier).split(' ')[0]}
                  </span>
                  <div>
                    <p className="text-white font-semibold mb-1">{label}</p>
                    <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

    </main>
  )
}
