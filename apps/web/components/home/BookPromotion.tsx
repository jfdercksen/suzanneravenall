'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function BookPromotion() {
  return (
    <section aria-labelledby="book-heading" className="relative bg-gray-50 py-20 lg:py-32 overflow-hidden">

      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-brand-accent/5 blur-[140px] pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* LEFT — Book visual */}
          <motion.div
            className="flex flex-col items-center lg:items-start"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            {/* Available Now badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6"
            >
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-brand-accent text-white text-xs font-semibold uppercase tracking-wider">
                Available Now
              </span>
            </motion.div>

            {/* Floating book cover — image is 1092×852 landscape with 3D perspective baked in */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-full"
            >
              <div className="shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
                <Image
                  src="/images/book-cover.png"
                  alt="The Breakthrough Trilogy by Dr. Suzanne Ravenall"
                  width={1092}
                  height={852}
                  className="w-full h-auto object-contain"
                  priority={false}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT — Copy */}
          <div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
            >
              The Breakthrough Trilogy
            </motion.p>

            <motion.h2
              id="book-heading"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-4xl lg:text-6xl font-light text-brand-primary leading-tight mb-6"
            >
              Before you change your life — understand the architecture holding you back.
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-4 text-gray-600 leading-relaxed mb-8"
            >
              <p>
                Consciousness is a meaning field. Your brain adapted to the worldview imposed on it in childhood — and unless that operating system is updated, life becomes a series of repeating patterns.
              </p>
              <p>
                The Breakthrough Trilogy is the intellectual foundation of everything Suzanne teaches. Three books. One complete system for decoding and upgrading the patterns running your life.
              </p>
            </motion.div>

            {/* Pull quote */}
            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="border-l-2 border-brand-accent pl-6 mb-8"
            >
              <p className="text-lg lg:text-xl font-light italic text-brand-primary leading-relaxed">
                &ldquo;When we decode hidden patterns, we transform in unimaginable ways. That shift radiates outward — into how we lead, grow, relate, love, and show up.&rdquo;
              </p>
              <footer className="mt-3 text-sm text-gray-400 uppercase tracking-wider not-italic">
                — Dr. Suzanne Ravenall
              </footer>
            </motion.blockquote>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/shop/the-latest-book-by-suzanne"
                className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold rounded-button transition-all duration-300 hover:shadow-[0_0_30px_rgba(23,25,244,0.4)]"
              >
                Order Now — R165
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
