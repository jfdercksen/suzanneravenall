'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ServicesFinalCTA() {
  return (
    <motion.section
      aria-labelledby="services-cta-heading"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px' }}
      transition={{ duration: 0.6 }}
      className="relative w-full bg-brand-primary py-20 lg:py-32 overflow-hidden"
    >
      {/* Background photo + navy overlay — dark CTA bands carry imagery, never flat colour */}
      <Image
        src="/images/generated/session-coaching.webp"
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="object-cover opacity-50"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-brand-primary/90 via-brand-primary/75 to-brand-primary/90"
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-6"
        >
          Your Next Step
        </motion.p>

        <motion.h2
          id="services-cta-heading"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl lg:text-6xl font-semibold tracking-tight text-white leading-tight mb-6"
        >
          Not sure which path is right for you?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg lg:text-xl text-white/80 font-light max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Spend twenty minutes with Suzanne. Describe what you’re stuck on. Leave
          with a clear, honest sense of which session, programme or keynote fits
          where you actually are.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
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
