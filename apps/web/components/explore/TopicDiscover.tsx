'use client'

import { motion } from 'framer-motion'
import type { Topic } from '@/app/explore/topics'

const sectionVariants = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

export default function TopicDiscover({ topic }: { topic: Topic }) {
  return (
    <section
      aria-labelledby="topic-discover-heading"
      className="w-full bg-white py-20 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...sectionVariants} className="max-w-3xl mb-16 md:mb-20">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
            What Shifts
          </p>
          <h2
            id="topic-discover-heading"
            className="text-4xl md:text-6xl font-light text-brand-primary leading-tight"
          >
            What you&apos;ll{' '}
            <span className="text-brand-accent">discover</span>
          </h2>
        </motion.div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {topic.discover.map((item, index) => (
            <motion.li
              key={item.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{
                duration: 0.6,
                delay: (index % 2) * 0.1,
                ease: 'easeOut',
              }}
              className="group relative rounded-card border border-brand-primary/10 bg-gray-50 p-8 shadow-card transition-all duration-500 hover:-translate-y-1 hover:border-brand-accent/60 hover:shadow-card-hover"
            >
              <span
                aria-hidden="true"
                className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 text-xl md:text-2xl font-light text-brand-primary leading-snug">
                {item.title}
              </h3>
              <p className="mt-3 text-sm text-brand-primary/70 font-light leading-relaxed">
                {item.body}
              </p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
