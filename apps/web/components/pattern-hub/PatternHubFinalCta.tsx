'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { masterPatternQuizUrl } from '@/data/patternQuizzes'

export default function PatternHubFinalCta() {
  return (
    <section aria-labelledby="pattern-hub-final-cta-heading" className="w-full bg-white py-20 lg:py-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2
            id="pattern-hub-final-cta-heading"
            className="text-3xl lg:text-5xl font-light text-brand-primary mb-4"
          >
            Start Where It Speaks to You
          </h2>
          <p className="text-base lg:text-lg text-gray-500 mb-10">
            You don&rsquo;t need to do all of them. Start with the one that
            feels most relevant right now.
          </p>
          <a
            href={masterPatternQuizUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-10 py-5 bg-brand-accent hover:bg-brand-accent-700 text-white font-medium text-base rounded-button transition-colors duration-300"
          >
            Take Your First Diagnostic
          </a>
          <div className="mt-8">
            <Link
              href="/explore"
              className="text-sm text-brand-primary/60 hover:text-brand-accent transition-colors duration-200"
            >
              ← Back to Explore
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}