'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { masterPatternQuizUrl } from '@/data/patternQuizzes'

export default function PatternHubFinalCta() {
  return (
    <section
      aria-labelledby="pattern-hub-final-cta-heading"
      className="relative w-full bg-brand-primary py-20 lg:py-32 overflow-hidden"
    >
      {/* Background photo + navy overlay — dark sections carry imagery, never flat colour */}
      <Image
        src="/images/generated/group-coaching-real.webp"
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="object-cover opacity-50"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-brand-primary/90 via-brand-primary/75 to-brand-primary/90"
      />
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2
            id="pattern-hub-final-cta-heading"
            className="text-4xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.05] mb-4"
          >
            Start Where It Speaks to You
          </h2>
          <p className="text-base lg:text-lg text-white/80 mb-10">
            You don&rsquo;t need to do all of them. Start with the one that
            feels most relevant right now.
          </p>
          <Link
            href={masterPatternQuizUrl}
            className="inline-flex items-center justify-center px-10 py-5 bg-brand-accent hover:bg-brand-accent-700 text-white font-medium text-base rounded-button transition-colors duration-300"
          >
            Take Your First Diagnostic
          </Link>
          <div className="mt-8">
            <Link
              href="/explore"
              className="text-sm text-white/70 hover:text-white transition-colors duration-200"
            >
              ← Back to Explore
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
