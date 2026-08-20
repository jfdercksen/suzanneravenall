'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function FinalCTA() {
  return (
    <section aria-labelledby="finalcta-heading" className="relative py-14 lg:py-24 bg-brand-primary overflow-hidden">
      {/* Background photo + navy overlay — dark sections carry imagery, never flat colour */}
      <Image
        src="/images/generated/session-coaching.webp"
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="object-cover opacity-50"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-brand-primary/90 via-brand-primary/70 to-brand-primary/90" />
      <motion.div
        className="relative z-10 max-w-3xl mx-auto px-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '0px' }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <p className="text-white/80 text-xs font-medium uppercase tracking-[0.3em] mb-6">
          Take The First Step
        </p>
        <h2 id="finalcta-heading" className="text-5xl lg:text-7xl font-semibold tracking-tight text-white leading-[1.05]">
          Your breakthrough is one conversation away
        </h2>
        <motion.p
          className="mt-6 text-white/80 text-lg leading-relaxed max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          Schedule a complimentary discovery call. No obligation: just clarity on where you are, where you want to be, and whether working together is the right fit.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
        >
          <Link
            href="/contact"
            className="mt-10 inline-flex items-center justify-center px-10 py-5 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold text-lg rounded-button transition-all duration-300 hover:shadow-[0_0_40px_rgba(23,25,244,0.5)]"
          >
            Book Discovery Call
          </Link>
          <p className="mt-4 text-white/70 text-sm">Complimentary 30-minute session · No obligation</p>
        </motion.div>
      </motion.div>
    </section>
  )
}
