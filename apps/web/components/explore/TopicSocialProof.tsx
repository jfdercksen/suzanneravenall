'use client'

import { motion } from 'framer-motion'
import type { Topic } from '@/app/explore/topics'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

export default function TopicSocialProof({ topic }: { topic: Topic }) {
  return (
    <section
      aria-label="Client outcome"
      className="relative w-full bg-brand-primary overflow-hidden py-20 lg:py-32"
    >
      {/* Subtle gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-primary-800 to-brand-primary-900"
      />
      {/* Glow orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-brand-accent/8 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-0 h-[400px] w-[400px] rounded-full bg-brand-accent/5 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
          {/* Left — testimonial */}
          <motion.div {...fadeUp(0)}>
            {/* Large decorative quote mark */}
            <span
              aria-hidden="true"
              className="block text-8xl font-serif text-brand-accent/30 leading-none mb-4 select-none"
            >
              &ldquo;
            </span>

            <blockquote>
              <p className="text-xl lg:text-2xl text-white font-light italic leading-relaxed mb-8">
                {topic.testimonial.quote}
              </p>
              <footer className="space-y-1">
                <p className="text-sm font-medium text-white tracking-wide">
                  {topic.testimonial.name}
                </p>
                <p className="text-sm text-brand-accent/80 font-light">
                  {topic.testimonial.outcome}
                </p>
              </footer>
            </blockquote>
          </motion.div>

          {/* Right — stat */}
          <motion.div {...fadeUp(0.15)} className="lg:text-right">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
              By the numbers
            </p>
            <p className="text-8xl lg:text-9xl font-light text-brand-accent leading-none mb-4">
              {topic.stat.value}
            </p>
            <p className="text-base lg:text-lg text-white/65 font-light leading-relaxed max-w-xs lg:ml-auto">
              {topic.stat.label}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
