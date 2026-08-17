'use client'

import { motion } from 'framer-motion'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

export default function ResourcesHero() {
  return (
    <section
      aria-labelledby="resources-hero-heading"
      className="relative w-full bg-brand-primary py-20 lg:py-32 overflow-hidden"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute bg-brand-accent/10 blur-[140px] rounded-full w-96 h-96 top-1/4 left-1/2 -translate-x-1/2" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          {...fadeUp(0)}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-6"
        >
          Resources
        </motion.p>

        <motion.h1
          id="resources-hero-heading"
          {...fadeUp(0.15)}
          className="text-4xl lg:text-6xl font-light text-white leading-[1.1] max-w-3xl mb-6"
        >
          Resources &amp; Insights
        </motion.h1>

        <motion.p
          {...fadeUp(0.3)}
          className="text-lg text-white/70 font-light max-w-xl leading-relaxed"
        >
          Articles, media appearances, awards and tools to support your transformation journey.
        </motion.p>
      </div>
    </section>
  )
}
