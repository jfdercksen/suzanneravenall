'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ServicesFinalCTA() {
  return (
    <motion.section
      aria-labelledby="services-cta-heading"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      className="relative w-full bg-brand-primary-900 py-20 md:py-32 overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_theme(colors.brand.accent/20%),_transparent_65%)]"
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
        >
          Your Next Step
        </motion.p>

        <motion.h2
          id="services-cta-heading"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl md:text-6xl font-light text-white leading-tight mb-6"
        >
          Not sure which path is right for you?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg md:text-xl text-white/70 font-light max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Spend twenty minutes with Suzanne. Describe what you’re stuck on. Leave
          with a clear, honest sense of which session, programme or keynote fits
          where you actually are.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-10 py-5 bg-brand-accent hover:bg-brand-accent-700 text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_40px_theme(colors.brand.accent/60%)]"
          >
            Book a Free Discovery Call
          </Link>
        </motion.div>
      </div>
    </motion.section>
  )
}
