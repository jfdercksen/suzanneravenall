'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

const sectionReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

export default function AboutFinalCTA() {
  return (
    <section
      aria-labelledby="about-cta-heading"
      className="relative bg-brand-primary py-20 lg:py-32 overflow-hidden"
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

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p
          {...sectionReveal}
          className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-6"
        >
          Ready to Begin
        </motion.p>

        <motion.h2
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' as const }}
          id="about-cta-heading"
          className="text-4xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.08] mb-8"
        >
          Step into who you were always meant to be.
        </motion.h2>

        <motion.p
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' as const }}
          className="text-white/80 text-lg font-light leading-relaxed max-w-xl mx-auto mb-12"
        >
          Book a discovery call with Suzanne, or explore the programs designed to
          help you repattern your way to coherence, performance and joy.
        </motion.p>

        <motion.div
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' as const }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-10 py-4 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:shadow-[0_0_30px_theme(colors.brand.accent/50%)]"
          >
            Book Discovery Call
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center justify-center px-10 py-4 border border-white/40 hover:border-white text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-white/5"
          >
            View Services
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
