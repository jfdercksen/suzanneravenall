'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, CalendarDays, Clock, Users } from 'lucide-react'

// TODO: Replace static data with Payload CMS query in Task 1.6
const featuredCohort = {
  label: 'GROUP PROGRAM · NEXT INTAKE',
  title: 'Group Transformation',
  subtitle: '6 weeks. Small group. Permanent change.',
  date: 'June 2026',
  duration: '6 weeks',
  spots: 12,
  spotsRemaining: 4,
  price: 'R14,500',
  href: '/programs/group-transformation',
  cta: 'Reserve Your Spot',
}

// TODO: Connect nextAvailable to Cal.com availability API in Task 1.8
const oneOnOne = {
  label: '1-ON-1 COACHING',
  title: 'Private Intensive',
  subtitle: "Suzanne's full attention. Your breakthrough.",
  availability: 'Limited availability',
  nextAvailable: 'May 2026',
  href: '/contact',
  cta: 'Book Discovery Call',
}

export default function UpcomingPrograms() {
  return (
    <section className="bg-brand-primary py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="text-xs tracking-[0.3em] text-brand-accent uppercase font-medium mb-2">
              UPCOMING PROGRAMS
            </p>
            {/* Promoted to text-4xl md:text-6xl per design-rules.md minimum */}
            <h2 className="text-4xl md:text-6xl font-light text-white">
              Your next step starts here
            </h2>
          </div>
          <Link
            href="/programs"
            className="hidden md:flex items-center gap-2 text-white/70 hover:text-white text-sm uppercase tracking-widest transition-colors duration-300"
          >
            All programs <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Two-tier card grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* TIER 1 — Featured cohort (spans 2 cols) */}
          <motion.div
            className="lg:col-span-2 relative overflow-hidden bg-gray-900 border border-white/5 shadow-2xl group"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
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
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-brand-primary/80 to-transparent" />

            {/* Content */}
            <div className="relative z-10 p-8 md:p-12 flex flex-col justify-between min-h-[380px]">

              <div>
                {/* Top row — label + spots badge */}
                <div className="flex items-start justify-between mb-8">
                  <p className="text-xs tracking-[0.3em] text-brand-accent uppercase font-medium">
                    {featuredCohort.label}
                  </p>
                  <span className="bg-brand-accent/20 border border-brand-accent/40 text-brand-accent text-xs px-3 py-1 uppercase tracking-wider">
                    {featuredCohort.spotsRemaining} spots left
                  </span>
                </div>

                <h3 className="text-4xl md:text-5xl font-light text-white leading-tight mb-3">
                  {featuredCohort.title}
                </h3>
                <p className="text-white/60 text-lg font-light mb-8">
                  {featuredCohort.subtitle}
                </p>

                {/* Meta row — normal-case on mobile, uppercase on desktop for readability */}
                <div className="flex flex-wrap gap-4 text-sm text-white/50 normal-case md:uppercase md:tracking-wider mb-8">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    {featuredCohort.date}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    {featuredCohort.duration}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    {featuredCohort.spots} people max
                  </span>
                </div>
              </div>

              {/* Bottom row — price + CTA */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <span className="text-3xl font-light text-white">
                  {featuredCohort.price}
                </span>
                <Link
                  href={featuredCohort.href}
                  className="bg-brand-accent hover:bg-brand-accent-700 text-white px-8 py-4 text-sm uppercase tracking-widest font-medium transition-all duration-300 hover:shadow-[0_0_30px_rgba(23,25,244,0.4)]"
                >
                  {featuredCohort.cta} &rarr;
                </Link>
              </div>
            </div>
          </motion.div>

          {/* TIER 2 — 1-on-1 card (spans 1 col) */}
          <motion.div
            className="relative overflow-hidden bg-gray-950 border border-white/10 group hover:border-brand-accent/40 transition-colors duration-500"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' as const }}
            whileHover={{ y: -4 }}
          >
            <div className="p-8 flex flex-col justify-between min-h-[380px]">

              <div>
                <p className="text-xs tracking-[0.3em] text-brand-accent uppercase font-medium mb-8">
                  {oneOnOne.label}
                </p>
                <h3 className="text-3xl font-light text-white leading-tight mb-3">
                  {oneOnOne.title}
                </h3>
                <p className="text-white/60 font-light mb-8">
                  {oneOnOne.subtitle}
                </p>

                {/* Availability indicator */}
                <div className="flex items-center gap-3 mb-2">
                  <span aria-hidden="true" className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white/50 text-sm uppercase tracking-wider">
                    {oneOnOne.availability}
                  </span>
                </div>
                <p className="text-white/30 text-sm pl-5">
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
        <div className="mt-8 text-center md:hidden">
          <Link
            href="/programs"
            className="text-white/70 hover:text-white text-sm uppercase tracking-widest transition-colors duration-300"
          >
            View all programs &rarr;
          </Link>
        </div>

      </div>
    </section>
  )
}
