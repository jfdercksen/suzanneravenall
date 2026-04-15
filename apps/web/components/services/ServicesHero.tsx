'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

// Hero animations fire on mount (not scroll) — intentional for the first section on screen.
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: 'easeOut' as const },
})

export default function ServicesHero() {
  return (
    <section
      id="hero"
      aria-labelledby="services-hero-heading"
      className="relative min-h-[90vh] flex items-center overflow-hidden bg-brand-primary-900"
    >
      {/* Atmospheric texture overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_theme(colors.brand.accent/18%),_transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-3xl">
          <motion.p
            {...fadeUp(0)}
            className="text-xs tracking-[0.3em] text-brand-accent uppercase font-medium mb-6"
          >
            Services with Dr. Suzanne Ravenall
          </motion.p>

          <motion.h1
            id="services-hero-heading"
            {...fadeUp(0.15)}
            className="text-4xl md:text-6xl lg:text-7xl font-light text-white leading-[1.05] mb-8"
          >
            Unlock your life and potential.{' '}
            <span className="text-brand-accent">Live the life you deserve to live.</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.3)}
            className="text-lg md:text-xl text-white/75 font-light max-w-2xl mb-12 leading-relaxed"
          >
            Through a comfortable, authentic and safe environment, Suzanne helps you
            get to the root cause of key issues that disrupt life, track the patterns
            through the impact and then helps you break through and go beyond these
            challenges and into self mastery.
          </motion.p>

          <motion.div {...fadeUp(0.45)} className="flex flex-wrap gap-4">
            <Link
              href="#private"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent hover:bg-brand-accent-700 text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_30px_theme(colors.brand.accent/50%)]"
            >
              Find Your Path
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center justify-center px-8 py-4 border border-white/40 hover:border-white text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
            >
              Explore the Method
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
