'use client'

import { motion } from 'framer-motion'

// Above the fold — entrance uses `animate` (not whileInView).
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

export default function PathwaysHero() {
  return (
    <section
      aria-labelledby="pathways-hero-heading"
      className="relative w-full overflow-hidden bg-brand-primary"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-primary-800 to-brand-primary-900"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-brand-accent/10 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-40">
        <div className="max-w-4xl">
          <motion.p
            {...fadeUp(0)}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
          >
            Transformation Pathways
          </motion.p>

          <motion.h1
            id="pathways-hero-heading"
            {...fadeUp(0.1)}
            className="text-4xl lg:text-6xl font-light text-white leading-[1.05] mb-8"
          >
            Structured pathways for deep, lasting{' '}
            <span className="text-brand-accent">transformation</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.2)}
            className="text-lg lg:text-xl text-white/75 font-light max-w-2xl leading-relaxed"
          >
            Each pathway is a focused transformation journey — a guided way to
            uncover the hidden patterns running underneath, interrupt the loops
            that keep you stuck, and support real, lasting personal change.
          </motion.p>
        </div>
      </div>
    </section>
  )
}
