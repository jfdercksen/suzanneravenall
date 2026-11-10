'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

// The method first (Suzanne, 8 Nov: the home page must advertise Pattern
// Intelligence). Both statements are her own copy from The Story and The
// System (9 Nov class A pass).
export default function PatternIntelligenceBand() {
  return (
    <section aria-labelledby="pattern-intelligence-heading" className="w-full bg-brand-primary-900 py-20 lg:py-32">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-12 lg:grid-cols-2 lg:gap-20 items-end"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400 mb-4">The Method</p>
          <h2
            id="pattern-intelligence-heading"
            className="text-4xl lg:text-6xl font-medium tracking-tight text-white leading-tight mb-8"
          >
            Pattern Intelligence™
          </h2>
          <p className="text-xl lg:text-2xl font-light text-white leading-snug">
            The problem that you see is rarely the problem. The problem is the unseen pattern quietly
            running the show.
          </p>
        </div>
        <div>
          <p className="text-base lg:text-lg text-white/80 font-light leading-relaxed mb-8">
            Whether you enter through the free Pattern Scan, a Transformation Pathway, a self study
            programme or a private session, you are working within the same methodology: one
            intelligence, applied at the depth and scale you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/about/the-system"
              className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-brand-sand text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
            >
              The System
            </Link>
            <Link
              href="/about/the-science"
              className="inline-flex items-center justify-center px-6 py-3 border border-white/50 hover:border-white text-white hover:bg-white/10 text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
            >
              The Science
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
