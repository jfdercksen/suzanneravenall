'use client'

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
      className="relative w-full bg-brand-primary overflow-hidden min-h-[60vh] md:min-h-[75vh] flex items-center"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-primary-900 via-brand-primary to-brand-primary-800"
      />
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
            Transformation isn’t about working harder on the surface. It’s about
            changing the pattern underneath — the one your nervous system has
            been running for years. When the pattern shifts, every area of your
            life follows.
          </motion.p>
        </div>
      </div>
    </section>
  )
}
