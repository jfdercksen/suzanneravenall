'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import PatternDiagnosticIllustration from '@/components/discover/PatternDiagnosticIllustration'
import { masterPatternQuizUrl } from '@/data/patternQuizzes'

// Above the fold — entrance uses `animate` (not whileInView).
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

export default function PatternHubHero() {
  // Mount the illustration only at lg+ — CSS `hidden` alone would leave its
  // infinite Framer Motion animations running off-screen on mobile.
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return (
    <section
      aria-labelledby="pattern-hub-hero-heading"
      className="relative w-full overflow-hidden bg-white"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-4xl self-center">
            <motion.p
              {...fadeUp(0)}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              Pattern Diagnostic Hub
            </motion.p>

            <motion.h1
              id="pattern-hub-hero-heading"
              {...fadeUp(0.1)}
              className="text-4xl sm:text-5xl lg:text-7xl font-semibold tracking-tight text-brand-primary leading-[1.05] mb-8"
            >
              Discover the Pattern Running Your Life
            </motion.h1>

            <motion.div {...fadeUp(0.2)} className="text-lg text-gray-600 font-light mb-4 space-y-2">
              <p>
                Every challenge you&rsquo;re facing (emotional, relational,
                physical or performance-based) is shaped by a pattern.
              </p>
              <p>Identify yours.</p>
              <p>Understand it.</p>
              <p>Rewire it.</p>
            </motion.div>

            <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-4 mt-10">
              <Link
                href={masterPatternQuizUrl}
                className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent hover:bg-brand-accent-700 text-white font-medium text-sm rounded-button transition-colors duration-300 whitespace-nowrap"
              >
                Start with Emotional Patterns
              </Link>
              <a
                href="#assessments"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 hover:border-brand-primary text-gray-600 hover:text-brand-primary font-medium text-sm rounded-button transition-colors duration-300 whitespace-nowrap"
              >
                Explore All Assessments
              </a>
            </motion.div>
          </div>

          {isDesktop && (
            <motion.div
              {...fadeUp(0.3)}
              className="hidden lg:flex justify-center self-center"
            >
              <PatternDiagnosticIllustration />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}