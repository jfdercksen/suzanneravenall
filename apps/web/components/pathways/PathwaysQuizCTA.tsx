'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

export default function PathwaysQuizCTA() {
  return (
    <section
      aria-labelledby="pathways-quiz-cta-heading"
      className="w-full bg-white py-20 lg:py-32"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p
          {...fadeUp(0)}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
        >
          Find Your Starting Point
        </motion.p>

        <motion.h2
          id="pathways-quiz-cta-heading"
          {...fadeUp(0.1)}
          className="text-4xl lg:text-6xl font-light text-brand-primary leading-tight mb-6"
        >
          Not sure which pathway is right for you?
        </motion.h2>

        <motion.p
          {...fadeUp(0.2)}
          className="text-lg text-gray-600 font-light leading-relaxed mb-10"
        >
          Patterns are personal. Take a short diagnostic to reveal the nervous
          system pattern shaping how you respond — a clear first step toward the
          pathway that fits you best.
        </motion.p>

        <motion.div {...fadeUp(0.3)}>
          {/* TODO: When a dedicated pathway-matching quiz exists, point this at it
              instead of the nervous-system diagnostic. */}
          <Link
            href="/explore/emotional-nervous-system-mastery/quiz"
            className="group inline-flex items-center gap-3 rounded-button bg-brand-accent px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-brand-accent-700 hover:shadow-2xl hover:shadow-brand-accent/30"
          >
            Take the 2-Minute Diagnostic
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
