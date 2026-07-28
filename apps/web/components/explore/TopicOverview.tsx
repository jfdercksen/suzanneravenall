'use client'

import { motion } from 'framer-motion'
import type { Topic } from '@/app/explore/topics'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

export default function TopicOverview({ topic }: { topic: Topic }) {
  // Pull the first sentence of overview[0] as the pull quote —
  // it is always the most emotionally direct line.
  const pullQuote = topic.overview[0]

  return (
    <section
      aria-labelledby="topic-overview-heading"
      className="relative w-full bg-gray-50 overflow-hidden pt-20 pb-12 lg:pt-32 lg:pb-16"
    >
      {/* Dot-grid background pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(1,43,67,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Subtle accent glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-brand-accent/5 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left — label + corePrinciple headline */}
          <motion.div {...fadeUp(0)} className="lg:col-span-5">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
              The Pattern Underneath
            </p>
            <h2
              id="topic-overview-heading"
              className="text-4xl lg:text-5xl font-light text-brand-primary leading-tight"
            >
              {topic.corePrinciple}
            </h2>
          </motion.div>

          {/* Right — pull quote + body paragraphs */}
          <div className="lg:col-span-7 space-y-8">
            {/* Pull quote treatment — first overview paragraph elevated visually */}
            <motion.div {...fadeUp(0.1)} className="relative pl-6">
              <div
                aria-hidden="true"
                className="absolute left-0 top-0 bottom-0 w-px bg-brand-accent/60"
              />
              <p className="text-xl lg:text-2xl text-brand-accent/90 font-light italic leading-relaxed">
                {pullQuote}
              </p>
            </motion.div>

            {/* Remaining overview paragraphs */}
            {topic.overview.slice(1).map((paragraph, index) => (
              <motion.p
                key={index}
                {...fadeUp(0.2 + index * 0.1)}
                className="text-lg text-gray-600 font-light leading-relaxed"
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
