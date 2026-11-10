'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/shared/PageHeader'
import { LiveCalendarList } from '@/components/events/LiveCalendarList'
import { contactHref } from '@/app/contact/enquiry'
import type { LiveCalendar } from '@/lib/events/calendarFormat'

// Item 11 of Suzanne's 8 Nov list: events is a calendar of LIVE programmes
// only, fed by data/live-calendar.json (Shayna fills it; how-to beside the
// file). Recorded series and self-study moved out: they stay in the shop and
// on /programs. No date is ever invented: while the file has none, every
// programme shows "Dates to be announced" with a register-interest button.

const sectionMotion = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6 },
}

export default function EventsContent({ calendar }: { calendar: LiveCalendar }) {
  const hasDates = calendar.rows.length > 0

  return (
    <>
      <PageHeader
        id="events-hero-heading"
        eyebrow="Events"
        image="/images/generated/session-coaching.webp"
        title="Live Programmes Calendar"
        description="Live programmes with Dr. Suzanne Ravenall via Zoom. Book a date, or register your interest and be first to hear when the next one is set."
      >
        <a
          href="#calendar"
          className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 bg-white hover:bg-brand-sand text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
        >
          See the Calendar
        </a>
        <Link
          href={contactHref('events', 'New live dates')}
          className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 border border-white/50 hover:border-white text-white text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-white/10"
        >
          Register Your Interest
        </Link>
      </PageHeader>

      {/* Calendar: cream */}
      <section
        id="calendar"
        aria-labelledby="calendar-heading"
        className="w-full bg-brand-cream py-20 lg:py-32 scroll-mt-16 lg:scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...sectionMotion} className="max-w-3xl mb-12">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Live Calendar
            </p>
            <h2
              id="calendar-heading"
              className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary mb-4"
            >
              {hasDates ? 'Upcoming live dates' : 'Live dates to be announced'}
            </h2>
            <p className="text-lg text-brand-muted font-light leading-relaxed">
              {hasDates
                ? 'Join Suzanne live from anywhere in the world. Choose a date to book, or register your interest in a programme without a date yet.'
                : "No live dates are scheduled yet. Register your interest in a programme and Suzanne's team will contact you as soon as dates are set."}
            </p>
          </motion.div>
          <LiveCalendarList calendar={calendar} />
        </div>
      </section>

      {/* Own pace: sand */}
      <section aria-labelledby="own-pace-heading" className="w-full bg-brand-sand py-20 lg:py-32">
        <motion.div
          {...sectionMotion}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16 items-start"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Prefer Your Own Pace?
            </p>
            <h2
              id="own-pace-heading"
              className="text-4xl lg:text-5xl font-medium tracking-tight text-brand-primary leading-tight"
            >
              Start now, in your own time
            </h2>
          </div>
          <div>
            <h3 className="text-xl font-medium text-brand-primary mb-3">Self-study programmes</h3>
            <p className="text-brand-muted text-sm font-light leading-relaxed mb-6">
              Recorded programmes you can start anytime and work through at your own pace.
            </p>
            <Link
              href="/programs#self-paced"
              className="text-sm font-medium text-brand-accent hover:text-brand-accent-700 underline underline-offset-4 transition-colors duration-300"
            >
              Browse self-study
            </Link>
          </div>
          <div>
            <h3 className="text-xl font-medium text-brand-primary mb-3">Recorded group healing sessions</h3>
            <p className="text-brand-muted text-sm font-light leading-relaxed mb-6">
              Group healing, in your own time: series recorded live with Suzanne.
            </p>
            <Link
              href="/programs/recorded-group-healing"
              className="text-sm font-medium text-brand-accent hover:text-brand-accent-700 underline underline-offset-4 transition-colors duration-300"
            >
              See the recorded series
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Final CTA: dark, photo-backed */}
      <section
        aria-labelledby="events-cta-heading"
        className="relative w-full bg-brand-primary py-20 lg:py-32 overflow-hidden"
      >
        <Image
          src="/images/generated/group-coaching-real.webp"
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className="object-cover opacity-50"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-brand-primary/90 via-brand-primary/75 to-brand-primary/90"
        />
        <motion.div
          {...sectionMotion}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-6">
            Not Sure Where to Start?
          </p>
          <h2
            id="events-cta-heading"
            className="text-4xl lg:text-6xl font-medium tracking-tight text-white mb-6"
          >
            Book a Discovery Call
          </h2>
          <p className="text-lg lg:text-xl text-white/80 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            A free 30-minute call with no obligation. Suzanne will help you find the
            programme that best fits where you are, and where you want to go.
          </p>
          <Link
            href="/contact#book"
            className="inline-flex items-center justify-center py-4 px-10 bg-white hover:bg-brand-sand text-brand-primary text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
          >
            Book a Discovery Call
          </Link>
        </motion.div>
      </section>
    </>
  )
}
