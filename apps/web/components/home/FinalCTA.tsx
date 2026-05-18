'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function FinalCTA() {
  return (
    <section aria-labelledby="finalcta-heading" className="relative py-28 lg:py-36 overflow-hidden">
      <Image
        src="/images/coaching-bg.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center opacity-30"
      />
      <div className="absolute inset-0 bg-brand-primary/90" />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/60 via-transparent to-brand-primary/60" />

      <motion.div
        className="relative z-10 max-w-3xl mx-auto px-4 text-center"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <h2 id="finalcta-heading" className="text-4xl lg:text-6xl font-light text-white leading-tight">
          Your breakthrough is one conversation away
        </h2>
        <motion.p
          className="mt-6 text-white/70 text-lg leading-relaxed max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          Schedule a complimentary discovery call. No obligation — just clarity on where you are, where you want to be, and whether working together is the right fit.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
        >
          <Link
            href="/contact"
            className="mt-10 inline-flex items-center justify-center px-10 py-5 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold text-lg rounded-button transition-all duration-300 hover:shadow-[0_0_40px_rgba(23,25,244,0.5)]"
          >
            Book Discovery Call
          </Link>
          <p className="mt-4 text-white/40 text-sm">Complimentary 30-minute session · No obligation</p>
        </motion.div>
      </motion.div>
    </section>
  )
}
