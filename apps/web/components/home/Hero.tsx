'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: 'easeOut' as const },
})

export default function Hero() {
  const scrollToMedia = () => {
    document.getElementById('media-logos')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative h-screen min-h-[700px] overflow-hidden"
    >
      {/* Layer 1 — Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        poster="/images/hero-bg-suzanne-ravenall.jpg"
      >
        <source src="/videos/generated/hero-stage-video.mp4" type="video/mp4" />
      </video>

      {/* Layer 2 — Gradient overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10"
      />

      {/* Layer 3 — Content */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-center h-full max-w-2xl">

          {/* Name */}
          <motion.p
            {...fadeUp(0)}
            className="text-brand-accent text-sm lg:text-base font-medium tracking-[0.3em] uppercase mb-2"
          >
            Dr. Suzanne Ravenall
          </motion.p>

          {/* Eyebrow */}
          <motion.p
            {...fadeUp(0.1)}
            className="text-xs tracking-[0.3em] text-white/60 uppercase font-medium mb-6"
          >
            Transformation Coach · Neuroscience · Results
          </motion.p>

          {/* Headline */}
          <motion.h1
            id="hero-heading"
            {...fadeUp(0.25)}
            className="text-5xl lg:text-6xl font-display text-white leading-[1.05] mb-6"
          >
            Unlock Your Most{' '}
            <span className="text-brand-accent">Extraordinary Self</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            {...fadeUp(0.45)}
            className="text-lg lg:text-xl text-white/70 font-light max-w-md mb-10"
          >
            Break the patterns. Rewrite the story. Become unstoppable.
          </motion.p>

          {/* CTA row */}
          <motion.div
            {...fadeUp(0.65)}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/contact"
              aria-label="Book a free discovery call with Dr. Suzanne Ravenall"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent hover:bg-brand-accent/90 text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_30px_rgba(23,25,244,0.5)]"
            >
              Book Discovery Call
            </Link>
            <Link
              href="#lead-magnet"
              aria-label="Download Chapter 1 of The Breakthrough Trilogy — free"
              className="inline-flex items-center justify-center px-8 py-4 border border-white/50 hover:border-white text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-white/10"
            >
              Free Chapter
            </Link>
          </motion.div>

        </div>
      </div>

      {/* Layer 4 — Scroll indicator */}
      <button
        onClick={scrollToMedia}
        aria-label="Scroll to next section"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 hover:text-white/70 transition-colors duration-300 cursor-pointer"
      >
        <ChevronDown className="w-6 h-6 motion-safe:animate-bounce" />
      </button>
    </section>
  )
}
