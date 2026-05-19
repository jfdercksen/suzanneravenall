'use client'

import { motion } from 'framer-motion'

const CAL_URL = process.env.NEXT_PUBLIC_CAL_URL ?? 'https://cal.suzanneravenall.com'

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
      className="relative w-full bg-white py-20 lg:py-32 overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-brand-accent/10 blur-[120px]"
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p
          {...sectionReveal}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
        >
          YOUR NEXT STEP
        </motion.p>

        <motion.h2
          id="contact-cta-heading"
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' as const }}
          className="text-4xl lg:text-6xl font-light text-brand-primary leading-[1.08] mb-6"
        >
          Not sure where to start?
        </motion.h2>

        <motion.p
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' as const }}
          className="text-gray-600 text-lg font-light leading-relaxed mb-10"
        >
          Book a free 30-minute discovery call and let&rsquo;s find the right path together.
        </motion.p>

        <motion.div
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' as const }}
        >
          <a
            href={`${CAL_URL}/suzanneravenall/discovery-call`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-10 py-4 bg-brand-primary hover:bg-brand-primary-700 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:shadow-[0_8px_30px_theme(colors.brand.primary/30%)]"
          >
            Book Discovery Call &rarr;
          </a>
        </motion.div>
      </div>
    </section>
  )
}
