'use client'

import { motion } from 'framer-motion'
import type { Topic } from '@/app/explore/topics'

const sectionVariants = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

export default function TopicOverview({ topic }: { topic: Topic }) {
  return (
    <section
      aria-labelledby="topic-overview-heading"
      className="w-full bg-gray-950 py-20 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <motion.div {...sectionVariants} className="lg:col-span-5">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
              The Pattern Underneath
            </p>
            <h2
              id="topic-overview-heading"
              className="text-4xl md:text-6xl font-light text-white leading-tight mb-8"
            >
              {topic.corePrinciple}
            </h2>
          </motion.div>

          <div className="lg:col-span-7 space-y-6">
            {topic.overview.map((paragraph, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: 'easeOut',
                }}
                className="text-lg text-white/75 font-light leading-relaxed"
              >
                {paragraph}
              </motion.p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
