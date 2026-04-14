'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 40 },
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
      {/* Layer 1 — Background image */}
      <Image
        src="/images/hero-bg-suzanne-ravenall.jpg"
        alt="Dr. Suzanne Ravenall speaking on stage"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Layer 2 — Gradient overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10"
      />

      {/* Layer 3 — Content */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-center h-full max-w-2xl">

          {/* Eyebrow */}
          <motion.p
            {...fadeUp(0)}
            className="text-xs tracking-[0.3em] text-white/60 uppercase font-medium mb-6"
          >
            Transformation Coach · Neuroscience · Results
          </motion.p>

          {/* Headline */}
          <motion.h1
            id="hero-heading"
            {...fadeUp(0.2)}
            className="text-5xl md:text-7xl lg:text-8xl font-display text-white leading-[1.05] mb-6"
          >
            Unlock Your Most{' '}
            <span className="text-brand-accent">Extraordinary Self</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            {...fadeUp(0.4)}
            className="text-lg md:text-xl text-white/70 font-light max-w-md mb-10"
          >
            Break the patterns. Rewrite the story. Become unstoppable.
          </motion.p>

          {/* CTA row */}
          <motion.div
            {...fadeUp(0.6)}
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
              aria-label="Access the free transformation masterclass"
              className="inline-flex items-center justify-center px-8 py-4 border border-white/50 hover:border-white text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-white/10"
            >
              Free Masterclass
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
