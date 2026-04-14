'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

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

export default function TestimonialSpotlight() {
  return (
    <section className="bg-gray-950 py-20 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* LEFT — Stat anchor */}
          {/* x offset reduced to -20 (was -40) to prevent clipping at 375px viewport */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: 'easeOut' as const }}
          >
            <div className="mb-8">
              <p className="text-xs tracking-[0.3em] text-brand-accent uppercase font-medium mb-6">
                CLIENT RESULT
              </p>
              <div className="text-7xl lg:text-9xl font-light text-white leading-none mb-2">
                2×
              </div>
              <p className="text-xl lg:text-2xl text-white/60 font-light uppercase tracking-wider">
                Productivity in 6 months
              </p>
            </div>

            {/* Divider */}
            <div className="w-16 h-px bg-brand-accent mb-8" />

            {/* Supporting context */}
            <p className="text-white/40 text-sm font-light leading-relaxed max-w-sm">
              After just 3 sessions. A 30-year pattern dissolved.
              Business transformed.
            </p>
          </motion.div>

          {/* RIGHT — Quote + attribution + CTA */}
          {/* x offset reduced to 20 (was 40) to match left column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' as const }}
            className="flex flex-col justify-between"
          >
            <QuoteMark />

            <blockquote className="text-2xl lg:text-3xl font-light text-white leading-relaxed mb-8">
              <p>
                In three sessions I dismantled a self-sabotage pattern
                I&apos;d carried for 30 years. My business doubled in
                the following six months.
              </p>
              <footer className="flex items-center gap-4 mt-8">
                <div
                  aria-label="Sarah M. — avatar"
                  className="w-12 h-12 rounded-full bg-brand-primary border border-brand-accent/70 flex items-center justify-center flex-shrink-0"
                >
                  <span className="text-brand-accent text-sm font-medium" aria-hidden="true">SM</span>
                </div>
                <cite className="not-italic">
                  <p className="text-white font-medium">Sarah M.</p>
                  <p className="text-white/40 text-sm">CEO · Cape Town</p>
                </cite>
              </footer>
            </blockquote>

            {/* CTA */}
            <div className="space-y-4">
              <p className="text-white/60 text-sm uppercase tracking-widest">
                Start your transformation
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact"
                  className="bg-brand-accent hover:bg-brand-accent-700 text-white px-8 py-4 text-sm uppercase tracking-widest font-medium transition-all duration-300 hover:shadow-[0_0_30px_rgba(23,25,244,0.4)] text-center"
                >
                  Book Discovery Call &rarr;
                </Link>
                <Link
                  href="/about"
                  className="border border-white/50 hover:border-white/80 text-white/60 hover:text-white px-8 py-4 text-sm uppercase tracking-widest font-medium transition-all duration-300 text-center"
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
