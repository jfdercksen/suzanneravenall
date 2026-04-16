'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const sectionReveal = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

const steps: { title: string; description: string }[] = [
  {
    title: 'Find the pattern',
    description:
      'We locate the unconscious patterns, inherited trauma, and outdated programming driving the stuck loops in your life or organisation — the biological and energetic roots beneath the surface.',
  },
  {
    title: 'Disrupt the pattern',
    description:
      'Using Rapid Repatterning\u00ae, we repattern at the neurological, emotional and energetic level — not through motivation or mindset tricks, but by rewriting the underlying code.',
  },
  {
    title: 'Rewire from the inside out',
    description:
      'A new baseline is installed: coherence, resilience, fortification and mastery. The nervous system reorganises around truth and new awareness rather than survival.',
  },
  {
    title: 'Rise and integrate',
    description:
      'You operate from a higher state — engineered for thriving, not chasing success. This is liberation of human potential at scale, sustained through ongoing coaching and community.',
  },
]

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="bg-gray-50 py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          {...sectionReveal}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
        >
          How It Works
        </motion.p>

        <motion.h2
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' as const }}
          id="how-heading"
          className="text-4xl md:text-6xl font-light text-brand-primary leading-[1.08] max-w-3xl mb-16"
        >
          Four movements from pattern to breakthrough.
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {steps.map((step, i) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: 'easeOut' as const,
              }}
              className="group relative overflow-hidden bg-gray-900 rounded-card transition-all duration-500 hover:shadow-2xl hover:shadow-brand-accent/10 hover:-translate-y-1"
            >
              <Image
                src="/images/hero-bg.jpg"
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center opacity-20 group-hover:opacity-40 transition-opacity duration-500"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-transparent"
              />
              <div className="relative z-10 p-8">
                <p className="text-6xl font-light text-brand-accent/30 mb-4 transition-colors duration-500 group-hover:text-brand-accent/60">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="text-2xl font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-white/60 leading-relaxed font-light">
                  {step.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
