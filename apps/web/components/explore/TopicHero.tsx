'use client'

import Image from 'next/image'
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
      className="relative w-full overflow-hidden min-h-[70vh] flex items-center"
    >
      {/* Cinematic background image */}
      <Image
        src="/images/hero-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Dark gradient overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"
      />

      {/* Accent glow */}
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
            className="text-lg md:text-xl text-white/75 font-light max-w-2xl leading-relaxed mb-10"
          >
            {topic.heroSubheadline}
          </motion.p>

          <motion.div
            {...fadeUp(0.4)}
            className="flex flex-wrap gap-4"
          >
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:shadow-[0_0_30px_theme(colors.brand.accent/50%)]"
            >
              Book Discovery Call
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center px-8 py-4 border border-white/50 hover:border-white text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-white/10"
            >
              View Services
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        aria-hidden="true"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg
            className="w-6 h-6 text-white/50"
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
