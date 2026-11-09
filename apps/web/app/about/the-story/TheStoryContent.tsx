'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PageHeader, HEADER_UNDERLINE } from '@/components/shared/PageHeader'

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

// The Search, Suzanne's copy of 8 Nov 2026 (replaces the eight-item list).
const searchStats = [
  { value: '30+', label: 'years' },
  { value: '35+', label: 'disciplines' },
  { value: '7', label: 'domains of human change' },
  { value: '1', label: 'integrated discipline' },
]

const domains = [
  {
    title: 'The Brain',
    tagline: 'How we predict, decide and rewire.',
    disciplines:
      'Neurobiology · Neuroplasticity · Memory reconsolidation · Pattern recognition · Interpersonal neurobiology · The neuroscience of emotion, intuition and decision-making',
    drawingOn: 'Doidge, Pascual-Leone, Siegel, Damasio and Neisser',
  },
  {
    title: 'The Nervous System & Body',
    tagline: 'Where patterns are held, and where they’re released.',
    disciplines:
      'Polyvagal theory · Window of tolerance · Somatic processing · Heart–brain coherence · Body biochemistry · Epigenetics · Kinesiology and biofeedback',
    drawingOn: 'Porges, Levine, Van der Kolk, HeartMath and Waddington',
  },
  {
    title: 'Trauma & Development',
    tagline: 'Where patterns begin.',
    disciplines:
      'Trauma science · Developmental and psychodynamic theory · Developmental mapping from in utero to adulthood · Early pattern imprints',
    drawingOn: 'Van der Kolk, Levine, Bowlby, Winnicott and Maté',
  },
  {
    title: 'The Subconscious Mind',
    tagline: 'The code running beneath awareness.',
    disciplines:
      'Clinical hypnotherapy · NLP · Cognitive behavioural therapy · Transactional analysis · Mindfulness-based emotional processing',
    drawingOn: 'Braid, Bandler & Grinder, Beck, Berne and Kabat-Zinn',
  },
  {
    title: 'Behaviour & Performance',
    tagline: 'How change becomes the new normal.',
    disciplines:
      'Behavioural science · Flow states · Visuo-motor behaviour rehearsal · Habit and ritual architecture · Learning design',
    drawingOn: 'Skinner, Pavlov, Csikszentmihalyi, Suinn and Bloom',
  },
  {
    title: 'Relationships & Systems',
    tagline: 'How patterns move between people, teams and organisations.',
    disciplines:
      'Emotional intelligence · Relational intelligence · Triangulation dynamics · Life-skills science · International mediation',
    drawingOn: 'Goleman, Salovey & Mayer, Botvin and Daniels',
  },
  {
    title: 'Energy & Consciousness',
    tagline: 'The questions science is only beginning to measure.',
    disciplines:
      'Energy psychology and Thought Field Therapy · Biophotonics · Consciousness engineering · Quantum theory · Metaphysics · Ancient healing arts',
    drawingOn: 'Callahan, Gallo, Gurwitsch and Bentov',
  },
]

export default function TheStoryContent() {
  return (
    <>
      {/* Header: shared PageHeader, the header rule */}
      <PageHeader
        id="story-hero-heading"
        eyebrow="About: The Story"
        image="/images/hero-bg-suzanne-ravenall.jpg"
        title={
          <>
            Before the method, there was a life that had to be{' '}
            <span className={HEADER_UNDERLINE}>rebuilt</span>.
          </>
        }
        description="Dr. Suzanne Ravenall is a modern-day explorer of human potential, a transformation and performance specialist & strategist, speaker, and multiple award-winning entrepreneur. This is the journey that shaped her work."
      />

      {/* The Rise: light */}
      <section aria-labelledby="rise-heading" className="bg-brand-cream py-20 lg:py-32">
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
              className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-[1.08] mb-8"
            >
              Transformation was her business, long before it became personal.
            </motion.h2>
            <motion.p
              {...reveal(0.2)}
              className="text-brand-ink text-lg font-light leading-relaxed mb-6"
            >
              Suzanne built one of South Africa&rsquo;s respected corporate
              transformation companies, guiding organisations through deep,
              structural change. Her work earned international recognition: she
              was named one of the top 11 women entrepreneurs globally.
            </motion.p>
            <motion.p
              {...reveal(0.3)}
              className="text-brand-ink text-lg font-light leading-relaxed"
            >
              From the outside, it was a story of achievement. What came next would
              test everything she understood about change, and reveal how much
              deeper transformation really goes.
            </motion.p>
          </div>
        </div>
      </section>

      {/* The Turning Point: light */}
      <section
        aria-labelledby="turning-point-heading"
        className="bg-brand-sand py-20 lg:py-32"
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
              className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-[1.08] mb-8"
            >
              Then everything broke.
            </motion.h2>
            <motion.p
              {...reveal(0.2)}
              className="text-brand-muted text-lg font-light leading-relaxed mb-6"
            >
              A series of profound traumas shattered Suzanne&rsquo;s health and
              sense of identity, and triggered old, covered-up traumas from years
              before. A stroke followed, and then a multiple sclerosis diagnosis.
            </motion.p>
            <motion.p
              {...reveal(0.3)}
              className="text-brand-muted text-lg font-light leading-relaxed"
            >
              She was forced to begin again, not from scratch, but from new
              awareness, truth, and a new way of being. The question was no longer
              how to perform. It was how to heal, and whether lasting change was
              truly possible.
            </motion.p>
          </div>
        </div>
      </section>

      {/* The Search: light */}
      <section aria-labelledby="search-heading" className="bg-brand-cream py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.p
              {...sectionReveal}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              The Search
            </motion.p>
            <motion.h2
              {...reveal(0.1)}
              id="search-heading"
              className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-[1.08] mb-8"
            >
              Most people stop when they find a way to cope. She didn&rsquo;t.
            </motion.h2>
            <motion.p
              {...reveal(0.2)}
              className="text-brand-ink text-lg font-light leading-relaxed mb-6"
            >
              Over more than thirty years, she worked through the sciences and
              traditions of human change, from the laboratory to the ancient
              lineages and from the measurable to the mysterious. She
              wasn&rsquo;t looking for a way to manage the pain. She wanted to
              understand why people do what they do, and how to change it at the
              root.
            </motion.p>
            <motion.p
              {...reveal(0.3)}
              className="text-brand-primary text-xl font-light leading-relaxed mb-6"
            >
              She wanted more than survival. She wanted to heal, and then to go
              further.
            </motion.p>
            <motion.p
              {...reveal(0.4)}
              className="text-brand-ink text-lg font-light leading-relaxed"
            >
              She didn&rsquo;t just learn about it: she qualified in it and
              through this search for meaning and change so discovered the
              levers. And these 30+ years are built into this method of change
              for you to benefit from without having to do it yourself.
            </motion.p>
          </div>

          <ul
            aria-label="The search in numbers"
            className="mt-16 lg:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {searchStats.map((stat, i) => (
              <motion.li
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' as const }}
                className="border-t border-brand-border pt-6"
              >
                <p className="text-4xl lg:text-5xl font-semibold tracking-tight text-brand-primary mb-2">
                  {stat.value}
                </p>
                <p className="text-brand-muted text-sm tracking-widest uppercase">
                  {stat.label}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* The seven domains: dark */}
      <section
        aria-labelledby="domains-heading"
        className="bg-brand-primary-900 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p
            {...sectionReveal}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400 mb-6"
          >
            7 Domains of Human Change
          </motion.p>
          <motion.h2
            {...reveal(0.1)}
            id="domains-heading"
            className="text-4xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08] max-w-3xl mb-16"
          >
            Each discipline held part of the answer. None held all of it.
          </motion.h2>

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {domains.map((domain, i) => (
              <motion.li
                key={domain.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.1, ease: 'easeOut' as const }}
                className="flex flex-col rounded-card bg-brand-primary-700 p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
              >
                <h3 className="text-2xl font-medium text-white mb-2">{domain.title}</h3>
                <p className="text-white/80 font-light leading-relaxed mb-5">{domain.tagline}</p>
                <p className="text-white/70 text-sm font-light leading-relaxed mb-6">
                  {domain.disciplines}
                </p>
                <p className="mt-auto border-t border-white/15 pt-4 text-brand-accent-400 text-sm leading-relaxed">
                  Drawing on the work of {domain.drawingOn}
                </p>
              </motion.li>
            ))}
          </ul>

          <motion.p
            {...reveal(0.2)}
            className="mt-16 max-w-3xl text-white text-xl lg:text-2xl font-light leading-snug"
          >
            So she brought them together, and Rapid Repatterning&reg; &amp;
            Pattern Intelligence&trade; was born.
          </motion.p>
        </div>
      </section>

      {/* The Method Born: light */}
      <section
        aria-labelledby="method-born-heading"
        className="bg-brand-sand py-20 lg:py-32"
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
              className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-[1.08] mb-8"
            >
              What she found became a method. What the method revealed became a
              philosophy.
            </motion.h2>
            <motion.p
              {...reveal(0.2)}
              className="text-brand-primary text-xl font-light leading-relaxed mb-6"
            >
              She discovered that the problem that you see is rarely the
              problem. The problem is the unseen pattern quietly running the
              show.
            </motion.p>
            <motion.p
              {...reveal(0.3)}
              className="text-brand-muted text-lg font-light leading-relaxed mb-6"
            >
              Suzanne fused the best of these worlds into a practical methodology
              for lasting transformation: Rapid Repatterning&reg; and
              Neuro-repatterning&reg; &amp; Pattern Intelligence&trade;. Through
              her group &amp; individual transformations, keynotes and trainings,
              she helps people and organisations rewire from the inside out,
              unlock their potential, and rise.
            </motion.p>
            <motion.p
              {...reveal(0.4)}
              className="text-brand-muted text-lg font-light leading-relaxed mb-10"
            >
              At its heart is a single insight, proven first in her own life:
              radical transformation doesn&rsquo;t come from motivation or mindset
              tricks. It comes from repatterning the biological and energetic
              roots of pain and limitation. That insight now carries a name:
              Pattern Intelligence&trade;.
            </motion.p>
            <motion.blockquote
              {...reveal(0.5)}
              className="border-l-2 border-brand-accent pl-6 italic text-brand-primary text-2xl lg:text-3xl font-light leading-snug"
            >
              It&rsquo;s not you, it&rsquo;s your pattern.
            </motion.blockquote>
          </div>
        </div>
      </section>

      {/* The Mission: light */}
      <section aria-labelledby="mission-heading" className="bg-brand-cream py-20 lg:py-32">
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
              className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-[1.08] mb-8"
            >
              Rewriting the code of the human experience.
            </motion.h2>
            <motion.p
              {...reveal(0.2)}
              className="text-brand-ink text-lg font-light leading-relaxed mb-6"
            >
              Humanity is running outdated programming, neurological, emotional
              and societal, and Suzanne believes it&rsquo;s time to rewrite the
              code. Her moonshot: to make deep human transformation a replicable
              science that can be taught and scaled globally, so people, teams and
              entire systems can repattern their way to coherence, health and joy.
            </motion.p>
            <motion.blockquote
              {...reveal(0.3)}
              className="mt-10 border-l-2 border-brand-accent pl-6 italic text-brand-primary text-lg font-light leading-relaxed"
            >
              <p className="mb-3">
                To repattern the human experience: unlocking the potential within
                individuals, organisations and humanity itself, so we can evolve
                beyond the pain, beyond survival, transcend inherited and personal
                trauma, and consciously shape a future driven by coherence,
                purpose and limitless potential.
              </p>
              <footer className="mt-3 text-brand-muted text-sm tracking-widest uppercase not-italic">
                The Big Why
              </footer>
            </motion.blockquote>
          </div>
        </div>
      </section>

      {/* Final CTA: photo-backed, black overlay */}
      <section
        aria-labelledby="story-cta-heading"
        className="relative bg-brand-primary py-20 lg:py-32 overflow-hidden"
      >
        <Image
          src="/images/generated/session-coaching.webp"
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className="object-cover opacity-50"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-brand-primary/90 via-brand-primary/75 to-brand-primary/90"
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            {...sectionReveal}
            className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-6"
          >
            Your Turn
          </motion.p>
          <motion.h2
            {...reveal(0.1)}
            id="story-cta-heading"
            className="text-4xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08] mb-8"
          >
            Your story has a pattern too.
          </motion.h2>
          <motion.p
            {...reveal(0.2)}
            className="text-white/80 text-lg font-light leading-relaxed max-w-xl mx-auto mb-12"
          >
            The first step is seeing it. Take the free Pattern Scan to discover
            the pattern running beneath your story, or speak with Suzanne
            directly.
          </motion.p>
          <motion.div
            {...reveal(0.3)}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/discover-your-pattern"
              className="inline-flex items-center justify-center px-10 py-4 bg-white hover:bg-brand-sand text-brand-primary font-medium text-sm uppercase tracking-widest rounded-button transition-all duration-300"
            >
              Take the Free Pattern Scan
            </Link>
            <Link
              href="/contact#book"
              className="inline-flex items-center justify-center px-10 py-4 border border-white/50 hover:border-white text-white font-medium text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-white/10"
            >
              Book a Discovery Call
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}
