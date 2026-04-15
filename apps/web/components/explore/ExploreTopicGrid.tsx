'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { topics } from '@/app/explore/topics'

const sectionVariants = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

export default function ExploreTopicGrid() {
  return (
    <section
      aria-labelledby="explore-topic-grid-heading"
      className="w-full bg-gray-950 py-20 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...sectionVariants} className="max-w-3xl mb-16 md:mb-20">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
            Eight Patterns. One System.
          </p>
          <h2
            id="explore-topic-grid-heading"
            className="text-4xl md:text-6xl font-light text-white leading-tight"
          >
            Choose the area you’re ready to{' '}
            <span className="text-brand-accent">repattern</span>
          </h2>
        </motion.div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topics.map((topic, index) => (
            <motion.li
              key={topic.slug}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{
                duration: 0.6,
                delay: (index % 4) * 0.1,
                ease: 'easeOut',
              }}
            >
              <Link
                href={`/explore/${topic.slug}`}
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-card bg-gray-900 border border-white/5 p-8 transition-all duration-500 hover:-translate-y-1 hover:border-brand-accent/60 hover:shadow-2xl hover:shadow-brand-accent/10"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-accent/0 to-brand-accent/0 opacity-0 transition-opacity duration-500 group-hover:from-brand-accent/10 group-hover:to-transparent group-hover:opacity-100"
                />

                <div className="relative z-10">
                  <span className="text-2xs uppercase tracking-[0.3em] font-medium text-brand-accent/80">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-6 text-xl md:text-2xl font-light text-white leading-tight transition-colors duration-300 group-hover:text-brand-accent">
                    {topic.title}
                  </h3>
                  <p className="mt-4 text-sm text-white/65 font-light leading-relaxed">
                    {topic.shortDescription}
                  </p>
                </div>

                <span className="relative z-10 mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-medium text-white/50 transition-colors duration-300 group-hover:text-brand-accent">
                  Explore
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
