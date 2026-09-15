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
  // Pull the first sentence of overview[0] as the pull quote:
  // it is always the most emotionally direct line.
  const pullQuote = topic.overview[0]

  return (
    <section
      aria-labelledby="topic-overview-heading"
      className="relative w-full bg-brand-sand overflow-hidden pt-20 pb-12 lg:pt-32 lg:pb-16"
    >
      {/* Dot-grid background pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.06)_1px,transparent_1px)] bg-[length:32px_32px]"
      />


      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left: label + corePrinciple headline */}
          <motion.div {...fadeUp(0)} className="lg:col-span-5">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
              The Pattern Underneath
            </p>
            <h2
              id="topic-overview-heading"
              className="text-4xl lg:text-5xl font-medium tracking-tight text-brand-primary leading-tight"
            >
              {topic.corePrinciple}
            </h2>
          </motion.div>

          {/* Right: pull quote + body paragraphs */}
          <div className="lg:col-span-7 space-y-8">
            {/* Pull quote treatment: first overview paragraph elevated visually */}
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
                className="text-lg text-brand-muted font-light leading-relaxed"
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
