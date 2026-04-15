'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const sectionReveal = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

export default function TheStory() {
  return (
    <section aria-labelledby="story-heading" className="bg-white py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Image left */}
          <motion.div
            {...sectionReveal}
            className="relative aspect-[4/5] rounded-card overflow-hidden shadow-card-hover"
          >
            <Image
              src="/images/suzanne-portrait.jpg"
              alt="Dr. Suzanne Ravenall"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-top"
            />
          </motion.div>

          {/* Narrative right */}
          <div>
            <motion.p
              {...sectionReveal}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              The Story
            </motion.p>

            <motion.h2
              {...sectionReveal}
              transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' as const }}
              id="story-heading"
              className="text-4xl md:text-6xl font-light text-brand-primary leading-[1.08] mb-8"
            >
              From trauma to mastery
            </motion.h2>

            <motion.p
              {...sectionReveal}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' as const }}
              className="text-gray-700 text-lg font-light leading-relaxed mb-6"
            >
              Suzanne is a modern-day explorer of human potential — a transformation
              and performance coach, speaker, and multiple award-winning entrepreneur
              who&rsquo;s dedicated her life to helping people break free from
              unconscious patterns, trauma, and limitation, and step into who they are
              and were always meant to be.
            </motion.p>

            <motion.p
              {...sectionReveal}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' as const }}
              className="text-gray-700 text-lg font-light leading-relaxed mb-6"
            >
              After building one of South Africa&rsquo;s respected corporate
              transformation companies and being recognised as one of the top 11 women
              entrepreneurs globally, Suzanne&rsquo;s life took a dramatic turn. A
              series of profound traumas shattered her health and sense of identity,
              and triggered previous old covered-up traumas, forcing her to begin
              again — not from scratch, but from new awareness, truth and a new way
              of being.
            </motion.p>

            <motion.p
              {...sectionReveal}
              transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' as const }}
              className="text-gray-700 text-lg font-light leading-relaxed mb-6"
            >
              What followed — trauma, a stroke, and a multiple sclerosis diagnosis —
              became a radical journey into metaphysics, neuroscience, trauma science,
              energy psychology, NLP, the neurobiology of performance, consciousness
              studies, and ancient healing arts. Today, through Rapid Repatterning&reg;
              and Neuro-repatterning&reg;, Suzanne helps people and organisations
              rewire from the inside out, unlock their potential, and rise.
            </motion.p>

            <motion.blockquote
              {...sectionReveal}
              transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' as const }}
              className="mt-10 border-l-2 border-brand-accent pl-6 italic text-brand-primary text-lg font-light leading-relaxed"
            >
              <p className="mb-3">
                To repattern the human experience — unlocking the potential within
                individuals, organisations and humanity itself, so we can evolve
                beyond the pain, beyond survival, transcend inherited and personal
                trauma, and consciously shape a future driven by coherence, purpose
                and limitless potential.
              </p>
              <footer className="mt-3 text-gray-500 text-sm tracking-widest uppercase not-italic">
                — The Big Why
              </footer>
            </motion.blockquote>
          </div>
        </div>
      </div>
    </section>
  )
}
