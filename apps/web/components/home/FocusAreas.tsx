'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const areas = [
  {
    number: '01',
    title: 'Emotional & Nervous System',
    slug: 'emotional-nervous-system-mastery',
    outcome: 'Rewire from anxiety to sustainable calm',
    image: '/images/focus/neuro.jpg',
  },
  {
    number: '02',
    title: 'Relationships & Attachment',
    slug: 'relationships-attachment-patterns',
    outcome: 'Break the pattern. Choose differently.',
    image: '/images/focus/relationships.webp',
  },
  {
    number: '03',
    title: 'Health & Vitality',
    slug: 'next-level-health-vitality-longevity',
    outcome: 'Your body follows your energy field',
    image: '/images/generated/explore-energy.webp',
  },
  {
    number: '04',
    title: 'Leadership & Performance',
    slug: 'leadership-high-performance',
    outcome: 'Your ceiling is a pattern, not a limit',
    image: '/images/focus/business.jpg',
  },
  {
    number: '05',
    title: 'Life Transitions',
    slug: 'life-transitions-reinvention',
    outcome: "You're not lost. You're between identities.",
    image: '/images/generated/explore-transformation.webp',
  },
  {
    number: '06',
    title: 'Identity & Purpose',
    slug: 'identity-purpose-activation',
    outcome: "Purpose isn't found. It's uncovered.",
    image: '/images/focus/purpose.webp',
  },
]

export default function FocusAreas() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const areasLength = areas.length

  useEffect(() => {
    if (isPaused) return
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % areasLength)
    }, 3000)
    return () => clearInterval(id)
  }, [isPaused, activeIndex, areasLength])

  const activeArea = areas[activeIndex]!

  return (
    <section
      aria-label="Areas of Focus"
      className="bg-gray-950 py-20 lg:py-32"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <motion.div
          className="mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-brand-accent text-xs font-medium uppercase tracking-[0.3em] mb-3">
            Areas of Focus
          </p>
          <h2 className="text-4xl lg:text-6xl font-light text-white">
            Where do you need the breakthrough?
          </h2>
        </motion.div>

        {/* Desktop: two-panel layout */}
        <motion.div
          className="hidden lg:flex h-[620px] rounded-card overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Left panel — 35% — numbered list */}
          <div className="w-[35%] bg-gray-900 flex flex-col justify-center overflow-y-auto">
            {areas.map((area, i) => {
              const isActive = activeIndex === i
              return (
                <button
                  key={area.slug}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`flex items-start gap-4 w-full px-8 py-5 border-l-2 text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-inset ${
                    isActive
                      ? 'border-brand-accent bg-white/5 opacity-100'
                      : 'border-transparent hover:bg-white/5 opacity-50 hover:opacity-75'
                  }`}
                >
                  <span className="text-brand-accent text-xs font-mono font-semibold mt-1 flex-shrink-0">
                    {area.number}
                  </span>
                  <div>
                    <p className="text-white font-semibold text-base leading-snug">{area.title}</p>
                    <p
                      className={`text-white/50 text-sm mt-1 leading-snug transition-all duration-300 ${
                        isActive ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0 overflow-hidden'
                      }`}
                    >
                      {area.outcome}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right panel — 65% — full-height image */}
          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <Image
                  src={activeArea.image}
                  alt={activeArea.title}
                  fill
                  sizes="65vw"
                  className="object-cover"
                  priority={activeIndex === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </motion.div>
            </AnimatePresence>

            {/* Panel content — fades with image */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${activeIndex}`}
                className="absolute bottom-0 left-0 right-0 p-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <p className="text-brand-accent text-xs font-mono uppercase tracking-[0.3em] mb-3">
                  {activeArea.number}
                </p>
                <h3 className="text-4xl lg:text-5xl font-light text-white mb-4 leading-tight">
                  {activeArea.title}
                </h3>
                <p className="text-white/70 text-lg mb-8 leading-relaxed">
                  {activeArea.outcome}
                </p>
                <Link
                  href={`/explore/${activeArea.slug}`}
                  className="inline-flex items-center gap-2 text-white text-sm font-semibold uppercase tracking-widest border-b border-white/40 hover:border-white pb-0.5 transition-colors duration-200"
                >
                  Explore {activeArea.title}
                  <span aria-hidden="true">→</span>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Mobile: stacked cards */}
        <div className="lg:hidden space-y-4">
          {areas.map((area, i) => (
            <motion.div
              key={area.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: 'easeOut' }}
            >
              <Link
                href={`/explore/${area.slug}`}
                className="relative block aspect-[3/2] rounded-card overflow-hidden group"
              >
                <Image
                  src={area.image}
                  alt={area.title}
                  fill
                  sizes="100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-brand-accent text-xs font-mono uppercase tracking-[0.3em] mb-1">
                    {area.number}
                  </p>
                  <h3 className="text-xl font-semibold text-white leading-tight">{area.title}</h3>
                  <p className="text-white/60 text-sm mt-1">{area.outcome}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
