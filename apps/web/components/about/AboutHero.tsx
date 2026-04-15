'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: 'easeOut' as const },
})

export default function AboutHero() {
  return (
    <section
      aria-labelledby="about-hero-heading"
      className="relative h-screen min-h-[640px] overflow-hidden"
    >
      <Image
        src="/images/hero-bg-suzanne-ravenall.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/20"
      />

      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-center h-full max-w-3xl">
          <motion.p
            {...fadeUp(0)}
            className="text-xs tracking-[0.3em] text-brand-accent uppercase font-medium mb-6"
          >
            Meet Dr. Suzanne Ravenall
          </motion.p>

          <motion.h1
            id="about-hero-heading"
            {...fadeUp(0.2)}
            className="text-4xl md:text-6xl lg:text-7xl font-light text-white leading-[1.08] mb-8"
          >
            Championing the change in the human condition{' '}
            <span className="text-brand-accent">one person at a time</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.4)}
            className="text-lg md:text-xl text-white/75 font-light max-w-xl"
          >
            B.Msc. M.Msc. Msc.D. — Transformation &amp; Performance Coach, Speaker,
            and multiple award-winning entrepreneur.
          </motion.p>

          <motion.blockquote
            {...fadeUp(0.6)}
            className="mt-10 max-w-2xl border-l-2 border-brand-accent pl-6 italic text-white/80 text-base md:text-lg font-light leading-relaxed"
          >
            &ldquo;When we find and disrupt the patterns that keep us stuck, we don&rsquo;t
            just change — we become.&rdquo;
          </motion.blockquote>
        </div>
      </div>
    </section>
  )
}
