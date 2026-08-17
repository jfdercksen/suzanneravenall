'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function ShopHeroBanner() {
  return (
    <section
      aria-labelledby="shop-hero-heading"
      className="relative w-full bg-brand-primary min-h-[50vh] flex items-center py-16 lg:py-32 overflow-hidden"
    >
      {/* Background video — poster handles static fallback */}
      <video
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        poster="/images/hero-bg-suzanne-ravenall.jpg"
      >
        <source src="/videos/generated/hero-shop.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/90 via-brand-primary/70 to-brand-primary/40" />

      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-brand-accent/10 blur-[140px]"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-6"
        >
          Transform Your Life
        </motion.p>

        <motion.h1
          id="shop-hero-heading"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl lg:text-6xl font-light text-white mb-6 leading-tight max-w-3xl"
        >
          Your Breakthrough
          <br />
          <span className="text-brand-accent-300">Starts Here</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg text-white/70 leading-relaxed mb-8 max-w-xl"
        >
          48 programmes. One destination. The tools Suzanne has used to transform 2,000+ lives, now available to you.
        </motion.p>

        {/* Credibility stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex gap-4 sm:gap-8 mb-8 sm:mb-10"
        >
          {[
            { value: '2,000+', label: 'Lives transformed' },
            { value: '20+',    label: 'Years experience' },
            { value: '30+',    label: 'Countries reached' },
          ].map(({ value, label }) => (
            <div key={label}>
              <span className="block text-3xl font-bold text-white">{value}</span>
              <span className="block text-sm text-white/70 mt-0.5">{label}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            type="button"
            onClick={() =>
              document.getElementById('programmes')?.scrollIntoView({ behavior: 'smooth' })
            }
            className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold rounded-button transition-all duration-300"
          >
            Explore All Programmes
          </button>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 border border-white/40 hover:border-white text-white font-semibold rounded-button transition-all duration-300"
          >
            Book a Discovery Call
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        type="button"
        aria-label="Scroll to programmes"
        onClick={() =>
          document.getElementById('programmes')?.scrollIntoView({ behavior: 'smooth' })
        }
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-white/40 hover:text-white/80 transition-colors duration-300"
      >
        <span className="text-xs uppercase tracking-[0.2em] font-medium">Scroll</span>
        <motion.svg
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </motion.svg>
      </motion.button>
    </section>
  )
}
