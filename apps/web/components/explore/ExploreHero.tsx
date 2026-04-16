'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

export default function ExploreHero() {
  return (
    <section
      aria-labelledby="explore-hero-heading"
      className="relative w-full overflow-hidden min-h-[70vh] md:min-h-screen flex items-center"
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
        className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-accent/10 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-40">
        <div className="max-w-4xl">
          <motion.p
            {...fadeUp(0)}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
          >
            Areas of Focus
          </motion.p>

          <motion.h1
            id="explore-hero-heading"
            {...fadeUp(0.1)}
            className="text-4xl md:text-6xl lg:text-7xl font-light text-white leading-[1.05] mb-8"
          >
            Every area of your life,{' '}
            <span className="text-brand-accent">transformed</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.2)}
            className="text-lg md:text-xl text-white/75 font-light max-w-2xl leading-relaxed"
          >
            Transformation isn&apos;t about working harder on the surface. It&apos;s about
            changing the pattern underneath — the one your nervous system has
            been running for years. When the pattern shifts, every area of your
            life follows.
          </motion.p>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
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
