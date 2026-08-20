'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
  transition: { duration: 0.8, delay, ease: 'easeOut' as const },
})

export default function TransformationQuote() {
  return (
    <section aria-label="The Method — Dr. Suzanne Ravenall" className="relative min-h-[70vh] flex items-center overflow-hidden">

      {/* Layer 1 — Background video (generate with: node infra/scripts/generate-quote-video.mjs) */}
      <video
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-80"
        poster="/images/suzanne-ravenall.jpg"
      >
        <source src="/videos/generated/transformation-quote.mp4" type="video/mp4" />
      </video>

      {/* Layer 2 — Heavy dark overlay */}
      <div aria-hidden="true" className="absolute inset-0 bg-black/45" />

      {/* Layer 3 — Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 text-center py-20">

        <motion.p
          {...fadeUp(0)}
          className="text-xs tracking-[0.3em] text-white/80 uppercase font-medium mb-8"
        >
          The Method
        </motion.p>

        <motion.blockquote {...fadeUp(0.2)}>
          <p className="text-3xl lg:text-5xl xl:text-6xl font-display text-white leading-[1.2] italic mb-8">
            &ldquo;I don&apos;t just help people change their minds.
            I help them change the structure that was
            running their mind all along.&rdquo;
          </p>
          <footer>
            <cite className="text-white/80 text-sm tracking-widest uppercase not-italic">
              Dr. Suzanne Ravenall
            </cite>
          </footer>
        </motion.blockquote>

        <motion.div {...fadeUp(0.6)} className="mt-10">
          <Link
            href="/about"
            className="inline-flex items-center justify-center border border-white/40 hover:border-white text-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-white/10 transition-all duration-300 rounded-button"
          >
            Discover The Method
          </Link>
        </motion.div>

      </div>
    </section>
  )
}
