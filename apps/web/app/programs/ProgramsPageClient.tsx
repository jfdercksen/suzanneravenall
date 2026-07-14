'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { getCurrencySymbol } from '@/lib/currency'
import { getProgramsByCategory, type Program } from '@/data/programs'

const CATEGORIES = [
  { id: 'practitioner', label: 'Practitioner' },
  { id: 'self-paced', label: 'Self-Paced' },
  { id: 'live', label: 'Live' },
  { id: 'group', label: 'Group' },
] as const

const getCategoryLabel = (category: string) =>
  CATEGORIES.find((c) => c.id === category)?.label ?? category

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
  return (
    <motion.div
      variants={childVariants}
      className="group bg-gray-50 rounded-card p-8 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col"
    >
      <div className="flex-1">
        <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
          {getCategoryLabel(program.category)}
        </p>
        <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-snug">
          {program.name}
        </h3>
        <p className="text-gray-600 text-sm font-light leading-relaxed mb-4">
          {program.shortDescription}
        </p>
        {program.duration && (
          <p className="text-xs text-gray-400 mb-6">{program.duration}</p>
        )}
      </div>
      <Link
        href={`/programs/${program.slug}`}
        className="inline-flex items-center justify-center w-full py-3 px-6 bg-brand-accent hover:bg-brand-accent-700 text-white text-sm font-medium rounded-button transition-colors duration-300"
      >
        Learn More
      </Link>
    </motion.div>
  )
}

function DarkProgramCard({ program }: { program: Program }) {
  return (
    <motion.div
      variants={childVariants}
      className="group relative overflow-hidden min-h-[320px] bg-gray-900 border border-white/5 rounded-card transition-all duration-500 hover:-translate-y-1 hover:border-brand-accent/40 hover:shadow-2xl flex flex-col"
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
        className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-transparent"
      />
      <div className="relative z-10 flex flex-col h-full p-8">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
            {getCategoryLabel(program.category)}
          </p>
          <h3 className="text-xl font-semibold text-white mb-3 leading-snug group-hover:text-brand-accent transition-colors duration-300">
            {program.name}
          </h3>
          <p className="text-white/65 text-sm font-light leading-relaxed mb-4">
            {program.shortDescription}
          </p>
          {program.price && (
            <p className="text-brand-accent font-semibold text-lg mb-2">
              {getCurrencySymbol(program.currency)}
              {program.price}
              {program.currency && (
                <span className="text-gray-500 text-sm font-normal ml-1">
                  {program.currency}
                </span>
              )}
            </p>
          )}
          {program.duration && (
            <p className="text-xs text-white/40 mb-6">{program.duration}</p>
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

export default function ProgramsPageClient() {
  const [activeCategory, setActiveCategory] = useState<string>('practitioner')
  const sectionRefs = useRef<Partial<Record<'practitioner' | 'self-paced' | 'live' | 'group', HTMLElement | null>>>({})

  const practitionerPrograms = getProgramsByCategory('practitioner')
  const selfPacedPrograms = getProgramsByCategory('self-paced')
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
      {/* Hero */}
      {/* Hero height leaves the category bar fully visible at the fold: 100vh minus sticky header (h-16/lg:h-20) minus category bar (taller stacked layout below lg) */}
      <section
        aria-labelledby="programs-hero-heading"
        className="relative h-[calc(100vh-188px)] lg:h-[calc(100vh-176px)] min-h-[560px] flex items-center overflow-hidden"
      >
        <Image
          src="/images/generated/group-coaching-real.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_theme(colors.brand.accent/15%),_transparent_50%)]"
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
              Programmes
            </p>
            <h1
              id="programs-hero-heading"
              className="text-4xl lg:text-6xl font-light text-white mb-6 leading-tight"
            >
              Find Your Path to Transformation
            </h1>
            <p className="text-lg lg:text-xl text-white/75 font-light max-w-xl mb-10 leading-relaxed">
              Choose the programme that fits your life, goals and readiness for
              change.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#practitioner"
                className="inline-flex items-center justify-center py-4 px-8 bg-brand-accent hover:bg-brand-accent-700 text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_30px_theme(colors.brand.accent/50%)]"
              >
                Explore Programmes
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center py-4 px-8 border border-white/40 hover:border-white text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-white/5"
              >
                Not sure? Book a Call
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category navigation — visible at the fold on load, sticky under site header */}
      <nav aria-label="Programme categories" className="w-full bg-gray-950 py-4 lg:py-6 sticky top-16 lg:top-20 z-40 border-b border-gray-800">
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
                    ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/25'
                    : 'border border-white/25 text-white hover:border-brand-accent hover:bg-white/5'
                }`}
              >
                {cat.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Practitioner Programmes — bg-white (LIGHT) */}
      <section
        id="practitioner"
        ref={(el) => {
          sectionRefs.current['practitioner'] = el
        }}
        className="w-full bg-white py-20 lg:py-32 scroll-mt-48 lg:scroll-mt-44"
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
            <h2 className="text-4xl lg:text-6xl font-light text-gray-900 mb-4 max-w-2xl">
              The Resonance Repatterning Series
            </h2>
            <p className="text-lg text-gray-600 font-light mb-12 max-w-2xl leading-relaxed">
              Become a practitioner in the healing arts and energy psychology.
              Transform your own life while gaining the tools to transform
              others.
            </p>
          </motion.div>
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '0px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {practitionerPrograms.map((program) => (
              <ProgramCard key={program.slug} program={program} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Self-Paced Programmes — bg-gray-950 (DARK) */}
      <section
        id="self-paced"
        ref={(el) => {
          sectionRefs.current['self-paced'] = el
        }}
        className="w-full bg-gray-950 py-20 lg:py-32 scroll-mt-48 lg:scroll-mt-44"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '0px' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Self-Paced Programmes
            </p>
            <h2 className="text-4xl lg:text-6xl font-light text-white mb-4 max-w-2xl">
              Learn at Your Own Pace
            </h2>
            <p className="text-lg text-white/70 font-light mb-12 max-w-2xl leading-relaxed">
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
            {selfPacedPrograms.map((program) => (
              <DarkProgramCard key={program.slug} program={program} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Programmes — bg-white (LIGHT) */}
      <section
        id="live"
        ref={(el) => {
          sectionRefs.current['live'] = el
        }}
        className="w-full bg-white py-20 lg:py-32 scroll-mt-48 lg:scroll-mt-44"
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
            <h2 className="text-4xl lg:text-6xl font-light text-gray-900 mb-4 max-w-2xl">
              Live with Suzanne via Zoom
            </h2>
            <p className="text-lg text-gray-600 font-light mb-12 max-w-2xl leading-relaxed">
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
                className="group bg-gray-50 rounded-card p-8 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent">
                      Live
                    </p>
                    {/* TODO: Add UPCOMING badge here once program.nextDate is added to the Program type and real cohort dates are confirmed */}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-snug">
                    {program.name}
                  </h3>
                  <p className="text-gray-600 text-sm font-light leading-relaxed mb-4">
                    {program.shortDescription}
                  </p>
                  {program.duration && (
                    <p className="text-xs text-gray-400 mb-6">
                      {program.duration}
                    </p>
                  )}
                </div>
                <Link
                  href={`/programs/${program.slug}`}
                  className="inline-flex items-center justify-center w-full py-3 px-6 bg-brand-accent hover:bg-brand-accent-700 text-white text-sm font-medium rounded-button transition-colors duration-300"
                >
                  Learn More
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Group & Corporate — bg-gray-950 (DARK) — was bg-gray-50, fixed alternation */}
      <section
        id="group"
        ref={(el) => {
          sectionRefs.current['group'] = el
        }}
        className="w-full bg-gray-950 py-20 lg:py-32 scroll-mt-48 lg:scroll-mt-44"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '0px' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Group &amp; Corporate
            </p>
            <h2 className="text-4xl lg:text-6xl font-light text-white mb-4 max-w-2xl">
              Group Sessions &amp; Corporate Wellness
            </h2>
            <p className="text-lg text-white/70 font-light mb-4 max-w-2xl leading-relaxed">
              Through a comfortable, authentic and safe environment, Suzanne
              runs short group series that tackle the key issues affecting most
              people. She gets into the unconscious beliefs that disrupt lives
              and helps participants go beyond these challenges and into their
              power for inner self mastery.
            </p>
            <p className="text-white/50 font-light mb-12 max-w-2xl leading-relaxed">
              It simply creates a better life for those who are courageous enough
              to try.
            </p>
          </motion.div>
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '0px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
          >
            {groupPrograms.map((program) => (
              <DarkProgramCard key={program.slug} program={program} />
            ))}
          </motion.div>

          {/* Corporate CTA */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '0px' }}
            className="bg-brand-primary rounded-3xl p-10 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-8"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
                Corporate Wellness
              </p>
              <h3 className="text-3xl lg:text-4xl font-light text-white mb-3">
                Corporate Retreats &amp; Team Wellness
              </h3>
              <p className="text-white/70 font-light max-w-xl leading-relaxed">
                Bespoke wellness retreats and group programmes tailored to your
                organisation. Help your team unlock their potential, reduce
                stress, and build a culture of inner resilience and performance.
              </p>
            </div>
            <Link
              href="/contact"
              className="flex-shrink-0 inline-flex items-center justify-center py-4 px-10 bg-brand-accent hover:bg-brand-accent-700 text-white font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_30px_theme(colors.brand.accent/50%)] whitespace-nowrap"
            >
              Enquire About Group Sessions
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Final CTA — bg-brand-primary (DARK) */}
      <section className="w-full bg-brand-primary py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '0px' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
              Not Sure Where to Start?
            </p>
            <h2 className="text-4xl lg:text-6xl font-light text-white mb-6">
              Not Sure Which Path Is Right for You?
            </h2>
            <p className="text-lg lg:text-xl text-white/70 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
              Book a free 30-minute discovery call. No obligation. Suzanne will
              help you identify the programme that best fits where you are and
              where you want to go.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center py-4 px-10 bg-brand-accent hover:bg-brand-accent-700 text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_40px_theme(colors.brand.accent/60%)]"
            >
              Book Discovery Call
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}
