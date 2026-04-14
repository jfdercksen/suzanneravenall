'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.8, delay, ease: 'easeOut' as const },
})

export default function TransformationQuote() {
  // TODO: Replace Image with <video> when Suzanne provides reel
  return (
    <section aria-labelledby="quote-heading" className="relative min-h-[70vh] flex items-center overflow-hidden">
      {/* Layer 1 — Background (same photo as hero, different crop) */}
      <Image
        src="/images/suzanne-revanell.jpg"
        alt=""
        fill
        priority={false}
        sizes="100vw"
        className="object-cover object-center"
        aria-hidden="true"
      />

      {/* Layer 2 — Heavy dark overlay */}
      <div aria-hidden="true" className="absolute inset-0 bg-black/60" />

      {/* Layer 3 — Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 text-center py-20">

        <motion.h2
          id="quote-heading"
          {...fadeUp(0)}
          className="text-xs tracking-[0.3em] text-brand-accent uppercase font-medium mb-8"
        >
          The Method
        </motion.h2>

        <motion.blockquote {...fadeUp(0.2)}>
          <p className="text-3xl md:text-5xl lg:text-6xl font-display text-white leading-[1.2] italic mb-8">
            &ldquo;I don&apos;t just help people change their minds.
            I help them change the structure that was
            running their mind all along.&rdquo;
          </p>
          <footer>
            <cite className="text-white/50 text-sm tracking-widest uppercase not-italic">
              — Dr. Suzanne Ravenall
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
