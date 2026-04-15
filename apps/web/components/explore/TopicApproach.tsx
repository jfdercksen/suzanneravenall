'use client'

import { motion } from 'framer-motion'
import type { Topic } from '@/app/explore/topics'

const sectionVariants = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

export default function TopicApproach({ topic }: { topic: Topic }) {
  return (
    <section
      aria-labelledby="topic-approach-heading"
      className="w-full bg-gray-50 py-20 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...sectionVariants} className="max-w-3xl mb-16 md:mb-20">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
            Suzanne’s Method
          </p>
          <h2
            id="topic-approach-heading"
            className="text-4xl md:text-6xl font-light text-brand-primary leading-tight mb-6"
          >
            How Suzanne works with{' '}
            <span className="text-brand-accent">this</span>
          </h2>
          <p className="text-lg text-brand-primary/70 font-light leading-relaxed max-w-2xl">
            Using Rapid Repatterning®, we work at the level where patterns are
            formed. This is not about coping. This is about changing the
            pattern.
          </p>
        </motion.div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topic.approach.map((stage, index) => (
            <motion.li
              key={stage.step}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{
                duration: 0.6,
                delay: (index % 4) * 0.1,
                ease: 'easeOut',
              }}
              className="group relative rounded-card border-t-2 border-brand-accent bg-white p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <span
                aria-hidden="true"
                className="block text-xs uppercase tracking-[0.3em] font-medium text-brand-accent"
              >
                Step {stage.step}
              </span>
              <h3 className="mt-5 text-xl font-light text-brand-primary leading-snug">
                {stage.title}
              </h3>
              <p className="mt-3 text-sm text-brand-primary/70 font-light leading-relaxed">
                {stage.body}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
