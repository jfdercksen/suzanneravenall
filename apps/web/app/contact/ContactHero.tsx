'use client'

import { motion } from 'framer-motion'

const sectionReveal = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' } as const,
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

export default function ContactHero() {
  return (
    <section
      aria-labelledby="contact-hero-heading"
      className="relative bg-brand-primary w-full py-32 md:py-40 overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-brand-accent/10 blur-[140px]"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p
          {...sectionReveal}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
        >
          GET IN TOUCH
        </motion.p>

        <motion.h1
          id="contact-hero-heading"
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' as const }}
          className="text-4xl md:text-6xl font-light text-white leading-[1.08] mb-8"
        >
          Let&rsquo;s Start Your Transformation
        </motion.h1>

        <motion.p
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' as const }}
          className="text-white/70 text-lg md:text-xl font-light max-w-2xl mx-auto"
        >
          Book a discovery call, send a message, or find out which path is right for you.
        </motion.p>
      </div>
    </section>
  )
}
