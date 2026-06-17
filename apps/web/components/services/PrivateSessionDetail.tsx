'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { PrivateSession } from '@/data/privateSessions'

// Above-the-fold hero uses `animate`; everything below uses `whileInView`.
const fadeUpAnimate = (delay: number) => ({
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

const fadeUpInView = (delay: number) => ({
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

export default function PrivateSessionDetail({ session }: { session: PrivateSession }) {
  const paragraphs = session.bodyContent
    ? session.bodyContent.split('\n\n').filter(Boolean)
    : []

  return (
    <main>
      {/* ── Hero (dark) ─────────────────────────────────────────────────── */}
      <section
        aria-labelledby="session-hero-heading"
        className="relative w-full overflow-hidden bg-brand-primary"
      >
        {/* hero already labelled by #session-hero-heading below */}
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
            className="inline-flex items-center rounded-button px-4 py-1.5 text-xs uppercase tracking-[0.2em] font-semibold mb-6 bg-brand-accent/15 text-brand-accent border border-brand-accent/30"
          >
            Private Session
          </motion.span>

          <motion.h1
            id="session-hero-heading"
            {...fadeUpAnimate(0.1)}
            className="text-4xl lg:text-6xl font-light text-white leading-[1.08] mb-6"
          >
            {session.title}
          </motion.h1>

          <motion.p
            {...fadeUpAnimate(0.2)}
            className="text-lg lg:text-xl text-white/75 font-light max-w-2xl leading-relaxed"
          >
            {session.shortDescription}
          </motion.p>
        </div>
      </section>

      {/* ── About this session (light) ──────────────────────────────────── */}
      <section className="w-full bg-gray-50 py-20 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p
            {...fadeUpInView(0)}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-5"
          >
            About This Session
          </motion.p>

          {paragraphs.length > 0 ? (
            <div className="space-y-5">
              {paragraphs.map((paragraph, idx) => (
                <motion.p
                  key={idx}
                  {...fadeUpInView(0.05 + idx * 0.05)}
                  className="text-base lg:text-lg text-gray-600 font-light leading-relaxed"
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>
          ) : (
            /* Coming-soon placeholder — same pattern as the Pathways pages */
            <motion.div
              {...fadeUpInView(0.1)}
              className="rounded-card border border-dashed border-gray-300 bg-white p-8 lg:p-10 text-center"
            >
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
                Coming Soon
              </p>
              <p className="text-lg lg:text-xl font-light text-brand-primary leading-relaxed">
                Full details for this session are coming soon.
              </p>
              <p className="mt-3 text-sm text-gray-500 font-light">
                What the session involves, who it is best suited for and how to
                prepare will be added here shortly.
              </p>
            </motion.div>
          )}

          {/* Thin-content review notice — visible to Suzanne, easy to remove later */}
          {session.thinContent && (
            <motion.div
              {...fadeUpInView(0.15)}
              className="mt-10 rounded-card border border-amber-300 bg-amber-50 p-6 text-center"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-800">
                [Copy to be expanded — awaiting input]
              </p>
              <p className="mt-2 text-sm text-amber-700 font-light">
                The source page for this session was brief. This copy is a starting
                point and is intended to be expanded before launch.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Book this session (dark) ────────────────────────────────────── */}
      <section
        aria-labelledby="session-cta-heading"
        className="relative w-full overflow-hidden bg-brand-primary"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-accent/10 blur-3xl"
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
          <motion.h2
            id="session-cta-heading"
            {...fadeUpInView(0)}
            className="text-3xl lg:text-5xl font-light text-white leading-tight mb-8"
          >
            Ready to begin?
          </motion.h2>

          <motion.div
            {...fadeUpInView(0.1)}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {session.dualProduct ? (
              <>
                <Link
                  href={`/shop/${session.medusaHandle}`}
                  className="group inline-flex items-center justify-center gap-3 rounded-button bg-brand-accent px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-brand-accent-700 hover:shadow-2xl hover:shadow-brand-accent/30"
                >
                  Book Transformational Coaching
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
                <Link
                  href={`/shop/${session.dualProduct.handle}`}
                  className="group inline-flex items-center justify-center gap-3 rounded-button border border-white/30 px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:border-white/60 hover:bg-white/10"
                >
                  Book {session.dualProduct.label}
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </>
            ) : (
              <Link
                href={`/shop/${session.medusaHandle}`}
                className="group inline-flex items-center justify-center gap-3 rounded-button bg-brand-accent px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-brand-accent-700 hover:shadow-2xl hover:shadow-brand-accent/30"
              >
                Book a Session
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            )}
          </motion.div>

          <motion.div
            {...fadeUpInView(0.2)}
            className="mt-8 flex flex-col items-center gap-4"
          >
            <Link
              href="/contact"
              className="text-sm font-medium text-white/70 hover:text-white underline underline-offset-4 transition-colors duration-300"
            >
              Have questions? Get in touch
            </Link>
            <Link
              href="/services"
              className="text-xs uppercase tracking-[0.2em] text-white/50 hover:text-white/80 transition-colors duration-300"
            >
              ← All Services
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
