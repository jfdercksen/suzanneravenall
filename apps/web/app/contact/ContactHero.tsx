'use client'

import { motion } from 'framer-motion'

// Hero is always in the initial viewport — use animate (mount), not whileInView.
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: 'easeOut' as const },
})

export default function ContactHero() {
  return (
    <section
      aria-labelledby="contact-hero-heading"
      className="relative bg-gray-50 w-full py-20 lg:py-32 overflow-hidden"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p
          {...fadeUp(0)}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
        >
          GET IN TOUCH
        </motion.p>

        <motion.h1
          id="contact-hero-heading"
          {...fadeUp(0.15)}
          className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-brand-primary leading-[1.08] mb-8"
        >
          Let&rsquo;s Start Your Transformation
        </motion.h1>

        <motion.p
          {...fadeUp(0.3)}
          className="text-gray-600 text-lg lg:text-xl font-light max-w-2xl mx-auto"
        >
          Book a discovery call, send a message, or find out which path is right for you.
        </motion.p>
      </div>
    </section>
  )
}
