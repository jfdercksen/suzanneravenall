'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const CAL_URL = process.env.NEXT_PUBLIC_CAL_URL ?? 'https://cal.suzanneravenall.com'

export function ShopFinalCTA() {
  return (
    <section
      aria-labelledby="shop-cta-heading"
      className="relative w-full bg-brand-primary-900 py-20 lg:py-32 overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-brand-accent/10 blur-[120px]"
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6 }}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-4"
        >
          Not sure where to start?
        </motion.p>

        <motion.h2
          id="shop-cta-heading"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl lg:text-6xl font-light text-white leading-[1.08] mb-6"
        >
          Let&rsquo;s Find the Right Path Together
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-300 text-lg font-light leading-relaxed mb-10"
        >
          Book a free 30-minute discovery call with Dr. Suzanne Ravenall and find the programme
          that matches where you are right now.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href={`${CAL_URL}/suzanneravenall/discovery-call`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-10 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:shadow-[0_8px_30px_rgba(23,25,244,0.30)]"
          >
            Book Discovery Call &rarr;
          </a>
          <Link
            href="/programs"
            className="inline-flex items-center justify-center px-10 py-4 border border-white/30 hover:border-white text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300"
          >
            Explore Programmes &rarr;
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
