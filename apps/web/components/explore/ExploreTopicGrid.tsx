'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { topics, type TopicSlug } from '@/app/explore/topics'

const ADVANCE_MS = 4000

const TOPIC_IMAGES: Record<TopicSlug, string> = {
  'emotional-nervous-system-mastery': '/images/generated/explore-energy.webp',
  'relationships-attachment-patterns': '/images/generated/session-coaching.webp',
  'next-level-health-vitality-longevity': '/images/generated/explore-mindfulness.webp',
  'intuition-as-patterned-intelligence': '/images/generated/explore-akashic.webp',
  'leadership-high-performance': '/images/generated/explore-transformation.webp',
  'life-transitions-reinvention': '/images/generated/explore-purpose.webp',
  'health-energy-intelligence': '/images/generated/explore-resonance.webp',
  'identity-purpose-activation': '/images/generated/explore-repatterning.webp',
}

export default function ExploreTopicGrid() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeTopic = topics[activeIndex]

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    clearTimer()
    timerRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % topics.length)
    }, ADVANCE_MS)
  }, [clearTimer])

  useEffect(() => {
    if (!paused) startTimer()
    else clearTimer()
    return clearTimer
  }, [paused, startTimer, clearTimer])

  const selectTopic = useCallback(
    (i: number) => {
      setActiveIndex(i)
      if (!paused) startTimer()
    },
    [paused, startTimer],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      selectTopic((activeIndex + 1) % topics.length)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      selectTopic((activeIndex - 1 + topics.length) % topics.length)
    }
  }

  return (
    <section
      aria-labelledby="explore-topic-grid-heading"
      className="w-full bg-brand-primary-900 py-20 lg:py-32"
    >
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 lg:mb-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
            Eight Patterns. One System.
          </p>
          <h2
            id="explore-topic-grid-heading"
            className="text-4xl lg:text-6xl font-light text-white leading-tight"
          >
            Choose the area you&rsquo;re ready to{' '}
            <span className="text-brand-accent">repattern</span>
          </h2>
        </motion.div>
      </div>

      {/* ── Desktop: two-panel interactive layout ──────────────────────── */}
      <div
        className="hidden lg:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-8 min-h-[640px] items-stretch"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* LEFT PANEL — topic list (40%) */}
        <div
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="w-2/5 flex flex-col justify-center gap-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary-900 rounded-card"
        >
          {topics.map((topic, i) => {
            const active = i === activeIndex
            return (
              <button
                key={topic.slug}
                id={`explore-topic-${i}`}
                onClick={() => selectTopic(i)}
                className={[
                  'group text-left border-l-2 pl-6 py-3.5 transition-all duration-300',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-inset',
                  active
                    ? 'border-brand-accent'
                    : 'border-white/10 hover:border-brand-accent/40',
                ].join(' ')}
              >
                <span
                  className={`block text-[10px] font-semibold tracking-[0.3em] uppercase mb-1 transition-colors duration-300 ${
                    active ? 'text-brand-accent' : 'text-white/25'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={`block text-base lg:text-lg font-semibold leading-tight transition-colors duration-300 ${
                    active ? 'text-white' : 'text-white/50 group-hover:text-white/75'
                  }`}
                >
                  {topic.title}
                </span>
                <span
                  className={`block text-sm font-light leading-relaxed overflow-hidden transition-all duration-500 text-white/60 ${
                    active ? 'max-h-10 opacity-100 mt-1.5' : 'max-h-0 opacity-0'
                  }`}
                >
                  {topic.shortDescription}
                </span>
              </button>
            )
          })}
        </div>

        {/* RIGHT PANEL — active topic display (60%) */}
        <div className="relative w-3/5 h-full rounded-card overflow-hidden">
          {/* Progress bar — key resets animation on every topic change */}
          {!paused && (
            <motion.div
              key={`progress-${activeIndex}`}
              className="absolute top-0 left-0 h-0.5 bg-brand-accent z-20"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: ADVANCE_MS / 1000, ease: 'linear' }}
            />
          )}

          {/* Crossfading background image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`img-${activeTopic.slug}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <Image
                src={TOPIC_IMAGES[activeTopic.slug]}
                alt=""
                aria-hidden="true"
                fill
                sizes="60vw"
                className="object-cover object-center"
              />
            </motion.div>
          </AnimatePresence>

          {/* Bottom gradient overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent"
          />

          {/* Crossfading content block */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${activeTopic.slug}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute bottom-0 left-0 right-0 z-20 p-10"
            >
              <p className="text-[10px] uppercase tracking-[0.35em] font-semibold text-brand-accent mb-3">
                Areas of Focus
              </p>
              <h3 className="text-2xl lg:text-4xl font-light text-white leading-tight mb-3">
                {activeTopic.heroHeadline}
              </h3>
              <p className="text-white/65 text-sm lg:text-base font-light leading-relaxed mb-2 max-w-lg">
                {activeTopic.shortDescription}
              </p>
              <p className="italic text-white/40 text-xs mb-8 max-w-md">
                &ldquo;{activeTopic.corePrinciple}&rdquo;
              </p>
              <Link
                href={`/explore/${activeTopic.slug}`}
                className="inline-flex items-center gap-3 px-6 py-3 bg-brand-accent hover:bg-brand-accent/90 text-white text-xs uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_24px_rgba(23,25,244,0.5)]"
              >
                Explore this pattern
                <span aria-hidden="true">→</span>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Mobile: stacked cards ─────────────────────────────────────── */}
      <ul className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        {topics.map((topic, i) => (
          <li key={topic.slug}>
            <Link
              href={`/explore/${topic.slug}`}
              className="group relative flex flex-col justify-end overflow-hidden rounded-card min-h-[300px] focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary-900"
            >
              <Image
                src={TOPIC_IMAGES[topic.slug]}
                alt=""
                aria-hidden="true"
                fill
                sizes="(max-width: 1024px) 100vw"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/40 to-black/10"
              />
              <div className="relative z-10 p-6">
                <span className="block text-[10px] uppercase tracking-[0.3em] font-semibold text-brand-accent mb-2">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-lg font-semibold text-white leading-tight mb-2">
                  {topic.title}
                </h3>
                <p className="text-white/65 text-sm font-light leading-relaxed mb-4">
                  {topic.shortDescription}
                </p>
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-medium text-white/50 group-hover:text-brand-accent transition-colors duration-300">
                  Explore{' '}
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
