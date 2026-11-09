'use client'

import { motion } from 'framer-motion'
import type { Topic } from '@/app/explore/topics'
import { topicCopy } from '@/app/explore/topicCopy'

export default function TopicDiscover({ topic }: { topic: Topic }) {
  // Suzanne's copy (8 Nov 2026) where she has written it; the older cards
  // otherwise.
  const copy = topicCopy[topic.slug]?.shifts
  const items = copy ? copy.items : topic.discover

  return (
    <section
      aria-labelledby="topic-discover-heading"
      className="w-full bg-brand-cream py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-3xl mb-16 lg:mb-20"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
            What Shifts
          </p>
          <h2
            id="topic-discover-heading"
            className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-tight"
          >
            {copy ? (
              copy.headline
            ) : (
              <>
                Life after{' '}
                <span className="text-brand-accent">repatterning</span>
              </>
            )}
          </h2>
          {copy && (
            <p className="mt-6 text-lg text-brand-ink font-light leading-relaxed">{copy.intro}</p>
          )}
        </motion.div>

        {/* Sand cards grid */}
        <ul className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${items.length === 6 ? 'lg:grid-cols-3' : ''}`}>
          {items.map((item, index) => (
            <motion.li
              key={`${index}-${item.title}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{
                duration: 0.6,
                delay: (index % 3) * 0.1,
                ease: 'easeOut',
              }}
              className="group relative rounded-card bg-brand-sand border border-brand-border border-t-2 border-t-brand-accent p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
            >
              {/* Large number background accent */}
              <span
                aria-hidden="true"
                className="absolute top-4 right-6 text-7xl font-light text-brand-primary/5 select-none leading-none"
              >
                {String(index + 1).padStart(2, '0')}
              </span>

              {/* Number chip */}
              <span
                aria-hidden="true"
                className="inline-block text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
              >
                {String(index + 1).padStart(2, '0')}
              </span>

              <h3 className="text-xl lg:text-2xl font-light text-brand-primary leading-snug mb-3">
                {item.title}
              </h3>

              <p className="text-sm text-brand-muted font-light leading-relaxed">
                {item.body}
              </p>
            </motion.li>
          ))}
        </ul>

        {copy && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mt-16 text-2xl lg:text-3xl font-medium tracking-tight text-brand-primary text-center"
          >
            {copy.closing}
          </motion.p>
        )}
      </div>
    </section>
  )
}
