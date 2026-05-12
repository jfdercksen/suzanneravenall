'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { hasAccess, type TierSlug } from '@/lib/access/tiers'

interface Programme {
  id: string
  title: string
  thumbnailUrl: string | null
}

interface DashboardContentProps {
  firstName: string
  tierName: string
  tierSlug: TierSlug
  programmes: Programme[]
}

const TIER_BADGE_STYLES: Record<string, string> = {
  free: 'bg-gray-700 text-gray-300',
  silver: 'bg-gray-400/20 text-gray-200 border border-gray-400/40',
  gold: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  practitioner: 'bg-brand-accent/20 text-brand-accent border border-brand-accent/40',
}

const QUICK_LINKS = [
  {
    href: '/portal/resources',
    label: 'My Resources',
    description: 'PDFs, workbooks, and tools',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
  {
    href: '/portal/videos',
    label: 'Video Library',
    description: 'Coaching sessions and masterclasses',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
  },
  {
    href: '/community',
    label: 'Community',
    description: 'Connect with fellow members',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    href: '/portal/profile',
    label: 'My Account',
    description: 'Profile, billing, and settings',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
]

export default function DashboardContent({
  firstName,
  tierName,
  tierSlug,
  programmes,
}: DashboardContentProps) {
  const badgeClass = TIER_BADGE_STYLES[tierSlug] ?? TIER_BADGE_STYLES.free
  const isFreeTier = tierSlug === 'free'
  const hasProgrammes = programmes.length > 0
  const canAccessVideos = hasAccess(tierSlug, 'group_sessions_recorded')
  const canAccessAssessments = hasAccess(tierSlug, 'resources_assessments')

  return (
    <main className="w-full bg-brand-primary min-h-screen py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
            Member Portal
          </p>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h1 className="text-4xl lg:text-6xl font-light text-white">
              Welcome back{firstName ? `, ${firstName}` : ''}
            </h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest ${badgeClass}`}>
              {tierName}
            </span>
          </div>
          <p className="text-xl text-white/60 max-w-2xl">
            Your transformation continues. Everything you need is right here.
          </p>
        </motion.div>

        {/* Quick links grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
        >
          {QUICK_LINKS.map((link, i) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
            >
              <Link
                href={link.href}
                className="group flex flex-col gap-4 p-6 bg-gray-900 hover:bg-gray-800 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl h-full"
              >
                <div className="text-brand-accent group-hover:scale-110 transition-transform duration-300 w-fit">
                  {link.icon}
                </div>
                <div>
                  <p className="text-white font-semibold mb-1">{link.label}</p>
                  <p className="text-white/40 text-sm">{link.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Silver+ tier content spotlights */}
        {!isFreeTier && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-light text-white mb-6">Available to you now</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {canAccessAssessments && (
                <Link
                  href="/resources/assessments"
                  className="group flex items-start gap-4 p-5 bg-gray-900 hover:bg-gray-800 rounded-xl transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm mb-0.5">Assessments</p>
                    <p className="text-white/40 text-xs leading-relaxed">Pattern recognition, emotional mastery, life design</p>
                  </div>
                  <svg className="w-4 h-4 text-brand-accent flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-center" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              )}

              {canAccessVideos && (
                <Link
                  href="/portal/videos"
                  className="group flex items-start gap-4 p-5 bg-gray-900 hover:bg-gray-800 rounded-xl transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm mb-0.5">Group Sessions</p>
                    <p className="text-white/40 text-xs leading-relaxed">Recorded group coaching intensives</p>
                  </div>
                  <svg className="w-4 h-4 text-brand-accent flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-center" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              )}

              <Link
                href="/portal/resources"
                className="group flex items-start gap-4 p-5 bg-gray-900 hover:bg-gray-800 rounded-xl transition-all duration-300"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-300">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm mb-0.5">Workbooks &amp; Templates</p>
                  <p className="text-white/40 text-xs leading-relaxed">Download all available resources</p>
                </div>
                <svg className="w-4 h-4 text-brand-accent flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-center" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>

            </div>
          </motion.div>
        )}

        {/* My Programmes */}
        {hasProgrammes && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light text-white">My Programmes</h2>
              <Link href="/shop" className="text-brand-accent text-sm hover:underline">
                Browse more
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {programmes.map((programme) => (
                <div
                  key={programme.id}
                  className="flex items-center gap-4 p-4 bg-gray-900 rounded-xl"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{programme.title}</p>
                    <p className="text-white/40 text-xs">Purchased programme</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Upgrade CTA — free tier only */}
        {isFreeTier && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative overflow-hidden rounded-2xl bg-gray-900 p-8 lg:p-12"
          >
            <div
              className="absolute inset-0 bg-cover bg-center opacity-10"
              style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
            />
            <div className="relative flex flex-col lg:flex-row lg:items-center gap-8">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
                  Unlock More
                </p>
                <h2 className="text-2xl lg:text-3xl font-light text-white mb-3">
                  Ready to go deeper?
                </h2>
                <p className="text-white/60 max-w-xl">
                  Upgrade to Silver or Gold membership for access to the full resource library,
                  group coaching sessions, self-assessment workbooks, and the practitioner community.
                </p>
              </div>
              <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/portal/upgrade"
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold rounded-xl transition-colors duration-300"
                >
                  View Upgrade Options
                </Link>
                <Link
                  href="/shop?collection=membership"
                  className="inline-flex items-center justify-center px-8 py-4 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors duration-300"
                >
                  Membership Plans
                </Link>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </main>
  )
}
