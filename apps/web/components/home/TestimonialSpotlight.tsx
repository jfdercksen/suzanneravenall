'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { spotlightTestimonial } from '@/data/testimonials'

// Inline SVG quote mark — thick block-serif style, decoupled from font stack
// (project uses Poppins only; &ldquo; in Poppins lacks the typographic drama needed)
function QuoteMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 512 512"
      fill="currentColor"
      className="w-14 h-14 text-brand-accent mb-6"
    >
      {/* Font Awesome quote-left path — thick, cinematic block quote mark */}
      <path d="M464 256h-80v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8c-88.4 0-160 71.6-160 160v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48zm-288 0H96v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8C71.6 32 0 103.6 0 192v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48z" />
    </svg>
  )
}

// Spotlight data lives in data/testimonials.ts — the single source of truth.
// It stays null until Dr. Suzanne Ravenall signs off a real, verified client
// story; while it is null this component renders nothing.
export default function TestimonialSpotlight() {
  if (!spotlightTestimonial) return null
  const { stat, statLabel, supporting, quote, name, role, initials } = spotlightTestimonial

  return (
    <section className="bg-brand-sand py-14 lg:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* LEFT — Stat anchor */}
          {/* x offset reduced to -20 (was -40) to prevent clipping at 375px viewport */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.7, ease: 'easeOut' as const }}
          >
            <div className="mb-8">
              <p className="text-xs tracking-[0.3em] text-brand-accent uppercase font-medium mb-6">
                CLIENT RESULT
              </p>
              <div className="text-7xl lg:text-9xl font-semibold tracking-tight text-brand-primary leading-none mb-2">
                {stat}
              </div>
              <p className="text-xl lg:text-2xl text-brand-ink font-light uppercase tracking-wider">
                {statLabel}
              </p>
            </div>

            {/* Divider */}
            <div className="w-16 h-px bg-brand-accent mb-8" />

            {/* Supporting context */}
            <p className="text-brand-ink text-sm font-light leading-relaxed max-w-sm">
              {supporting}
            </p>
          </motion.div>

          {/* RIGHT — Quote + attribution + CTA */}
          {/* x offset reduced to 20 (was 40) to match left column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' as const }}
            className="flex flex-col justify-between"
          >
            <QuoteMark />

            <blockquote className="text-2xl lg:text-3xl font-medium tracking-tight text-brand-primary leading-snug mb-8">
              <p>{quote}</p>
              <footer className="flex items-center gap-4 mt-8">
                <div
                  aria-label={`${name} — avatar`}
                  className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0"
                >
                  <span className="text-white text-sm font-medium" aria-hidden="true">{initials}</span>
                </div>
                <cite className="not-italic">
                  <p className="text-brand-primary font-medium">{name}</p>
                  <p className="text-brand-muted text-sm">{role}</p>
                </cite>
              </footer>
            </blockquote>

            {/* CTA */}
            <div className="space-y-4">
              <p className="text-brand-muted text-sm uppercase tracking-widest">
                Start your transformation
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact"
                  className="bg-brand-accent hover:bg-brand-accent-700 text-white px-8 py-4 rounded-button text-sm uppercase tracking-widest font-medium transition-all duration-300 hover:shadow-[0_0_30px_rgba(23,25,244,0.4)] text-center"
                >
                  Book Discovery Call &rarr;
                </Link>
                <Link
                  href="/testimonials"
                  className="border border-brand-border hover:border-brand-primary text-brand-ink hover:text-brand-primary px-8 py-4 rounded-button text-sm uppercase tracking-widest font-medium transition-all duration-300 text-center"
                >
                  More Results
                </Link>
              </div>
            </div>

          </motion.div>
        </div>

      </div>
    </section>
  )
}
