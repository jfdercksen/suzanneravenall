'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

// Above the fold — entrance uses `animate` (not whileInView).
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

export default function PathwaysHero() {
  return (
    <section
      aria-labelledby="pathways-hero-heading"
      className="relative w-full overflow-hidden bg-brand-primary"
    >
      {/* Background photo + navy scrim — dark heroes carry imagery, never flat colour */}
      <Image
        src="/images/generated/explore-transformation.webp"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-50"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-primary/90 via-brand-primary/75 to-brand-primary/90"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-40">
        <div className="max-w-4xl">
          <motion.p
            {...fadeUp(0)}
            className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-6"
          >
            Transformation Pathways
          </motion.p>

          <motion.h1
            id="pathways-hero-heading"
            {...fadeUp(0.1)}
            className="text-4xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.05] mb-8"
          >
            Individual &amp; group pathways for deep, lasting{' '}
            <span className="underline decoration-brand-accent-400 decoration-4 underline-offset-8">transformation</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.2)}
            className="text-lg lg:text-xl text-white/75 font-light max-w-2xl leading-relaxed"
          >
            Each pathway is a focused transformation journey, a guided way to
            uncover the hidden patterns running underneath, interrupt the loops
            that keep you stuck, and support real, lasting personal change.
            Begin an Individual Transformation Pathway today, or register your
            interest in the upcoming group immersions.
          </motion.p>
        </div>
      </div>
    </section>
  )
}
