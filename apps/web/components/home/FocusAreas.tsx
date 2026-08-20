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
      className="bg-white py-14 lg:py-24"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      // Keyboard parity with the mouse pause (WCAG 2.2.2): React's onFocus/onBlur
      // use focusin/focusout, so focus anywhere inside pauses the auto-advance
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <motion.div
          className="mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-brand-accent text-xs font-medium uppercase tracking-[0.3em] mb-3">
            Areas of Focus
          </p>
          <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight text-brand-primary">
            Where do you need the breakthrough?
          </h2>
        </motion.div>

        {/* Desktop: giant stacked words + tall image — the reference site's
            "pillars" editorial pattern. No card frame: the type IS the layout. */}
        <motion.div
          className="hidden lg:grid grid-cols-2 gap-12 xl:gap-20 items-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Left — area names as giant statement type */}
          <div>
            {areas.map((area, i) => {
              const isActive = activeIndex === i
              return (
                // h3 wraps the button (valid: h3 takes phrasing content) so the
                // area names stay in the heading outline, matching the mobile cards
                <h3 key={area.slug}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-current={isActive ? 'true' : undefined}
                  className="group block w-full py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-sm"
                >
                  <span
                    className={`block text-4xl xl:text-5xl font-semibold tracking-tight leading-[1.08] transition-colors duration-300 ${
                      isActive ? 'text-brand-primary' : 'text-gray-500 group-hover:text-brand-primary'
                    }`}
                  >
                    {area.title}
                  </span>
                  {/* Flat accent bar marks the active word — constant height so the
                      stack never jumps when selection changes */}
                  <span
                    aria-hidden="true"
                    className={`block h-1 mt-2 bg-brand-accent transition-all duration-500 ${
                      isActive ? 'w-16' : 'w-0'
                    }`}
                  />
                </button>
                </h3>
              )
            })}
          </div>

          {/* Right — tall image pane, crossfades with selection */}
          <div className="relative h-[560px] xl:h-[620px] rounded-card overflow-hidden shadow-card-hover">
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
                  sizes="50vw"
                  className="object-cover"
                  priority={activeIndex === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </motion.div>
            </AnimatePresence>

            {/* Pane content — the giant word on the left is the title, so the
                pane carries only number, outcome and the explore link */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${activeIndex}`}
                className="absolute bottom-0 left-0 right-0 p-8 xl:p-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <p className="text-white/80 text-xs font-mono uppercase tracking-[0.3em] mb-2">
                  {activeArea.number}
                </p>
                <p className="text-white text-xl xl:text-2xl font-medium mb-6 leading-snug">
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
              viewport={{ once: true, margin: '0px' }}
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
                  <p className="text-white/80 text-xs font-mono uppercase tracking-[0.3em] mb-1">
                    {area.number}
                  </p>
                  <h3 className="text-xl font-semibold text-white leading-tight">{area.title}</h3>
                  <p className="text-white/80 text-sm mt-1">{area.outcome}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
