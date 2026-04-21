'use client'

import { motion } from 'framer-motion'

const sectionReveal = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' } as const,
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

export default function ContactFinalCTA() {
  return (
    <section
      aria-labelledby="contact-cta-heading"
      className="relative w-full bg-brand-primary py-20 md:py-32 overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-brand-accent/15 blur-[120px]"
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          id="contact-cta-heading"
          {...sectionReveal}
          className="text-4xl md:text-6xl font-light text-white leading-[1.08] mb-6"
        >
          Not sure where to start?
        </motion.h2>

        <motion.p
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' as const }}
          className="text-white/70 text-lg font-light leading-relaxed mb-10"
        >
          Book a free 30-minute discovery call and let&rsquo;s find the right path together.
        </motion.p>

        <motion.div
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' as const }}
        >
          <a
            href="https://cal.com/suzanneravenall"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-10 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:shadow-[0_0_30px_theme(colors.brand.accent/50%)]"
          >
            Book Discovery Call &rarr;
          </a>
        </motion.div>
      </div>
    </section>
  )
}
