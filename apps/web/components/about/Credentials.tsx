'use client'

import { motion } from 'framer-motion'

const sectionReveal = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

// Scraped about.md lists degrees (B.Msc. M.Msc. Msc.D.) and references
// /qualifications and /memberships pages, but the specific list of credentials
// on those pages did not appear in the scrape. Using the confirmed set only.
const credentials: string[] = [
  'B.Msc.',
  'M.Msc.',
  'Msc.D.',
  'Rapid Repatterning\u00ae Practitioner',
  'Neuro-repatterning\u00ae Practitioner',
  'NLP Practitioner',
  'Energy Psychology',
  'Trauma Science',
  'Consciousness Studies',
  'Metaphysics',
  'Ancient Healing Arts',
  'Neurobiology of Performance',
]

// Qualifications count and years experience were not available in the scrape
// (WordPress counter widgets that didn't hydrate). Only Awards confirmed.
// Awaiting client-supplied values for the other two stats.
const stats: { value: string; label: string }[] = [
  { value: '30+', label: 'Awards' },
]

export default function Credentials() {
  return (
    <section
      aria-labelledby="credentials-heading"
      className="bg-brand-primary py-20 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          {...sectionReveal}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
        >
          Credentials &amp; Expertise
        </motion.p>

        <motion.h2
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' as const }}
          id="credentials-heading"
          className="text-4xl md:text-6xl font-light text-white leading-[1.08] max-w-3xl mb-16"
        >
          Two decades. Multiple disciplines. One integrated method.
        </motion.h2>

        {/* Stats row — only confirmed values from the scrape; qualifications count
            and years-experience values were not available in the scrape output.
            [CONFIRM: add remaining stat values with client before launch] */}
        <div className="flex flex-wrap gap-12 mb-16">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{
                duration: 0.6,
                delay: 0.2 + i * 0.1,
                ease: 'easeOut' as const,
              }}
              className="border-t border-white/15 pt-6 min-w-[140px]"
            >
              <p className="text-5xl md:text-6xl font-light text-brand-accent mb-2">
                {stat.value}
              </p>
              <p className="text-white/60 text-sm tracking-widest uppercase">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Credential tags */}
        <div className="flex flex-wrap gap-3">
          {credentials.map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.5,
                delay: i * 0.05,
                ease: 'easeOut' as const,
              }}
              className="px-5 py-2.5 rounded-full border border-white/20 bg-white/5 text-white/80 text-sm font-light backdrop-blur-sm"
            >
              {tag}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  )
}
