'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export function ShopHeroBanner() {
  return (
    <section
      aria-labelledby="shop-hero-heading"
      className="relative w-full bg-brand-primary min-h-[60vh] flex items-center py-20 lg:py-32 overflow-hidden"
    >
      {/* Background image with overlay */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/hero-bg-suzanne-ravenall.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/90 via-brand-primary/70 to-brand-primary/40" />
      </div>

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
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
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
          Invest in Your
          <br />
          <span className="text-brand-accent">Transformation</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg text-white/70 leading-relaxed mb-10 max-w-xl"
        >
          Private sessions, guided programmes, and group coaching designed to create lasting change.
        </motion.p>

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
    </section>
  )
}
