'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { patternQuizzes } from '@/data/patternQuizzes'
import { getQuizTopicSlug } from './topicQuizMap'

const fadeUpInView = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

// Teaser subset: derived from the canonical quiz catalogue so titles and the
// "+N more" count can't drift when quizzes are added or reworded.
const TEASER_SLUGS = ['nervous-system', 'relationships', 'identity-purpose']
const teaserQuizzes = patternQuizzes.filter((quiz) => TEASER_SLUGS.includes(quiz.slug))
const remainingCount = patternQuizzes.length - teaserQuizzes.length

export default function ExploreDiagnosticCTA() {
  return (
    <section
      aria-labelledby="explore-diagnostic-heading"
      className="w-full py-12 lg:py-16 bg-brand-cream"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: text */}
          <motion.div {...fadeUpInView(0)}>
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Free Diagnostic
            </p>
            <h2
              id="explore-diagnostic-heading"
              className="text-3xl lg:text-4xl font-medium tracking-tight text-brand-primary mb-4"
            >
              Not sure where to start?
            </h2>
            <p className="text-brand-muted text-base mb-8">
              Every topic on this page connects to a pattern running beneath
              the surface. Take a free diagnostic to find out which one is
              shaping your life right now.
            </p>
            <Link
              href="/discover-your-pattern"
              className="inline-flex items-center gap-2 rounded-button bg-brand-accent text-white px-8 py-3 text-sm font-medium hover:bg-brand-accent-700 transition-colors duration-200"
            >
              Take the Free Pattern Scan
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </motion.div>

          {/* Right: 3 sample quiz names as teaser cards */}
          <motion.div
            {...fadeUpInView(0.1)}
            className="hidden lg:flex flex-col gap-3 mt-8 lg:mt-0"
          >
            {teaserQuizzes.map((quiz, i) => {
              const topicSlug = getQuizTopicSlug(quiz.slug)
              return (
                <Link
                  key={quiz.slug}
                  href={topicSlug ? `/explore/${topicSlug}/quiz` : '/discover-your-pattern#assessments'}
                  className="group bg-brand-sand border border-brand-border hover:border-brand-accent rounded-card px-5 py-3 flex items-center gap-3 transition-colors duration-200"
                >
                  <span className="text-brand-accent font-medium text-sm shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-brand-muted group-hover:text-brand-primary text-sm leading-snug transition-colors duration-200">
                    {quiz.question}
                  </span>
                </Link>
              )
            })}
            <Link
              href="/discover-your-pattern#assessments"
              className="text-brand-muted hover:text-brand-accent text-xs text-right mt-1 underline-offset-4 hover:underline transition-colors duration-200"
            >
              + {remainingCount} more diagnostics available
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}