'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: 'easeOut' as const },
})

const sectionReveal = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

const disciplines = [
  'Metaphysics',
  'Neuroscience',
  'Trauma science',
  'Energy psychology',
  'NLP',
  'Neurobiology of decision-making & performance',
  'Consciousness studies',
  'Ancient healing arts',
]

export default function TheStoryContent() {
  return (
    <>
      {/* Hero — dark navy */}
      <section
        aria-labelledby="story-hero-heading"
        className="relative bg-brand-primary pt-40 pb-24 lg:pt-52 lg:pb-32 overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-brand-accent/15 blur-[120px]"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.p
              {...fadeUp(0)}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              About &mdash; The Story
            </motion.p>
            <motion.h1
              id="story-hero-heading"
              {...fadeUp(0.2)}
              className="text-4xl lg:text-6xl font-light text-white leading-[1.08] mb-8"
            >
              Before the method, there was a life that had to be{' '}
              <span className="text-brand-accent">rebuilt</span>.
            </motion.h1>
            <motion.p
              {...fadeUp(0.4)}
              className="text-lg lg:text-xl text-white/75 font-light max-w-xl"
            >
              Dr. Suzanne Ravenall is a modern-day explorer of human potential — a
              transformation and performance coach, speaker, and multiple
              award-winning entrepreneur. This is the journey that shaped her work.
            </motion.p>
          </div>
        </div>
      </section>

      {/* The Rise — light */}
      <section aria-labelledby="rise-heading" className="bg-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.p
              {...sectionReveal}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              The Rise
            </motion.p>
            <motion.h2
              {...reveal(0.1)}
              id="rise-heading"
              className="text-4xl lg:text-6xl font-light text-brand-primary leading-[1.08] mb-8"
            >
              Transformation was her business — long before it became personal.
            </motion.h2>
            <motion.p
              {...reveal(0.2)}
              className="text-gray-700 text-lg font-light leading-relaxed mb-6"
            >
              Suzanne built one of South Africa&rsquo;s respected corporate
              transformation companies, guiding organisations through deep,
              structural change. Her work earned international recognition — she
              was named one of the top 11 women entrepreneurs globally.
            </motion.p>
            <motion.p
              {...reveal(0.3)}
              className="text-gray-700 text-lg font-light leading-relaxed"
            >
              From the outside, it was a story of achievement. What came next would
              test everything she understood about change — and reveal how much
              deeper transformation really goes.
            </motion.p>
          </div>
        </div>
      </section>

      {/* The Turning Point — dark */}
      <section
        aria-labelledby="turning-point-heading"
        className="bg-gray-950 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.p
              {...sectionReveal}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              The Turning Point
            </motion.p>
            <motion.h2
              {...reveal(0.1)}
              id="turning-point-heading"
              className="text-4xl lg:text-6xl font-light text-white leading-[1.08] mb-8"
            >
              Then everything broke.
            </motion.h2>
            <motion.p
              {...reveal(0.2)}
              className="text-white/70 text-lg font-light leading-relaxed mb-6"
            >
              A series of profound traumas shattered Suzanne&rsquo;s health and
              sense of identity — and triggered old, covered-up traumas from years
              before. A stroke followed, and then a multiple sclerosis diagnosis.
            </motion.p>
            <motion.p
              {...reveal(0.3)}
              className="text-white/70 text-lg font-light leading-relaxed"
            >
              She was forced to begin again — not from scratch, but from new
              awareness, truth, and a new way of being. The question was no longer
              how to perform. It was how to heal, and whether lasting change was
              truly possible.
            </motion.p>
          </div>
        </div>
      </section>

      {/* The Search — light */}
      <section aria-labelledby="search-heading" className="bg-gray-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <motion.p
                {...sectionReveal}
                className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
              >
                The Search
              </motion.p>
              <motion.h2
                {...reveal(0.1)}
                id="search-heading"
                className="text-4xl lg:text-6xl font-light text-brand-primary leading-[1.08] mb-8"
              >
                She went looking for answers — everywhere.
              </motion.h2>
              <motion.p
                {...reveal(0.2)}
                className="text-gray-700 text-lg font-light leading-relaxed"
              >
                What followed was a radical journey through the sciences and
                traditions of human change — a search for reason and meaning that
                refused to settle for surface-level fixes. Not just to survive,
                but to heal and transcend.
              </motion.p>
            </div>
            <motion.ul
              {...reveal(0.3)}
              className="grid sm:grid-cols-2 gap-4"
            >
              {disciplines.map((discipline, i) => (
                <motion.li
                  key={discipline}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: 'easeOut' as const,
                  }}
                  className="border-l-2 border-brand-accent bg-white px-5 py-4 text-brand-primary font-light shadow-sm"
                >
                  {discipline}
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </div>
      </section>

      {/* The Method Born — dark */}
      <section
        aria-labelledby="method-born-heading"
        className="bg-gray-950 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.p
              {...sectionReveal}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              The Method
            </motion.p>
            <motion.h2
              {...reveal(0.1)}
              id="method-born-heading"
              className="text-4xl lg:text-6xl font-light text-white leading-[1.08] mb-8"
            >
              What she found became a method. What the method revealed became a
              philosophy.
            </motion.h2>
            <motion.p
              {...reveal(0.2)}
              className="text-white/70 text-lg font-light leading-relaxed mb-6"
            >
              Suzanne fused the best of these worlds into a practical methodology
              for lasting transformation: Rapid Repatterning&reg; and
              Neuro-repatterning&reg;. Through her coaching, keynotes and
              trainings, she helps people and organisations rewire from the inside
              out, unlock their potential, and rise.
            </motion.p>
            <motion.p
              {...reveal(0.3)}
              className="text-white/70 text-lg font-light leading-relaxed mb-10"
            >
              At its heart is a single insight, proven first in her own life:
              radical transformation doesn&rsquo;t come from motivation or mindset
              tricks. It comes from repatterning the biological and energetic
              roots of pain and limitation. That insight now carries a name —
              Pattern Intelligence&trade;.
            </motion.p>
            <motion.blockquote
              {...reveal(0.4)}
              className="border-l-2 border-brand-accent pl-6 italic text-white text-2xl lg:text-3xl font-light leading-snug"
            >
              It&rsquo;s not you, it&rsquo;s your pattern.
            </motion.blockquote>
          </div>
        </div>
      </section>

      {/* The Mission — light */}
      <section aria-labelledby="mission-heading" className="bg-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.p
              {...sectionReveal}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              The Mission
            </motion.p>
            <motion.h2
              {...reveal(0.1)}
              id="mission-heading"
              className="text-4xl lg:text-6xl font-light text-brand-primary leading-[1.08] mb-8"
            >
              Rewriting the code of the human experience.
            </motion.h2>
            <motion.p
              {...reveal(0.2)}
              className="text-gray-700 text-lg font-light leading-relaxed mb-6"
            >
              Humanity is running outdated programming — neurological, emotional
              and societal — and Suzanne believes it&rsquo;s time to rewrite the
              code. Her moonshot: to make deep human transformation a replicable
              science that can be taught and scaled globally, so people, teams and
              entire systems can repattern their way to coherence, health and joy.
            </motion.p>
            <motion.blockquote
              {...reveal(0.3)}
              className="mt-10 border-l-2 border-brand-accent pl-6 italic text-brand-primary text-lg font-light leading-relaxed"
            >
              <p className="mb-3">
                To repattern the human experience — unlocking the potential within
                individuals, organisations and humanity itself, so we can evolve
                beyond the pain, beyond survival, transcend inherited and personal
                trauma, and consciously shape a future driven by coherence,
                purpose and limitless potential.
              </p>
              <footer className="mt-3 text-gray-500 text-sm tracking-widest uppercase not-italic">
                &mdash; The Big Why
              </footer>
            </motion.blockquote>
          </div>
        </div>
      </section>

      {/* Final CTA — dark navy */}
      <section
        aria-labelledby="story-cta-heading"
        className="relative bg-brand-primary py-20 lg:py-32 overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-brand-accent/15 blur-[120px]"
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            {...sectionReveal}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
          >
            Your Turn
          </motion.p>
          <motion.h2
            {...reveal(0.1)}
            id="story-cta-heading"
            className="text-4xl lg:text-6xl font-light text-white leading-[1.08] mb-8"
          >
            Your story has a pattern too.
          </motion.h2>
          <motion.p
            {...reveal(0.2)}
            className="text-white/70 text-lg font-light leading-relaxed max-w-xl mx-auto mb-12"
          >
            The first step is seeing it. Take the free Pattern Scan to discover
            the pattern running beneath your story — or speak with Suzanne
            directly.
          </motion.p>
          <motion.div
            {...reveal(0.3)}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/discover-your-pattern"
              className="inline-flex items-center justify-center px-10 py-4 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:shadow-[0_0_30px_theme(colors.brand.accent/50%)]"
            >
              Take the Free Pattern Scan
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-10 py-4 border border-white/40 hover:border-white text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-white/5"
            >
              Book a Discovery Call
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}
