'use client'

import { motion } from 'framer-motion'
import { masterPatternQuizUrl } from '@/data/patternQuizzes'

// Above the fold — entrance uses `animate` (not whileInView).
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

export default function PatternHubHero() {
  return (
    <section
      aria-labelledby="pattern-hub-hero-heading"
      className="relative w-full overflow-hidden bg-brand-primary"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-primary-800 to-brand-primary-900"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-brand-accent/10 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-40">
        <div className="max-w-4xl">
          <motion.p
            {...fadeUp(0)}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
          >
            Pattern Diagnostic Hub
          </motion.p>

          <motion.h1
            id="pattern-hub-hero-heading"
            {...fadeUp(0.1)}
            className="text-4xl lg:text-6xl font-light text-white leading-[1.05] mb-8"
          >
            Discover the Pattern Running Your Life
          </motion.h1>

          <motion.div {...fadeUp(0.2)} className="text-lg text-white/70 font-light mb-4 space-y-2">
            <p>
              Every challenge you&rsquo;re facing — emotional, relational,
              physical or performance-based — is shaped by a pattern.
            </p>
            <p>Identify yours.</p>
            <p>Understand it.</p>
            <p>Rewire it.</p>
          </motion.div>

          <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-4 mt-10">
            <a
              href={masterPatternQuizUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent hover:bg-brand-accent-700 text-white font-medium text-sm rounded-button transition-colors duration-300 whitespace-nowrap"
            >
              Start with Emotional Patterns
            </a>
            <a
              href="#assessments"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 hover:border-white text-white font-medium text-sm rounded-button transition-colors duration-300 whitespace-nowrap"
            >
              Explore All Assessments
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}