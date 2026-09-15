'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import {
  getProgramsByCategory,
  getProgramsBySeries,
  type Program,
} from '@/data/programs'

const CATEGORIES = [
  { id: 'practitioner', label: 'Practitioner' },
  { id: 'self-paced', label: 'Self-Study' },
  { id: 'live', label: 'Live' },
  { id: 'group', label: 'Recorded Group' },
] as const

const CARD_CATEGORY_LABELS: Record<Program['category'], string> = {
  practitioner: 'Practitioner',
  'self-paced': 'Self-Study',
  live: 'Live',
  group: 'Recorded Group',
}

function formatPrice(program: Program): string | null {
  if (program.priceUsd == null) return null
  const usd = `$${program.priceUsd.toLocaleString('en-US')}`
  if (program.priceZar == null) return usd
  return `${usd} · R${program.priceZar.toLocaleString('en-US')}`
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
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

function ProgramCard({ program }: { program: Program }) {
  const price = formatPrice(program)
  return (
    <motion.div
      variants={childVariants}
      className="group bg-white border border-brand-border rounded-card p-8 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col"
    >
      <div className="flex-1">
        <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
          {CARD_CATEGORY_LABELS[program.category]}
        </p>
        <h3 className="text-xl font-medium text-brand-ink mb-3 leading-snug">
          {program.name}
        </h3>
        <p className="text-brand-muted text-sm font-light leading-relaxed mb-4">
          {program.shortDescription}
        </p>
        {price && (
          <p className="text-brand-primary font-semibold text-lg mb-2">
            {price}
          </p>
        )}
        {program.duration && (
          <p className="text-xs text-brand-muted mb-6">{program.duration}</p>
        )}
      </div>
      <Link
        href={`/programs/${program.slug}`}
        className="inline-flex items-center justify-center w-full py-3 px-6 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-sm font-medium rounded-button transition-colors duration-300"
      >
        Learn More
      </Link>
    </motion.div>
  )
}

function DarkProgramCard({ program }: { program: Program }) {
  const price = formatPrice(program)
  return (
    <motion.div
      variants={childVariants}
      className="group relative overflow-hidden min-h-[320px] bg-brand-primary-900 border border-white/5 rounded-card transition-all duration-500 hover:-translate-y-1 hover:border-white/30 hover:shadow-2xl flex flex-col"
    >
      <Image
        src={program.image ?? '/images/generated/explore-repatterning.webp'}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-500"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/40 to-transparent"
      />
      <div className="relative z-10 flex flex-col h-full p-8">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-3">
            {CARD_CATEGORY_LABELS[program.category]}
          </p>
          <h3 className="text-xl font-medium text-white mb-3 leading-snug">
            {program.name}
          </h3>
          <p className="text-white/70 text-sm font-light leading-relaxed mb-4">
            {program.shortDescription}
          </p>
          {price && (
            <p className="text-white font-semibold text-lg mb-2">
              {price}
            </p>
          )}
          {program.duration && (
            <p className="text-xs text-white/70 mb-6">{program.duration}</p>
          )}
        </div>
        <Link
          href={`/programs/${program.slug}`}
          className="inline-flex items-center justify-center w-full py-3 px-6 border border-white/50 hover:border-white hover:bg-white/10 text-white text-sm font-medium rounded-button transition-all duration-300"
        >
          Learn More
        </Link>
      </div>
    </motion.div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
      className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

export default function ProgramsPageClient() {
  const [activeCategory, setActiveCategory] = useState<string>('practitioner')
  const [rrOpen, setRrOpen] = useState(false)
  const sectionRefs = useRef<Partial<Record<'practitioner' | 'self-paced' | 'live' | 'group', HTMLElement | null>>>({})

  const rrPrograms = getProgramsBySeries('resonance-repatterning')
  const energyClearingPrograms = getProgramsBySeries('energy-clearing')
  const akashicPrograms = getProgramsBySeries('akashic-navigator')
  const selfStudyPrograms = getProgramsByCategory('self-paced')
  const livePrograms = getProgramsByCategory('live')
  const groupPrograms = getProgramsByCategory('group')

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    const ids = ['practitioner', 'self-paced', 'live', 'group'] as const

    ids.forEach((id) => {
      const el = sectionRefs.current[id]
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) setActiveCategory(id)
        },
        { threshold: 0.3 },
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <>
      {/* Header: shared PageHeader, the header rule. A group photo with the
          faces in the upper half, so the bottom-left text band clears them. */}
      <PageHeader
        id="programs-hero-heading"
        eyebrow="Programmes"
        image="/images/generated/group-coaching-real.webp"
        title="Find Your Path to Transformation"
        description={
          <>
            Choose the programme that fits your life, goals and readiness for
            change.
          </>
        }
      >
        <a
          href="#practitioner"
          className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 bg-white hover:bg-brand-sand text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
        >
          Explore Programmes
        </a>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 border border-white/50 hover:border-white text-white hover:bg-white/10 text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
        >
          Not sure? Book a Call
        </Link>
      </PageHeader>

      {/* Category navigation: sticky under the site header. Light grey so it reads
          as its own bar above the white Practitioner section. */}
      <nav aria-label="Programme categories" className="w-full bg-brand-sand py-4 lg:py-6 sticky top-16 lg:top-20 z-40 border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-8">
          <p className="flex-shrink-0 text-xs uppercase tracking-[0.3em] font-medium text-brand-accent">
            Browse by category
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                aria-current={activeCategory === cat.id ? 'true' : undefined}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-6 py-3 rounded-full text-base font-medium transition-colors duration-200 ${
                  activeCategory === cat.id
                    ? 'bg-brand-accent-600 text-white shadow-lg'
                    : 'border border-brand-primary-300 text-brand-muted hover:border-brand-accent hover:text-brand-primary'
                }`}
              >
                {cat.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Practitioner Programmes: bg-brand-cream (LIGHT) */}
      <section
        id="practitioner"
        ref={(el) => {
          sectionRefs.current['practitioner'] = el
        }}
        className="w-full bg-brand-cream py-20 lg:py-32 scroll-mt-48 lg:scroll-mt-44"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '0px' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Practitioner Programmes
            </p>
            <h2 className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary mb-4 max-w-2xl">
              Train as a Practitioner
            </h2>
            <p className="text-lg text-brand-muted font-light mb-12 max-w-2xl leading-relaxed">
              Become a practitioner in the healing arts and energy psychology.
              Transform your own life while gaining the tools to transform
              others.
            </p>
          </motion.div>

          <div className="space-y-8">
            {/* Resonance Repatterning: expandable parent block */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '0px' }}
              className="bg-brand-sand rounded-card p-8 lg:p-12"
            >
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div className="max-w-2xl">
                  <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
                    Certification Training
                  </p>
                  <h3 className="text-2xl lg:text-4xl font-medium tracking-tight text-brand-ink mb-4 leading-snug">
                    Resonance Repatterning
                  </h3>
                  <p className="text-brand-muted font-light leading-relaxed mb-3">
                    Train towards certification as a Resonance Repatterning
                    practitioner, from the Basic Five foundation series through
                    the advanced relationship and inner cultivation programmes.
                  </p>
                  <p className="text-sm text-brand-muted font-light">
                    All Resonance Repatterning programmes are currently offered
                    as self-study: start anytime.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRrOpen((open) => !open)}
                  aria-expanded={rrOpen}
                  aria-controls="rr-programme-list"
                  className="flex-shrink-0 inline-flex items-center justify-center gap-2 py-3 px-8 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-sm font-medium rounded-button transition-colors duration-300"
                >
                  {rrOpen ? 'Hide Programmes' : 'View the Programmes'}
                  <ChevronIcon open={rrOpen} />
                </button>
              </div>

              {rrOpen && (
                <motion.div
                  id="rr-programme-list"
                  variants={staggerChildren}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10"
                >
                  {rrPrograms.map((program) => (
                    <ProgramCard key={program.slug} program={program} />
                  ))}
                </motion.div>
              )}
            </motion.div>

            {/* Energy Clearing: parent block */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '0px' }}
              className="bg-brand-sand rounded-card p-8 lg:p-12"
            >
              <div className="max-w-2xl mb-10">
                <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
                  Practitioner Training
                </p>
                <h3 className="text-2xl lg:text-4xl font-medium tracking-tight text-brand-ink mb-4 leading-snug">
                  Energy Clearing
                </h3>
                <p className="text-brand-muted font-light leading-relaxed">
                  We are physical and energetic beings. Learn to clear your own
                  energy field at the Basic level, then train to facilitate
                  clearing for others at the Advanced level.
                </p>
              </div>
              <motion.div
                variants={staggerChildren}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '0px' }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {energyClearingPrograms.map((program) => (
                  <ProgramCard key={program.slug} program={program} />
                ))}
              </motion.div>
            </motion.div>

            {/* Akashic Navigator: parent block */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '0px' }}
              className="bg-brand-sand rounded-card p-8 lg:p-12"
            >
              <div className="max-w-2xl mb-10">
                <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
                  Practitioner Training
                </p>
                <h3 className="text-2xl lg:text-4xl font-medium tracking-tight text-brand-ink mb-4 leading-snug">
                  Akashic Navigator
                </h3>
                <p className="text-brand-muted font-light leading-relaxed">
                  Access and rewrite your life&apos;s blueprint through the
                  Akashic Records. Begin with reading and clearing your own
                  records, then advance to reading for others as an Akashic
                  Navigator &amp; Intuitive Coach.
                </p>
              </div>
              <motion.div
                variants={staggerChildren}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '0px' }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {akashicPrograms.map((program) => (
                  <ProgramCard key={program.slug} program={program} />
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Self-Study Programmes: bg-brand-sand (LIGHT) */}
      <section
        id="self-paced"
        ref={(el) => {
          sectionRefs.current['self-paced'] = el
        }}
        className="w-full bg-brand-sand py-20 lg:py-32 scroll-mt-48 lg:scroll-mt-44"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '0px' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Self-Study Programmes
            </p>
            <h2 className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary mb-4 max-w-2xl">
              Learn at Your Own Pace
            </h2>
            <p className="text-lg text-brand-muted font-light mb-12 max-w-2xl leading-relaxed">
              All programmes are recorded and you have access for as long as you
              need. Let your journey unfold in a time that is right for you.
            </p>
          </motion.div>
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '0px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {selfStudyPrograms.map((program) => (
              <DarkProgramCard key={program.slug} program={program} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Programmes: bg-brand-cream (LIGHT) */}
      <section
        id="live"
        ref={(el) => {
          sectionRefs.current['live'] = el
        }}
        className="w-full bg-brand-cream py-20 lg:py-32 scroll-mt-48 lg:scroll-mt-44"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '0px' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Live Programmes
            </p>
            <h2 className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary mb-4 max-w-2xl">
              Live with Suzanne via Zoom
            </h2>
            <p className="text-lg text-brand-muted font-light mb-12 max-w-2xl leading-relaxed">
              Programmes run live by Dr. Suzanne Ravenall on a range of topics
              designed to shift gear in life to a new way of being. Connect from
              anywhere in the world.
            </p>
          </motion.div>
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '0px' }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {livePrograms.map((program) => (
              <motion.div
                key={program.slug}
                variants={childVariants}
                className="group bg-brand-sand rounded-card p-8 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent">
                      Live
                    </p>
                    {/* TODO: Add UPCOMING badge here once program.nextDate is added to the Program type and real cohort dates are confirmed */}
                  </div>
                  <h3 className="text-xl font-medium text-brand-ink mb-3 leading-snug">
                    {program.name}
                  </h3>
                  <p className="text-brand-muted text-sm font-light leading-relaxed mb-4">
                    {program.shortDescription}
                  </p>
                  {formatPrice(program) && (
                    <p className="text-brand-primary font-semibold text-lg mb-2">
                      {formatPrice(program)}
                    </p>
                  )}
                  {program.duration && (
                    <p className="text-xs text-brand-muted mb-6">
                      {program.duration}
                    </p>
                  )}
                </div>
                <Link
                  href={`/programs/${program.slug}`}
                  className="inline-flex items-center justify-center w-full py-3 px-6 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-sm font-medium rounded-button transition-colors duration-300"
                >
                  Learn More
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Recorded Group Sessions: bg-brand-sand (LIGHT) */}
      <section
        id="group"
        ref={(el) => {
          sectionRefs.current['group'] = el
        }}
        className="w-full bg-brand-sand py-20 lg:py-32 scroll-mt-48 lg:scroll-mt-44"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '0px' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Resonance Repatterning
            </p>
            <h2 className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary mb-4 max-w-2xl">
              Recorded Group Sessions
            </h2>
            <p className="text-lg text-brand-muted font-light mb-4 max-w-2xl leading-relaxed">
              These are recorded Resonance Repatterning group session series.
              Through a comfortable, authentic and safe environment, Suzanne runs
              short group series that tackle the key issues affecting most
              people: getting into the unconscious beliefs that disrupt lives
              and helping participants go beyond these challenges and into their
              power for inner self mastery.
            </p>
            <p className="text-brand-muted font-light mb-12 max-w-2xl leading-relaxed">
              Each series was recorded live and carries the same energetic
              benefit: work through it in your own time.
            </p>
          </motion.div>
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '0px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {groupPrograms.map((program) => (
              <DarkProgramCard key={program.slug} program={program} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA: DARK (photo-backed CTA band) */}
      <section className="relative w-full bg-brand-primary-900 py-20 lg:py-32 overflow-hidden">
        {/* Background photo + black overlay: dark CTA bands carry imagery, never flat colour */}
        <Image
          src="/images/generated/session-coaching.webp"
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className="object-cover opacity-50"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/75 to-black/90"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '0px' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-6">
              Not Sure Where to Start?
            </p>
            <h2 className="text-4xl lg:text-6xl font-medium tracking-tight text-white mb-6">
              Not Sure Which Path Is Right for You?
            </h2>
            <p className="text-lg lg:text-xl text-white/80 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
              Book a free 30-minute discovery call. No obligation. Suzanne will
              help you identify the programme that best fits where you are and
              where you want to go.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center py-4 px-10 bg-white hover:bg-brand-sand text-brand-primary text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
            >
              Book Discovery Call
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}
