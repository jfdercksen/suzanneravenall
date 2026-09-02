'use client'

import { motion } from 'framer-motion'

// Full-width centered statement on white — the reference site's "Become
// unshakeable" pattern. Breaks the card-grid rhythm between sections with a
// single giant line of type. No CTA on purpose: the statement is the moment.
export default function StatementBand() {
  return (
    <section aria-label="Pattern-level change" className="bg-brand-cream py-20 lg:py-32">
      <motion.div
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '0px' }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <h2 className="text-4xl sm:text-5xl lg:text-7xl font-semibold tracking-tight text-brand-primary leading-[1.05]">
          Your pattern isn&apos;t your destiny.
        </h2>
        <motion.p
          className="mt-6 text-lg lg:text-xl text-brand-ink leading-relaxed max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          Programs, coaching and live events built on two decades of pattern-level work. Designed for change that lasts.
        </motion.p>
        <motion.span
          aria-hidden="true"
          className="block w-16 h-1 bg-brand-accent mx-auto mt-10"
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
        />
      </motion.div>
    </section>
  )
}
