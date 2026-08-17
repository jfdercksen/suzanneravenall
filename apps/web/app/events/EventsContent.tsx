'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getProgramsByCategory, PROGRAMS, type Program } from '@/data/programs'

// Event data sources:
// - infra/scripts/scraped-content/dates-repository.md (old-site "Event Dates" tab —
//   all listed sessions are awaiting new dates as of July 2026)
// - components/home/UpcomingEvents.tsx (current homepage opportunities)
// - data/programs.ts (live-via-Zoom programmes and group sessions)
// TODO: Replace with dynamic event dates from Payload CMS once Suzanne confirms
// the new live schedule.

type BadgeVariant = 'free' | 'group'

interface ConfirmedOpportunity {
  type: 'FREE' | 'GROUP'
  variant: BadgeVariant
  title: string
  description: string
  cta: string
  href: string
  badge: string
}

const confirmedOpportunities: ConfirmedOpportunity[] = [
  {
    type: 'FREE',
    variant: 'free',
    title: 'Discovery Call',
    description:
      '30-minute complimentary call to map your patterns and find the right programme for you.',
    cta: 'Book Now',
    href: '/contact',
    badge: 'Available this week',
  },
  {
    type: 'GROUP',
    variant: 'group',
    title: 'Group Transformation Session',
    description:
      'Join Suzanne and a small group for a powerful Rapid Repatterning® session.',
    cta: 'Join Waitlist',
    href: '/contact',
    badge: 'Next intake opening soon',
  },
]

const variantStyles: Record<BadgeVariant, string> = {
  free: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30',
  group: 'bg-brand-accent/15 text-brand-accent border border-brand-accent/30',
}

// Live-via-Zoom trainings that run as recurring cohorts (from data/programs.ts)
const LIVE_EVENT_SLUGS = [
  'resonance-repatterning-basic-5-series',
  'energy-clearing-basic',
  'energy-clearing-advanced',
  'akashic-navigator-basic',
  'akashic-navigator-advanced',
  'mindfulness',
  'meditation',
]

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const staggerChildren = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const childVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

function AwaitingDateCard({ program }: { program: Program }) {
  return (
    <motion.div
      variants={childVariants}
      className="group flex flex-col bg-white border border-gray-200 rounded-card p-6 hover:border-brand-accent/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
    >
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3 mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-brand-accent/15 text-brand-accent border border-brand-accent/30">
            Group
          </span>
          <span className="text-gray-400 text-xs text-right">
            New dates coming soon
          </span>
        </div>
        <h3 className="text-xl font-semibold text-brand-primary mb-3 leading-snug">
          {program.name}
        </h3>
        <p className="text-gray-600 text-sm font-light leading-relaxed mb-4">
          {program.shortDescription}
        </p>
        {program.duration && (
          <p className="text-xs text-gray-400 mb-6">{program.duration}</p>
        )}
      </div>
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/programs/${program.slug}`}
          className="text-sm font-medium text-brand-accent hover:text-brand-accent-700 transition-colors duration-300"
        >
          View programme
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-accent hover:bg-brand-accent-700 text-white text-sm font-semibold rounded-button transition-colors duration-300"
        >
          Register Your Interest
        </Link>
      </div>
    </motion.div>
  )
}

function LiveProgrammeCard({ program }: { program: Program }) {
  return (
    <motion.div
      variants={childVariants}
      className="group relative overflow-hidden min-h-[320px] bg-gray-900 border border-white/5 rounded-card transition-all duration-500 hover:-translate-y-1 hover:border-brand-accent/40 hover:shadow-2xl flex flex-col"
    >
      <Image
        src={program.image}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-500"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-transparent"
      />
      <div className="relative z-10 flex flex-col h-full p-8">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400 mb-3">
            Live via Zoom
          </p>
          <h3 className="text-xl font-semibold text-white mb-3 leading-snug group-hover:text-brand-accent-400 transition-colors duration-300">
            {program.name}
          </h3>
          <p className="text-white/65 text-sm font-light leading-relaxed mb-4">
            {program.shortDescription}
          </p>
          {program.duration && (
            <p className="text-xs text-white/60 mb-6">{program.duration}</p>
          )}
        </div>
        <Link
          href={`/programs/${program.slug}`}
          className="inline-flex items-center justify-center w-full py-3 px-6 border border-white/30 hover:border-brand-accent hover:bg-brand-accent text-white text-sm font-medium rounded-button transition-all duration-300"
        >
          Learn More
        </Link>
      </div>
    </motion.div>
  )
}

export default function EventsContent() {
  const groupSessions = getProgramsByCategory('group')
  const livePrograms = LIVE_EVENT_SLUGS.map((slug) =>
    PROGRAMS.find((p) => p.slug === slug),
  ).filter((p): p is Program => p !== undefined && p.isPublished)

  return (
    <>
      {/* Hero — DARK */}
      <section
        aria-labelledby="events-hero-heading"
        className="relative w-full min-h-[560px] flex items-center overflow-hidden bg-brand-primary-900"
      >
        <Image
          src="/images/generated/session-coaching.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-30"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-brand-primary-900/95 via-brand-primary-900/70 to-brand-primary-900/40"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_theme(colors.brand.accent/15%),_transparent_50%)]"
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-6">
              Events
            </p>
            <h1
              id="events-hero-heading"
              className="text-4xl lg:text-6xl font-light text-white mb-6 leading-tight"
            >
              Live Events &amp; Training Dates
            </h1>
            <p className="text-lg lg:text-xl text-white/75 font-light max-w-xl mb-10 leading-relaxed">
              Group sessions, live-via-Zoom trainings and events with Dr.
              Suzanne Ravenall, join from anywhere in the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#upcoming"
                className="inline-flex items-center justify-center py-4 px-8 bg-brand-accent hover:bg-brand-accent-700 text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_30px_theme(colors.brand.accent/50%)]"
              >
                See Upcoming Events
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center py-4 px-8 border border-white/40 hover:border-white text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-white/5"
              >
                Register Your Interest
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Upcoming Events — LIGHT */}
      <section
        id="upcoming"
        aria-labelledby="upcoming-events-heading"
        className="w-full bg-gray-50 py-20 lg:py-32 scroll-mt-16 lg:scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Upcoming Events
            </p>
            <h2
              id="upcoming-events-heading"
              className="text-4xl lg:text-6xl font-light text-brand-primary mb-4 max-w-2xl"
            >
              Your Next Opportunity to Join Live
            </h2>
            <p className="text-lg text-gray-600 font-light mb-12 max-w-2xl leading-relaxed">
              Suzanne is finalising the new live calendar. Book what is open
              now, and register your interest for the sessions awaiting new
              dates. You will be the first to know when dates are confirmed.
            </p>
          </motion.div>

          {/* Confirmed / bookable now */}
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16"
          >
            {confirmedOpportunities.map(
              ({ type, variant, title, description, cta, href, badge }) => (
                <motion.div
                  key={title}
                  variants={childVariants}
                  className="group flex flex-col bg-white border border-gray-200 rounded-card p-6 hover:border-brand-accent/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${variantStyles[variant]}`}
                    >
                      {type}
                    </span>
                    <span className="text-gray-400 text-xs text-right">
                      {badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-brand-primary mb-3">
                    {title}
                  </h3>
                  <p className="text-gray-600 text-sm font-light leading-relaxed flex-1">
                    {description}
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-emerald-600 text-sm font-medium">
                      Complimentary
                    </span>
                    <Link
                      href={href}
                      className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-accent hover:bg-brand-accent-700 text-white text-sm font-semibold rounded-button transition-colors duration-300"
                    >
                      {cta}
                    </Link>
                  </div>
                </motion.div>
              ),
            )}
          </motion.div>

          {/* Group sessions awaiting new dates */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <h3 className="text-2xl lg:text-3xl font-light text-brand-primary mb-3">
              Group Sessions: New Dates Coming Soon
            </h3>
            <p className="text-gray-600 font-light mb-10 max-w-2xl leading-relaxed">
              These live group repatterning series are between cohorts. Register
              your interest and Suzanne&apos;s team will contact you as soon as
              the next dates are announced.
            </p>
          </motion.div>
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {groupSessions.map((program) => (
              <AwaitingDateCard key={program.slug} program={program} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Recurring Live Programmes — DARK */}
      <section
        aria-labelledby="live-programmes-heading"
        className="w-full bg-gray-950 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400 mb-4">
              Recurring Live Programmes
            </p>
            <h2
              id="live-programmes-heading"
              className="text-4xl lg:text-6xl font-light text-white mb-4 max-w-2xl"
            >
              Trainings Run Live via Zoom
            </h2>
            <p className="text-lg text-white/70 font-light mb-12 max-w-2xl leading-relaxed">
              These programmes run as live cohorts with Suzanne throughout the
              year: practitioner certification series, energy clearing levels
              and guided practice sessions. Attend from anywhere in the world.
            </p>
          </motion.div>
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {livePrograms.map((program) => (
              <LiveProgrammeCard key={program.slug} program={program} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Can't make a live date — LIGHT */}
      <section
        aria-labelledby="self-study-heading"
        className="w-full bg-white py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16 items-start"
          >
            <motion.div variants={childVariants} className="lg:col-span-1">
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
                Can&apos;t Make a Live Date?
              </p>
              <h2
                id="self-study-heading"
                className="text-4xl lg:text-5xl font-light text-brand-primary leading-tight"
              >
                Start Now, Your Way
              </h2>
            </motion.div>
            <motion.div variants={childVariants}>
              <h3 className="text-xl font-semibold text-brand-primary mb-3">
                Study at Your Own Pace
              </h3>
              <p className="text-gray-600 text-sm font-light leading-relaxed mb-6">
                Most live programmes are also available as recorded, self-study
                versions: the same material, in your own time, with the same
                energetic benefit as being in the class.
              </p>
              <Link
                href="/programs"
                className="text-sm font-medium text-brand-accent hover:text-brand-accent-700 transition-colors duration-300"
              >
                Browse all programmes
              </Link>
            </motion.div>
            <motion.div variants={childVariants}>
              <h3 className="text-xl font-semibold text-brand-primary mb-3">
                Be First to Hear About New Dates
              </h3>
              <p className="text-gray-600 text-sm font-light leading-relaxed mb-6">
                Register your interest in any session and Suzanne&apos;s team
                will let you know the moment new live dates are announced.
              </p>
              <Link
                href="/contact"
                className="text-sm font-medium text-brand-accent hover:text-brand-accent-700 transition-colors duration-300"
              >
                Register your interest
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA — DARK */}
      <section
        aria-labelledby="events-cta-heading"
        className="w-full bg-brand-primary py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-6">
              Not Sure Where to Start?
            </p>
            <h2
              id="events-cta-heading"
              className="text-4xl lg:text-6xl font-light text-white mb-6"
            >
              Book a Discovery Call
            </h2>
            <p className="text-lg lg:text-xl text-white/70 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
              A free 30-minute call with no obligation. Suzanne will help you
              find the event or programme that best fits where you are, and
              where you want to go.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center py-4 px-10 bg-brand-accent hover:bg-brand-accent-700 text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_40px_theme(colors.brand.accent/60%)]"
            >
              Book a Discovery Call
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}
