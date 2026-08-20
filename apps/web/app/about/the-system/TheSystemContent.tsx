'use client'

import Image from 'next/image'
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

const frameworks: {
  label: string
  title: string
  description: string
  inDevelopment?: boolean
}[] = [
  {
    label: 'The Assessment',
    title: 'Pattern Discovery Instrument™',
    description:
      'Where everyone starts. The assessment that identifies the unconscious pattern running beneath your behaviour, available now as the free Pattern Scan.',
  },
  {
    label: 'The Consulting Methodology',
    title: 'Pattern Mapping Process™',
    description:
      'The structured methodology behind the Transformation Pathways and private sessions: mapping the pattern, then repatterning it at the level where it was formed.',
  },
  {
    label: 'The Practitioner Certification',
    title: 'Pattern Intelligence Coach™',
    description:
      'The certification track for practitioners: professional training programmes that teach the repatterning methodology so the work can be carried further than one person ever could.',
  },
  {
    label: 'The Digital Platform',
    title: 'Pattern Intelligence AI™',
    description:
      'The digital arm of the system: the Pattern Coach, bringing pattern-level guidance to you between sessions, whenever you need it.',
  },
  {
    label: 'For CEOs & Leadership Teams',
    title: 'Executive Capacity Intelligence™',
    description:
      'The framework for CEOs and leadership teams: applying pattern-level work to the way leaders think, decide and perform under pressure.',
    inDevelopment: true,
  },
  {
    label: 'For Organisations',
    title: 'Human Performance Intelligence™',
    description:
      'For organisations that want to understand what drives their top performers, and replicate it across teams and systems.',
    inDevelopment: true,
  },
  {
    label: 'The Executive Diagnostic',
    title: 'Executive Capacity Index™',
    description:
      'The diagnostic instrument for leadership and corporate audiences: measuring the patterns that determine executive capacity.',
    inDevelopment: true,
  },
]

export default function TheSystemContent() {
  return (
    <>
      {/* Hero — photo-backed dark navy */}
      <section
        aria-labelledby="system-hero-heading"
        className="relative bg-brand-primary pt-40 pb-24 lg:pt-52 lg:pb-32 overflow-hidden"
      >
        <Image
          src="/images/hero-bg-suzanne-ravenall.jpg"
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
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.p
              {...fadeUp(0)}
              className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-6"
            >
              About: The System
            </motion.p>
            <motion.h1
              id="system-hero-heading"
              {...fadeUp(0.2)}
              className="text-4xl sm:text-5xl lg:text-7xl font-semibold tracking-tight text-white leading-[1.05] mb-8"
            >
              One philosophy. An entire system built on it:{' '}
              <span className="underline decoration-brand-accent-400 decoration-[6px] underline-offset-8">Pattern Intelligence&trade;</span>
            </motion.h1>
            <motion.p
              {...fadeUp(0.4)}
              className="text-lg lg:text-xl text-white/80 font-light max-w-xl"
            >
              A behavioural performance methodology that helps people, leaders and
              organisations identify and change the unconscious patterns that
              drive performance.
            </motion.p>
          </div>
        </div>
      </section>

      {/* The Philosophy — light */}
      <section
        aria-labelledby="philosophy-heading"
        className="bg-white py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.p
              {...sectionReveal}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              The Philosophy
            </motion.p>
            <motion.h2
              {...reveal(0.1)}
              id="philosophy-heading"
              className="text-4xl lg:text-6xl font-semibold tracking-tight text-brand-primary leading-[1.08] mb-8"
            >
              It&rsquo;s not you, it&rsquo;s your pattern.
            </motion.h2>
            <motion.p
              {...reveal(0.2)}
              className="text-gray-700 text-lg font-light leading-relaxed mb-6"
            >
              Pattern Intelligence is the foundation underpinning all of
              Suzanne&rsquo;s work, products and intellectual property. It starts
              from one premise: what looks like a personality trait, a performance
              ceiling, or a recurring life problem is usually an unconscious
              pattern, and patterns can be identified, mapped and changed.
            </motion.p>
            <motion.p
              {...reveal(0.3)}
              className="text-gray-700 text-lg font-light leading-relaxed"
            >
              A philosophy alone doesn&rsquo;t change anyone. So around it,
              Suzanne has built a coherent system of instruments and methods,
              each one a different door into the same work, for individuals,
              leaders and organisations.
            </motion.p>
          </div>
        </div>
      </section>

      {/* The Frameworks — light */}
      <section
        aria-labelledby="frameworks-heading"
        className="bg-gray-50 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p
            {...sectionReveal}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
          >
            The Frameworks
          </motion.p>
          <motion.h2
            {...reveal(0.1)}
            id="frameworks-heading"
            className="text-4xl lg:text-6xl font-semibold tracking-tight text-brand-primary leading-[1.08] max-w-3xl mb-16"
          >
            Seven instruments. One intelligence.
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {frameworks.map((framework, i) => (
              <motion.div
                key={framework.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.1,
                  ease: 'easeOut' as const,
                }}
                className="group relative h-full rounded-card border border-gray-100 bg-white p-8 transition-all duration-500 hover:border-brand-accent/40 hover:shadow-2xl hover:-translate-y-1"
              >
                <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-5">
                  {framework.label}
                </p>
                <h3 className="text-2xl font-light text-brand-primary mb-4">
                  {framework.title}
                </h3>
                <p className="text-gray-600 font-light leading-relaxed">
                  {framework.description}
                </p>
                {framework.inDevelopment && (
                  <p className="mt-6 inline-flex items-center text-xs uppercase tracking-widest font-medium text-gray-500 border border-gray-300 rounded-button px-3 py-1">
                    In development
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Governing Principle — light */}
      <section
        aria-labelledby="principle-heading"
        className="bg-white py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.p
              {...sectionReveal}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              The Governing Principle
            </motion.p>
            <motion.h2
              {...reveal(0.1)}
              id="principle-heading"
              className="text-4xl lg:text-6xl font-semibold tracking-tight text-brand-primary leading-[1.08] mb-8"
            >
              Nothing random. Ever again.
            </motion.h2>
            <motion.blockquote
              {...reveal(0.2)}
              className="border-l-2 border-brand-accent pl-6 italic text-brand-primary text-lg font-light leading-relaxed mb-10"
            >
              <p className="mb-3">
                We never create anything random again. Every new programme,
                assessment, keynote, workshop, book, podcast, app, or piece of IP
                must answer one question: does this strengthen Pattern
                Intelligence? If it doesn&rsquo;t, we don&rsquo;t build it.
              </p>
              <footer className="mt-3 text-gray-500 text-sm tracking-widest uppercase not-italic">
                Dr. Suzanne Ravenall
              </footer>
            </motion.blockquote>
            <motion.p
              {...reveal(0.3)}
              className="text-gray-700 text-lg font-light leading-relaxed"
            >
              That discipline is why the system holds together. Whether you enter
              through the free{' '}
              <Link
                href="/discover-your-pattern"
                className="text-brand-accent underline underline-offset-4 hover:text-brand-accent-700 transition-colors duration-300"
              >
                Pattern Scan
              </Link>
              , a{' '}
              <Link
                href="/transformation-pathways"
                className="text-brand-accent underline underline-offset-4 hover:text-brand-accent-700 transition-colors duration-300"
              >
                Transformation Pathway
              </Link>{' '}
              or a{' '}
              <Link
                href="/services/private-sessions"
                className="text-brand-accent underline underline-offset-4 hover:text-brand-accent-700 transition-colors duration-300"
              >
                private session
              </Link>
              , you are working within the same methodology: one intelligence,
              applied at the depth and scale you need.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Final CTA — photo-backed dark navy */}
      <section
        aria-labelledby="system-cta-heading"
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
            Enter the System
          </motion.p>
          <motion.h2
            {...reveal(0.1)}
            id="system-cta-heading"
            className="text-4xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.08] mb-8"
          >
            Every part of the system starts in the same place: your pattern.
          </motion.h2>
          <motion.p
            {...reveal(0.2)}
            className="text-white/80 text-lg font-light leading-relaxed max-w-xl mx-auto mb-12"
          >
            Take the free Pattern Scan to discover which pattern is driving your
            results, or book a discovery call to talk through where to begin.
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
