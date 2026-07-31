'use client'

import { motion } from 'framer-motion'

export default function PatternHubQuote() {
  return (
    <section aria-label="Quote from Dr. Suzanne Ravenall" className="w-full bg-brand-primary py-20 lg:py-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-8xl text-brand-accent/20 leading-none mb-4" aria-hidden="true">
            &ldquo;
          </p>
          <blockquote>
            <p className="text-2xl lg:text-3xl font-light text-white leading-snug mb-8">
              Once you can see the pattern, you have a choice you didn&rsquo;t
              have before. Change the pattern, and everything built on top of
              it changes with it.
            </p>
            <footer className="text-white/60 text-sm uppercase tracking-[0.2em]">
              Dr. Suzanne Ravenall
            </footer>
          </blockquote>
        </motion.div>
      </div>
    </section>
  )
}