'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { hasAccess, tierLabel, minimumTierFor, type TierSlug } from '@/lib/access/tiers'

interface GatedItem {
  title: string
  description: string
  href: string
  resource: 'resources_assessments' | 'resources_media' | 'group_sessions_recorded'
}

const GATED_ITEMS: GatedItem[] = [
  {
    title: 'Assessments & Workbooks',
    description: 'Pattern recognition, emotional mastery profile, life design assessment, and energy audit workbook.',
    href: '/resources/assessments',
    resource: 'resources_assessments',
  },
  {
    title: 'Member Media Library',
    description: 'Tools, templates, belief mapping worksheets, and relationship dynamics resources.',
    href: '/resources/media',
    resource: 'resources_media',
  },
  {
    title: 'Group Session Recordings',
    description: 'Recorded group coaching sessions: Rapid Repatterning, Emotional Freedom, Relationship Healing, and more.',
    href: '/portal/videos?category=group-sessions',
    resource: 'group_sessions_recorded',
  },
]

interface MemberResourcesSectionProps {
  tier: TierSlug | null
}

export default function MemberResourcesSection({ tier }: MemberResourcesSectionProps) {
  return (
    <section
      aria-labelledby="member-resources-heading"
      className="relative w-full bg-brand-primary py-20 lg:py-32 overflow-hidden"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute bg-brand-accent/10 blur-[140px] rounded-full w-96 h-96 top-1/4 left-1/2 -translate-x-1/2" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-end justify-between gap-6 mb-12"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Member Resources
            </p>
            <h2
              id="member-resources-heading"
              className="text-4xl lg:text-5xl font-light text-white"
            >
              For members only
            </h2>
          </div>
          {!tier && (
            <div className="flex gap-3">
              <Link
                href="/portal/login"
                className="inline-flex items-center justify-center px-6 py-3 border border-white/20 hover:border-white/40 text-white text-sm font-semibold rounded-button transition-colors duration-300"
              >
                Log in
              </Link>
              <Link
                href="/portal/signup"
                className="inline-flex items-center justify-center px-6 py-3 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-sm font-semibold rounded-button transition-colors duration-300"
              >
                Join free
              </Link>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {GATED_ITEMS.map((item, i) => {
            const unlocked = tier ? hasAccess(tier, item.resource) : false
            const minTier = minimumTierFor(item.resource)

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                {unlocked ? (
                  <Link
                    href={item.href}
                    className="group flex flex-col gap-4 p-6 bg-gray-900 hover:bg-gray-800 rounded-card transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl h-full"
                  >
                    <div className="flex items-center justify-between">
                      <svg aria-hidden="true" className="w-6 h-6 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75M3.75 21.75h16.5a2.25 2.25 0 002.25-2.25V11.25a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 11.25v8.25A2.25 2.25 0 003.75 21.75z" />
                      </svg>
                      <svg aria-hidden="true" className="w-4 h-4 text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-2">{item.title}</p>
                      <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-brand-accent text-sm font-medium mt-auto">
                      Access now
                      <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  </Link>
                ) : (
                  <div className="relative flex flex-col gap-4 p-6 bg-gray-900/60 rounded-card border border-white/5 h-full">
                    <div className="flex items-center justify-between">
                      <svg aria-hidden="true" className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      <span className="text-xs font-semibold uppercase tracking-widest text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                        {tierLabel(minTier)}
                      </span>
                    </div>
                    <div>
                      <p className="text-white/30 font-semibold mb-2">{item.title}</p>
                      <p className="text-white/20 text-sm leading-relaxed">{item.description}</p>
                    </div>
                    <div className="mt-auto">
                      {tier ? (
                        /* TODO: Build /portal/upgrade page */
                        <Link
                          href="/shop?collection=membership"
                          className="inline-flex items-center gap-1 text-brand-accent text-sm font-medium hover:underline"
                        >
                          Unlock with {tierLabel(minTier)}
                        </Link>
                      ) : (
                        <Link
                          href={`/portal/login?redirect=${encodeURIComponent(item.href)}`}
                          className="inline-flex items-center gap-1 text-brand-accent text-sm font-medium hover:underline"
                        >
                          Log in to access
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
