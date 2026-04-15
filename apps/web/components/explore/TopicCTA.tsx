'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Topic } from '@/app/explore/topics'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

export default function TopicCTA({ topic }: { topic: Topic }) {
  return (
    <section
      aria-labelledby="topic-cta-heading"
      className="relative w-full bg-brand-primary overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-primary-800 to-brand-primary-900"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-accent/10 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
        <motion.p
          {...fadeUp(0)}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
        >
          Work With Suzanne
        </motion.p>

        <motion.h2
          id="topic-cta-heading"
          {...fadeUp(0.1)}
          className="text-4xl md:text-6xl font-light text-white leading-tight mb-6 max-w-3xl mx-auto"
        >
          Work on{' '}
          <span className="text-brand-accent">{topic.title}</span>{' '}
          with Suzanne
        </motion.h2>

        <motion.p
          {...fadeUp(0.2)}
          className="text-lg md:text-xl text-white/75 font-light max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Book a discovery call. We’ll map the pattern underneath what you’re
          working with and the path to change it.
        </motion.p>

        <motion.div {...fadeUp(0.3)}>
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 rounded-button bg-brand-accent px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-brand-accent-700 hover:shadow-2xl hover:shadow-brand-accent/30"
          >
            Book Discovery Call
            <span aria-hidden="true" className="inline-block">
              →
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
