'use client'

import { motion } from 'framer-motion'

const sectionReveal = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

export default function TheMethod() {
  return (
    <section aria-labelledby="method-heading" className="bg-gray-950 py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          {...sectionReveal}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
        >
          The Method
        </motion.p>

        <motion.h2
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' as const }}
          id="method-heading"
          className="text-4xl md:text-6xl font-light text-white leading-[1.08] max-w-4xl mb-16"
        >
          Rewiring from the inside out through{' '}
          <span className="text-brand-accent">Rapid Repatterning&reg; &amp; Neuro-repatterning&reg;</span>
        </motion.h2>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          <motion.div
            {...sectionReveal}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' as const }}
          >
            <h3 className="text-white/90 text-sm uppercase tracking-widest mb-4 font-medium">
              The approach
            </h3>
            <p className="text-white/70 text-lg font-light leading-relaxed">
              A radical synthesis of metaphysics, neuroscience, trauma science, energy
              psychology, NLP, the neurobiology of decision making and performance,
              consciousness studies, and ancient healing arts — fused into a practical
              methodology for lasting transformation. Not just to survive, but to heal
              and transcend.
            </p>
          </motion.div>

          <motion.div
            {...sectionReveal}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' as const }}
          >
            <h3 className="text-white/90 text-sm uppercase tracking-widest mb-4 font-medium">
              The differentiation
            </h3>
            <p className="text-white/70 text-lg font-light leading-relaxed">
              Every individual, team and system is capable of radical transformation —
              not through motivation or mindset tricks, but by repatterning the
              biological and energetic roots of pain and limitation. This is about
              human evolution: operating from a higher state of awareness, resilience,
              fortification and mastery.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
