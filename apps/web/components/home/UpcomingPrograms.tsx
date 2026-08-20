'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, Clock, Users } from 'lucide-react'
import type { FeaturedCohort } from '@/lib/inventory/group-sessions'

// 1-on-1 availability isn't inventory-backed (it's Cal.com-governed, not a
// capacity count) — kept as static copy, out of scope for the group-session
// inventory work. TODO: Connect nextAvailable to Cal.com availability API.
const oneOnOne = {
  label: '1-ON-1 COACHING',
  title: 'Private Intensive',
  subtitle: "Suzanne's full attention. Your breakthrough.",
  availability: 'Limited availability',
  nextAvailable: 'By discovery call',
  href: '/contact',
  cta: 'Book Discovery Call',
}

interface UpcomingProgramsProps {
  /** Real, inventory-backed cohort — null when no group session currently
   *  has tracked inventory (seed script not yet run, or fetch failed). Never
   *  fabricate a fallback number here — render the honest waitlist card
   *  instead. */
  cohort: FeaturedCohort | null
}

export default function UpcomingPrograms({ cohort }: UpcomingProgramsProps) {
  return (
    <section className="bg-white py-14 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="text-xs tracking-[0.3em] text-brand-accent uppercase font-medium mb-2">
              UPCOMING PROGRAMS
            </p>
            <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight text-brand-primary">
              Your next step starts here
            </h2>
          </div>
          <Link
            href="/programs"
            className="hidden lg:flex items-center gap-2 text-gray-500 hover:text-brand-primary text-sm uppercase tracking-widest transition-colors duration-300"
          >
            All programs <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Two-tier card grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* TIER 1 — Featured cohort (spans 2 cols) */}
          <motion.div
            className="lg:col-span-2 relative overflow-hidden bg-gray-900 border border-white/5 shadow-2xl group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, ease: 'easeOut' as const }}
            whileHover={{ y: -4 }}
          >
            {/* Background image — raised opacity for cinematic depth */}
            <Image
              src="/images/hero-bg-suzanne-ravenall.jpg"
              alt=""
              aria-hidden="true"
              fill
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="object-cover opacity-45 group-hover:opacity-55 transition-opacity duration-500"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-gray-950/85 via-gray-950/40 to-transparent" />

            {/* Content */}
            <div className="relative z-10 p-8 lg:p-12 flex flex-col justify-between min-h-[380px]">
              {cohort ? (
                <>
                  <div>
                    {/* Top row — label + real spots badge */}
                    <div className="flex items-start justify-between mb-8">
                      <p className="text-xs tracking-[0.3em] text-white/80 uppercase font-medium">
                        GROUP PROGRAM · NEXT INTAKE
                      </p>
                      <span
                        className={`text-xs px-3 py-1 uppercase tracking-wider ${
                          cohort.spotsRemaining > 0
                            ? 'bg-gray-950/70 border border-white/40 text-white'
                            : 'bg-gray-800 border border-gray-700 text-gray-200'
                        }`}
                      >
                        {cohort.spotsRemaining > 0
                          ? `${cohort.spotsRemaining} spot${cohort.spotsRemaining === 1 ? '' : 's'} left`
                          : 'Waitlist only'}
                      </span>
                    </div>

                    <h3 className="text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-tight mb-3">
                      {cohort.productTitle}
                    </h3>
                    <p className="text-white/80 text-lg font-light mb-8">
                      Small group. Live via Zoom. Permanent change.
                    </p>

                    {/* Meta row — normal-case on mobile, uppercase on desktop for readability */}
                    <div className="flex flex-wrap gap-4 text-sm text-white/70 normal-case lg:uppercase lg:tracking-wider mb-8">
                      {cohort.duration && (
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                          {cohort.duration}
                        </span>
                      )}
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        {cohort.capacity} people max
                      </span>
                    </div>
                  </div>

                  {/* Bottom row — price + CTA */}
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <span className="text-3xl font-semibold tracking-tight text-white">
                      {cohort.priceZar !== null
                        ? `R${cohort.priceZar.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
                        : 'Contact us'}
                    </span>
                    <Link
                      href={`/shop/${cohort.productHandle}`}
                      className="bg-brand-accent hover:bg-brand-accent-700 text-white px-8 py-4 text-sm uppercase tracking-widest font-medium transition-all duration-300 hover:shadow-[0_0_30px_rgba(23,25,244,0.4)]"
                    >
                      {cohort.spotsRemaining > 0 ? 'Reserve Your Spot' : 'Join the Waitlist'} &rarr;
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  {/* No group session currently has confirmed inventory/dates —
                      honest fallback, matches the tone of /events rather than
                      inventing a number. */}
                  <div>
                    <p className="text-xs tracking-[0.3em] text-white/80 uppercase font-medium mb-8">
                      GROUP PROGRAMS
                    </p>
                    <h3 className="text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-tight mb-3">
                      New Cohorts Forming
                    </h3>
                    <p className="text-white/80 text-lg font-light mb-8 max-w-md">
                      Suzanne is finalising the next round of live group sessions. Register your
                      interest and be the first to know when a spot opens.
                    </p>
                  </div>
                  <div>
                    <Link
                      href="/events"
                      className="inline-flex bg-brand-accent hover:bg-brand-accent-700 text-white px-8 py-4 text-sm uppercase tracking-widest font-medium transition-all duration-300 hover:shadow-[0_0_30px_rgba(23,25,244,0.4)]"
                    >
                      Register Your Interest &rarr;
                    </Link>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* TIER 2 — 1-on-1 card (spans 1 col) */}
          <motion.div
            className="relative overflow-hidden bg-gray-950 border border-white/10 group hover:border-brand-accent/40 transition-colors duration-500"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' as const }}
            whileHover={{ y: -4 }}
          >
            {/* Background photo + overlay — dark cards carry imagery, never flat colour */}
            <Image
              src="/images/suzanne-casual.jpg"
              alt=""
              aria-hidden="true"
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-500"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/60 to-gray-950/90" />
            <div className="relative z-10 p-8 flex flex-col justify-between min-h-[380px]">

              <div>
                <p className="text-xs tracking-[0.3em] text-white/80 uppercase font-medium mb-8">
                  {oneOnOne.label}
                </p>
                <h3 className="text-3xl font-semibold tracking-tight text-white leading-tight mb-3">
                  {oneOnOne.title}
                </h3>
                <p className="text-white/80 font-light mb-8">
                  {oneOnOne.subtitle}
                </p>

                {/* Availability indicator */}
                <div className="flex items-center gap-3 mb-2">
                  <span aria-hidden="true" className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white/70 text-sm uppercase tracking-wider">
                    {oneOnOne.availability}
                  </span>
                </div>
                <p className="text-white/60 text-sm pl-5">
                  Next available: {oneOnOne.nextAvailable}
                </p>
              </div>

              <Link
                href={oneOnOne.href}
                className="w-full border border-white/30 hover:border-brand-accent text-white px-8 py-4 text-sm uppercase tracking-widest text-center transition-all duration-300 hover:bg-brand-accent/10 block mt-8"
              >
                {oneOnOne.cta} &rarr;
              </Link>
            </div>
          </motion.div>

        </div>

        {/* Mobile — all programs link */}
        <div className="mt-8 text-center lg:hidden">
          <Link
            href="/programs"
            className="text-gray-500 hover:text-brand-primary text-sm uppercase tracking-widest transition-colors duration-300"
          >
            View all programs &rarr;
          </Link>
        </div>

      </div>
    </section>
  )
}
