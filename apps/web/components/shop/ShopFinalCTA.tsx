'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

const CAL_URL = process.env.NEXT_PUBLIC_CAL_URL ?? 'https://cal.suzanneravenall.com'

export function ShopFinalCTA() {
  return (
    <section
      aria-labelledby="shop-cta-heading"
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
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-brand-primary/90 via-brand-primary/75 to-brand-primary/90" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6 }}
          className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-4"
        >
          Not sure where to start?
        </motion.p>

        <motion.h2
          id="shop-cta-heading"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.08] mb-6"
        >
          Let&rsquo;s Find the Right Path Together
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white/80 text-lg font-light leading-relaxed mb-10"
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
