'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { LiveCalendarList } from '@/components/events/LiveCalendarList'
import type { LiveCalendar } from '@/lib/events/calendarFormat'

// Live programmes on the home page, from the same data file as /events
// (data/live-calendar.json), so a date added once shows in both places.
export default function LiveProgrammesBand({ calendar }: { calendar: LiveCalendar }) {
  const hasDates = calendar.rows.length > 0
  return (
    <section aria-labelledby="home-live-heading" className="w-full bg-brand-primary-900 py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12"
        >
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400 mb-4">
              Live Programmes
            </p>
            <h2 id="home-live-heading" className="text-4xl lg:text-6xl font-medium tracking-tight text-white leading-tight mb-4">
              Live with Suzanne via Zoom
            </h2>
            <p className="text-base lg:text-lg text-white/80 font-light leading-relaxed">
              {hasDates
                ? 'Join from anywhere in the world. Book a date, or register your interest in the next one.'
                : 'No live dates are scheduled yet. Register your interest and be first to hear when they are set.'}
            </p>
          </div>
          <Link
            href="/events"
            className="inline-flex w-fit items-center justify-center px-6 py-3 border border-white/50 hover:border-white text-white hover:bg-white/10 text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
          >
            Full Calendar
          </Link>
        </motion.div>
        <LiveCalendarList calendar={calendar} tone="dark" limit={4} idPrefix="home-live" />
      </div>
    </section>
  )
}
