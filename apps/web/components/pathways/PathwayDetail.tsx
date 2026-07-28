'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { categoryLabel, type Pathway, type PathwayCategory } from '@/data/pathways'

const fadeUpAnimate = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

const fadeUpInView = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

const heroBadgeClasses = (category: PathwayCategory): string =>
  category === 'youth'
    ? 'bg-white/10 text-white/70 border border-white/20'
    : 'bg-brand-accent/15 text-brand-accent border border-brand-accent/30'

export default function PathwayDetail({ pathway }: { pathway: Pathway }) {
  return (
    <main>
      {/* ── Hero (dark) ─────────────────────────────────────────────────── */}
      <section
        aria-labelledby="pathway-hero-heading"
        className="relative w-full overflow-hidden bg-brand-primary"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-primary-800 to-brand-primary-900"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-brand-accent/10 blur-3xl"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <motion.span
            {...fadeUpAnimate(0)}
            className={`inline-flex items-center rounded-button px-4 py-1.5 text-xs uppercase tracking-[0.2em] font-semibold mb-6 ${heroBadgeClasses(
              pathway.category,
            )}`}
          >
            {categoryLabel(pathway.category)}
          </motion.span>

          <motion.h1
            id="pathway-hero-heading"
            {...fadeUpAnimate(0.1)}
            className="text-4xl lg:text-6xl font-light text-white leading-[1.08] mb-6"
          >
            {pathway.title}
          </motion.h1>

          <motion.p
            {...fadeUpAnimate(0.2)}
            className="text-lg lg:text-xl text-white/75 font-light max-w-2xl leading-relaxed"
          >
            {pathway.description}
          </motion.p>
        </div>
      </section>

      {/* ── Body (light) ────────────────────────────────────────────────── */}
      <section className="w-full bg-gray-50 py-20 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {pathway.hasDetailContent && pathway.detail ? (
            <motion.div {...fadeUpInView(0)}>
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-5">
                About This Pathway
              </p>
              <h2 className="text-2xl lg:text-4xl font-light text-brand-primary leading-snug mb-8">
                {pathway.detail.tagline}
              </h2>
              <div className="space-y-6">
                {pathway.detail.overview.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-base lg:text-lg text-gray-600 font-light leading-relaxed"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </motion.div>
          ) : (
            /* "Coming soon" placeholder — only for pathways without supplied content */
            <motion.div
              {...fadeUpInView(0)}
              className="rounded-card border border-dashed border-gray-300 bg-white p-8 lg:p-10 text-center"
            >
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
                Coming Soon
              </p>
              <p className="text-lg lg:text-xl font-light text-brand-primary leading-relaxed">
                Full programme details for this pathway are coming soon.
              </p>
              <p className="mt-3 text-sm text-gray-500 font-light">
                Session structure, format and who it is best suited for will be
                added here shortly.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Pattern assessment CTA (white — differs from gray-50 body above) ─ */}
      <section
        aria-labelledby="pathway-assessment-heading"
        className="py-12 lg:py-16 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUpInView(0)}>
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Pattern Assessment
            </p>
            <h2
              id="pathway-assessment-heading"
              className="text-2xl lg:text-3xl font-light text-brand-primary mb-4"
            >
              Not sure this is the right pathway for you?
            </h2>
            <p className="text-gray-500 text-base mb-8 max-w-xl mx-auto">
              Take a free diagnostic to discover which pattern is running your
              life — and which pathway addresses it directly.
            </p>
            <Link
              href="/discover-your-pattern"
              className="inline-flex items-center gap-2 rounded-button bg-brand-primary text-white px-8 py-3 text-sm font-medium hover:bg-brand-accent transition-colors duration-200"
            >
              Discover Your Pattern
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── CTA (dark) ──────────────────────────────────────────────────── */}
      <section
        aria-labelledby="pathway-cta-heading"
        className="relative w-full overflow-hidden bg-brand-primary"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-accent/10 blur-3xl"
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
          <motion.h2
            id="pathway-cta-heading"
            {...fadeUpInView(0)}
            className="text-3xl lg:text-5xl font-light text-white leading-tight mb-8"
          >
            Have questions about this pathway?
          </motion.h2>
          <motion.div
            {...fadeUpInView(0.1)}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center gap-3 rounded-button bg-brand-accent px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-brand-accent-700 hover:shadow-2xl hover:shadow-brand-accent/30"
            >
              Get in Touch
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
            <Link
              href="/transformation-pathways"
              className="inline-flex items-center justify-center px-8 py-4 border border-white/30 hover:border-white/60 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-white/10"
            >
              All Pathways
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
