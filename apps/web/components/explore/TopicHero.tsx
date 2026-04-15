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

export default function TopicHero({ topic }: { topic: Topic }) {
  return (
    <section
      aria-labelledby="topic-hero-heading"
      className="relative w-full bg-brand-primary overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-primary-900 via-brand-primary to-brand-primary-800"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 -right-32 h-[520px] w-[520px] rounded-full bg-brand-accent/10 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-40">
        <motion.nav
          aria-label="Breadcrumb"
          {...fadeUp(0)}
          className="mb-10 text-xs uppercase tracking-[0.3em] font-medium text-white/60"
        >
          <Link
            href="/explore"
            className="transition-colors duration-300 hover:text-brand-accent"
          >
            Explore
          </Link>
          <span aria-hidden="true" className="mx-3">
            /
          </span>
          <span className="text-brand-accent">{topic.title}</span>
        </motion.nav>

        <div className="max-w-4xl">
          <motion.p
            {...fadeUp(0.1)}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
          >
            Area of Focus
          </motion.p>

          <motion.h1
            id="topic-hero-heading"
            {...fadeUp(0.2)}
            className="text-4xl md:text-6xl lg:text-7xl font-light text-white leading-[1.05] mb-8"
          >
            {topic.heroHeadline}
          </motion.h1>

          <motion.p
            {...fadeUp(0.3)}
            className="text-lg md:text-xl text-white/75 font-light max-w-2xl leading-relaxed"
          >
            {topic.heroSubheadline}
          </motion.p>
        </div>
      </div>
    </section>
  )
}
