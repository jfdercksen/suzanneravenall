'use client'

import Image from 'next/image'
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
      className="relative min-h-[90vh] flex items-center overflow-hidden"
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
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_theme(colors.brand.accent/15%),_transparent_50%)]"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div>
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
              Unlock your life{' '}
              <span className="text-brand-accent">and potential.</span>
            </motion.h1>

            <motion.p
              {...fadeUp(0.3)}
              className="text-lg md:text-xl text-white/75 font-light max-w-xl mb-12 leading-relaxed"
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
                className="inline-flex items-center justify-center px-8 py-4 border border-white/40 hover:border-white text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-white/5"
              >
                Explore the Method
              </Link>
            </motion.div>
          </div>

          {/* Right — Suzanne portrait */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            className="hidden lg:flex justify-center items-end"
          >
            <div className="relative w-[420px] h-[520px] rounded-card overflow-hidden shadow-2xl border border-white/10">
              <Image
                src="/images/suzanne-portrait.jpg"
                alt="Dr. Suzanne Ravenall"
                fill
                sizes="420px"
                className="object-cover object-top"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
