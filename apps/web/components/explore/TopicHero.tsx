'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Topic } from '@/app/explore/topics'
import { getTopicQuiz, getTopicQuizLabel } from '@/components/explore/topicQuizMap'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: 'easeOut' as const },
})

export default function TopicHero({ topic }: { topic: Topic }) {
  const quiz = getTopicQuiz(topic.slug)
  const quizLabel = getTopicQuizLabel(topic.slug)

  const handleScrollToApproach = () => {
    const el = document.getElementById('approach')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      aria-labelledby="topic-hero-heading"
      className="relative w-full overflow-hidden min-h-screen flex items-center"
    >
      {/* Per-topic background image */}
      <Image
        src={topic.image}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Multi-layer dark overlay for legibility */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/80"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-48">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          aria-label="Breadcrumb"
          className="mb-12 text-xs uppercase tracking-[0.3em] font-medium text-white/80"
        >
          <Link
            href="/explore"
            className="transition-colors duration-300 hover:text-white"
          >
            Explore
          </Link>
          <span aria-hidden="true" className="mx-3">/</span>
          <span className="text-white">{topic.title}</span>
        </motion.nav>

        <div className="max-w-4xl">
          {/* Opening question — pattern interrupt, white with shadow to read against any image */}
          <motion.p
            {...fadeUp(0.1)}
            className="text-white text-lg lg:text-xl font-light italic mb-6 leading-relaxed drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]"
          >
            {topic.openingQuestion}
          </motion.p>

          {/* Main headline */}
          <motion.h1
            id="topic-hero-heading"
            {...fadeUp(0.2)}
            className="text-4xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.05] mb-8"
          >
            {topic.heroHeadline}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            {...fadeUp(0.3)}
            className="text-lg lg:text-xl text-white/75 font-light max-w-2xl leading-relaxed mb-12"
          >
            {topic.heroSubheadline}
          </motion.p>

          {/* CTAs — quiz first, discovery call second (Suzanne, 27 Jul 2026).
              Reduced padding on mobile so both buttons fit in the initial viewport */}
          <motion.div {...fadeUp(0.4)} className="flex flex-wrap items-center gap-3">
            {quiz ? (
              <Link
                href={`/explore/${topic.slug}/quiz`}
                className="inline-flex items-center justify-center px-6 py-3 lg:px-8 lg:py-4 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:shadow-[0_0_30px_theme(colors.brand.accent/50%)]"
              >
                {quizLabel}
              </Link>
            ) : (
              <Link
                href="/discover-your-pattern"
                className="inline-flex items-center justify-center px-6 py-3 lg:px-8 lg:py-4 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:shadow-[0_0_30px_theme(colors.brand.accent/50%)]"
              >
                Take the Free Pattern Scan
              </Link>
            )}
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 lg:px-8 lg:py-4 border border-white/40 hover:border-white/80 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-white/10"
            >
              Book a Discovery Call
            </Link>
            <button
              type="button"
              onClick={handleScrollToApproach}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 text-white/70 hover:text-white font-semibold text-sm uppercase tracking-widest transition-colors duration-300"
            >
              Explore the Method
              <span aria-hidden="true" className="inline-block">↓</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        aria-hidden="true"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg
            className="w-6 h-6 text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  )
}
