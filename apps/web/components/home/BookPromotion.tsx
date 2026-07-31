'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function BookPromotion() {
  return (
    <section aria-labelledby="book-heading" className="relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT — Full-bleed book panel (navy bg makes cover pop) */}
        <motion.div
          className="relative bg-brand-primary flex flex-col items-center justify-center py-14 lg:py-24 px-8 lg:px-16 overflow-hidden min-h-[400px] lg:min-h-[680px]"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Ambient glow behind cover */}
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-accent/10 blur-[120px] pointer-events-none"
          />

          {/* Available Now badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative mb-8 z-10"
          >
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-brand-accent text-white text-xs font-semibold uppercase tracking-wider">
              Available Now
            </span>
          </motion.div>

          {/* Floating book cover — 1092×852 landscape, 3D perspective baked in */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10 w-full max-w-lg"
          >
            <div className="shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
              <Image
                src="/images/book-cover.png"
                alt="The Breakthrough Trilogy by Dr. Suzanne Ravenall"
                width={1092}
                height={852}
                className="w-full h-auto"
                priority={false}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* RIGHT — Copy panel */}
        <div className="bg-gray-50 flex items-center">
          <div className="w-full max-w-xl mx-auto py-14 lg:py-24 px-8 lg:px-16">

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
            >
              The Breakthrough Trilogy
            </motion.p>

            <motion.h2
              id="book-heading"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-4xl lg:text-5xl font-light text-brand-primary leading-tight mb-6"
            >
              Before you change your life, understand the architecture holding you back.
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-4 text-gray-600 leading-relaxed mb-8"
            >
              <p>
                Consciousness is a meaning field. Your brain adapted to the worldview imposed on it in childhood, and unless that operating system is updated, life becomes a series of repeating patterns.
              </p>
              <p>
                The Breakthrough Trilogy is the intellectual foundation of everything Suzanne teaches. Three books. One complete system for decoding and upgrading the patterns running your life.
              </p>
            </motion.div>

            {/* Pull quote */}
            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="border-l-2 border-brand-accent pl-6 mb-8"
            >
              <p className="text-lg font-light italic text-brand-primary leading-relaxed">
                &ldquo;When we decode hidden patterns, we transform in unimaginable ways. That shift radiates outward: into how we lead, grow, relate, love, and show up.&rdquo;
              </p>
              <footer className="mt-3 text-sm text-gray-400 uppercase tracking-wider not-italic">
                Dr. Suzanne Ravenall
              </footer>
            </motion.blockquote>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/shop/the-latest-book-by-suzanne"
                className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold rounded-button transition-all duration-300 hover:shadow-[0_0_30px_rgba(23,25,244,0.4)]"
              >
                Order Now: R165
              </Link>
              {/* TODO: Replace href with dedicated chapter download page once PDF asset is provided */}
              <Link
                href="#lead-magnet"
                className="inline-flex items-center justify-center px-8 py-4 border border-brand-primary/30 hover:border-brand-primary text-brand-primary font-semibold rounded-button transition-all duration-300 hover:bg-brand-primary/5"
              >
                Read Chapter 1 Free
              </Link>
            </motion.div>

          </div>
        </div>

      </div>
    </section>
  )
}
