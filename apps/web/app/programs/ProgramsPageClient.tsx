'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { getProgramsByCategory, type Program } from '@/data/programs'

const CATEGORIES = [
  { id: 'practitioner', label: 'Practitioner' },
  { id: 'self-paced', label: 'Self-Paced' },
  { id: 'live', label: 'Live' },
  { id: 'group', label: 'Group' },
] as const

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const staggerChildren = {
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
      className="group bg-gray-50 rounded-2xl p-8 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col"
    >
      <div className="flex-1">
        <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
          {program.category === 'practitioner'
            ? 'Practitioner'
            : program.category === 'self-paced'
              ? 'Self-Paced'
              : program.category === 'live'
                ? 'Live'
                : 'Group'}
        </p>
        <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-snug">
          {program.name}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {program.shortDescription}
        </p>
        {program.duration && (
          <p className="text-xs text-gray-400 mb-6">{program.duration}</p>
        )}
      </div>
      <Link
        href={`/programs/${program.slug}`}
        className="inline-flex items-center justify-center w-full py-3 px-6 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-sm font-medium rounded-lg transition-colors duration-300"
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
      className="group bg-gray-900 rounded-2xl p-8 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col"
    >
      <div className="flex-1">
        <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
          Self-Paced
        </p>
        <h3 className="text-xl font-semibold text-white mb-3 leading-snug">
          {program.name}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          {program.shortDescription}
        </p>
        {program.price && (
          <p className="text-brand-accent font-semibold text-lg mb-2">
            {program.currency === 'USD' ? '$' : 'R'}
            {program.price}
            {program.currency && (
              <span className="text-gray-500 text-sm font-normal ml-1">
                {program.currency}
              </span>
            )}
          </p>
        )}
        {program.duration && (
          <p className="text-xs text-gray-500 mb-6">{program.duration}</p>
        )}
      </div>
      <Link
        href={`/programs/${program.slug}`}
        className="inline-flex items-center justify-center w-full py-3 px-6 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-sm font-medium rounded-lg transition-colors duration-300"
      >
        Learn More
      </Link>
    </motion.div>
  )
}

export default function ProgramsPageClient() {
  const [activeCategory, setActiveCategory] = useState<string>('practitioner')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  const practitionerPrograms = getProgramsByCategory('practitioner')
  const selfPacedPrograms = getProgramsByCategory('self-paced')
  const livePrograms = getProgramsByCategory('live')
  const groupPrograms = getProgramsByCategory('group')

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    const ids = ['practitioner', 'self-paced', 'live', 'group']

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
    <main>
      {/* Hero */}
      <section className="w-full bg-brand-primary py-32 md:py-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
              PROGRAMMES
            </p>
            <h1 className="text-4xl md:text-6xl font-light text-white mb-6 leading-tight">
              Find Your Path to Transformation
            </h1>
            <p className="text-xl text-gray-300 mb-10 leading-relaxed">
              Choose the programme that fits your life, goals and readiness for
              change.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#practitioner"
                className="inline-flex items-center justify-center py-4 px-8 border border-white text-white font-medium rounded-lg hover:bg-white hover:text-brand-primary transition-colors duration-300"
              >
                Explore Programmes ↓
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center py-4 px-8 text-gray-300 hover:text-white font-medium transition-colors duration-300"
              >
                Not sure? Book a Call
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category navigation */}
      <section className="w-full bg-gray-950 py-8 sticky top-16 z-40 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  activeCategory === cat.id
                    ? 'bg-brand-accent text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {cat.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Practitioner Programmes */}
      <section
        id="practitioner"
        ref={(el) => {
          sectionRefs.current['practitioner'] = el
        }}
        className="w-full bg-white py-20 md:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              PRACTITIONER PROGRAMMES
            </p>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-4 max-w-2xl">
              The Resonance Repatterning Series
            </h2>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl leading-relaxed">
              Become a practitioner in the healing arts and energy psychology.
              Transform your own life while gaining the tools to transform
              others.
            </p>
          </motion.div>
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {practitionerPrograms.map((program) => (
              <ProgramCard key={program.slug} program={program} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Self-Paced Programmes */}
      <section
        id="self-paced"
        ref={(el) => {
          sectionRefs.current['self-paced'] = el
        }}
        className="w-full bg-gray-950 py-20 md:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              SELF-PACED PROGRAMMES
            </p>
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4 max-w-2xl">
              Learn at Your Own Pace
            </h2>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl leading-relaxed">
              All programmes are recorded and you have access for as long as you
              need. Let your journey unfold in a time that is right for you.
            </p>
          </motion.div>
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {selfPacedPrograms.map((program) => (
              <DarkProgramCard key={program.slug} program={program} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Programmes */}
      <section
        id="live"
        ref={(el) => {
          sectionRefs.current['live'] = el
        }}
        className="w-full bg-white py-20 md:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              LIVE PROGRAMMES
            </p>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-4 max-w-2xl">
              Live with Suzanne via Zoom
            </h2>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl leading-relaxed">
              Programmes run live by Dr. Suzanne Ravenall on a range of topics
              designed to shift gear in life to a new way of being. Connect from
              anywhere in the world.
            </p>
          </motion.div>
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {livePrograms.map((program) => (
              <motion.div
                key={program.slug}
                variants={childVariants}
                className="group bg-gray-50 rounded-2xl p-8 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent">
                      Live
                    </p>
                    <span className="text-xs font-medium bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-full">
                      UPCOMING
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-snug">
                    {program.name}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
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
                  className="inline-flex items-center justify-center w-full py-3 px-6 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-sm font-medium rounded-lg transition-colors duration-300"
                >
                  Learn More
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Group & Corporate */}
      <section
        id="group"
        ref={(el) => {
          sectionRefs.current['group'] = el
        }}
        className="w-full bg-gray-50 py-20 md:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              GROUP & CORPORATE
            </p>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-4 max-w-2xl">
              Group Sessions & Corporate Wellness
            </h2>
            <p className="text-lg text-gray-600 mb-4 max-w-2xl leading-relaxed">
              Through a comfortable, authentic and safe environment, Suzanne
              runs short group series that tackle the key issues affecting most
              people. She gets into the unconscious beliefs that disrupt lives
              and helps participants go beyond these challenges and into their
              power for inner self mastery.
            </p>
            <p className="text-gray-500 mb-12 max-w-2xl leading-relaxed">
              It simply creates a better life for those who are courageous enough
              to try.
            </p>
          </motion.div>
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
          >
            {groupPrograms.map((program) => (
              <ProgramCard key={program.slug} program={program} />
            ))}
          </motion.div>

          {/* Corporate CTA */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="bg-brand-primary rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
                CORPORATE WELLNESS
              </p>
              <h3 className="text-3xl md:text-4xl font-light text-white mb-3">
                Corporate Retreats & Team Wellness
              </h3>
              <p className="text-gray-300 max-w-xl leading-relaxed">
                Bespoke wellness retreats and group programmes tailored to your
                organisation. Help your team unlock their potential, reduce
                stress, and build a culture of inner resilience and performance.
              </p>
            </div>
            <Link
              href="/contact"
              className="flex-shrink-0 inline-flex items-center justify-center py-4 px-10 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-medium rounded-lg transition-colors duration-300 whitespace-nowrap"
            >
              Enquire About Group Sessions
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Not sure? CTA */}
      <section className="w-full bg-brand-primary py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
              NOT SURE WHERE TO START?
            </p>
            <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
              Not Sure Which Path Is Right for You?
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Book a free 30-minute discovery call. No obligation. Suzanne will
              help you identify the programme that best fits where you are and
              where you want to go.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center py-4 px-10 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold rounded-lg transition-colors duration-300 text-lg"
            >
              Book Discovery Call →
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
