'use client'

import { motion } from 'framer-motion'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

export default function ResourcesHero() {
  return (
    <section
      aria-labelledby="resources-hero-heading"
      className="w-full bg-brand-primary py-32 lg:py-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          {...fadeUp(0)}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
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
