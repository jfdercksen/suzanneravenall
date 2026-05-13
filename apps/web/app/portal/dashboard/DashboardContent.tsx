'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { hasAccess, TIER_BADGE_STYLES, type TierSlug } from '@/lib/access/tiers'

function CountUp({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView || target === 0) return
    const duration = 800
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      setCount(Math.round(progress * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target])

  return <span ref={ref}>{count}</span>
}

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
  memberSince: string | null
}

function formatMemberSince(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
}

export default function DashboardContent({
  firstName,
  tierName,
  tierSlug,
  programmes,
  memberSince,
}: DashboardContentProps) {
  const badgeClass = TIER_BADGE_STYLES[tierSlug] ?? TIER_BADGE_STYLES.free
  const isFreeTier = tierSlug === 'free'
  const canAccessVideos = hasAccess(tierSlug, 'group_sessions_recorded')
  const canAccessAssessments = hasAccess(tierSlug, 'resources_assessments')

  return (
    <main className="w-full bg-brand-primary min-h-screen py-16 lg:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
            Member Portal
          </p>
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <h1 className="text-3xl lg:text-5xl font-light text-white">
              Welcome back{firstName ? `, ${firstName}` : ''}
            </h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest ${badgeClass}`}>
              {tierName}
            </span>
          </div>
          <p className="text-lg text-white/60">
            Your transformation continues. Everything you need is right here.
          </p>
        </motion.div>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10"
        >
          <div className="p-5 bg-gray-900 rounded-xl">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Member since</p>
            <p className="text-white font-semibold">{formatMemberSince(memberSince)}</p>
          </div>
          <div className="p-5 bg-gray-900 rounded-xl">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Programmes</p>
            <p className="text-white font-semibold">
              {programmes.length > 0 ? (
                <><CountUp target={programmes.length} /> enrolled</>
              ) : (
                '0 — browse shop'
              )}
            </p>
          </div>
          <div className="p-5 bg-gray-900 rounded-xl col-span-2 lg:col-span-1">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Membership tier</p>
            <p className={`font-semibold ${tierSlug === 'gold' ? 'text-yellow-300' : tierSlug === 'practitioner' ? 'text-brand-accent' : 'text-white'}`}>
              {tierName}
            </p>
          </div>
        </motion.div>

        {/* Silver+ tier content spotlights */}
        {!isFreeTier && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-10"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Available to you now</h2>
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

        {/* My Programmes preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">My Programmes</h2>
            <Link href="/portal/programmes" className="text-brand-accent text-sm hover:underline">
              View all
            </Link>
          </div>

          {programmes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {programmes.slice(0, 3).map((programme) => (
                <Link
                  key={programme.id}
                  href="/portal/programmes"
                  className="group flex items-center gap-4 p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{programme.title}</p>
                    <p className="text-white/40 text-xs">View details →</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 bg-gray-900 rounded-xl">
              <div className="flex-1">
                <p className="text-white font-semibold mb-1">No programmes yet</p>
                <p className="text-white/50 text-sm">Browse Suzanne&apos;s coaching programmes and start your transformation.</p>
              </div>
              <Link
                href="/shop"
                className="flex-shrink-0 inline-flex items-center px-5 py-2.5 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-sm font-semibold rounded-xl transition-colors duration-300"
              >
                Browse Shop
              </Link>
            </div>
          )}
        </motion.div>

        {/* Two-column bottom row: Upcoming Sessions + Community */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10"
        >
          {/* Upcoming sessions widget */}
          <div className="p-6 bg-gray-900 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <h3 className="text-white font-semibold">Upcoming Sessions</h3>
            </div>
            <p className="text-white/50 text-sm mb-4">
              {/* TODO: Replace with live Cal.com booking data once Cal.com API integration is wired */}
              Book a one-on-one session with Dr. Suzanne Ravenall or register for an upcoming group intensive.
            </p>
            <Link
              href="/contact#booking"
              className="inline-flex items-center gap-2 text-brand-accent text-sm font-medium hover:underline"
            >
              View available sessions
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {/* Community CTA */}
          <div className="relative overflow-hidden p-6 bg-gray-900 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold">Transformation Community</h3>
            </div>
            <p className="text-white/50 text-sm mb-4">
              Connect with fellow members on the transformation journey. Share breakthroughs, get support, and grow together.
            </p>
            <Link
              href="/community"
              className="inline-flex items-center gap-2 text-purple-300 text-sm font-medium hover:underline"
            >
              Explore the community
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </motion.div>

        {/* Continue Learning — placeholder for future LMS */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-10 p-6 bg-gray-900/50 border border-white/5 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-white font-semibold">Continue Learning</h3>
            <span className="text-xs text-white/30 font-medium uppercase tracking-widest">Coming soon</span>
          </div>
          <p className="text-white/40 text-sm">
            {/* TODO: Wire up to LMS once content library is built in Phase 4 */}
            Structured learning paths and progress tracking will be available here once the full learning management system is launched.
          </p>
        </motion.div>

        {/* Upgrade CTA — free tier only */}
        {isFreeTier && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative overflow-hidden rounded-2xl bg-gray-900 p-8 lg:p-10"
          >
            <Image
              src="/images/hero-bg.jpg"
              alt=""
              fill
              className="object-cover opacity-10"
              aria-hidden="true"
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
