'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const sectionReveal = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

const credentials: string[] = [
  'B.Msc.',
  'M.Msc.',
  'Msc.D.',
  'Rapid Repatterning\u00ae Practitioner',
  'Neuro-repatterning\u00ae Practitioner',
  'NLP Practitioner',
  'Energy Psychology',
  'Trauma Science',
  'Consciousness Studies',
  'Metaphysics',
  'Ancient Healing Arts',
  'Neurobiology of Performance',
]

// [CONFIRM with Suzanne]: qualifications count and years-experience values were
// counter widgets that didn't hydrate during scrape. Using same values as
// homepage AnimatedStats until client confirms exact numbers.
const stats: { target: number; suffix: string; label: string }[] = [
  { target: 20, suffix: '+', label: 'Years Experience' },
  { target: 1000, suffix: '+', label: 'Clients Transformed' },
  { target: 30, suffix: '+', label: 'Awards' },
  { target: 30, suffix: '+', label: 'Countries' },
]

function AnimatedStat({ target, suffix, label, delay }: {
  target: number
  suffix: string
  label: string
  delay: number
}) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (!inView) return
    const duration = 2000
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOut cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    const timer = setTimeout(() => requestAnimationFrame(tick), delay * 1000)
    return () => clearTimeout(timer)
  }, [inView, target, delay])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' as const }}
      className="border-t border-white/15 pt-6 min-w-[140px]"
    >
      <p className="text-5xl md:text-6xl font-light text-brand-accent mb-2">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-white/60 text-sm tracking-widest uppercase">
        {label}
      </p>
    </motion.div>
  )
}

export default function Credentials() {
  return (
    <section
      aria-labelledby="credentials-heading"
      className="bg-brand-primary py-20 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          {...sectionReveal}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
        >
          Credentials &amp; Expertise
        </motion.p>

        <motion.h2
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' as const }}
          id="credentials-heading"
          className="text-4xl md:text-6xl font-light text-white leading-[1.08] max-w-3xl mb-16"
        >
          Two decades. Multiple disciplines. One integrated method.
        </motion.h2>

        <div className="flex flex-wrap gap-12 mb-16">
          {stats.map((stat, i) => (
            <AnimatedStat
              key={stat.label}
              target={stat.target}
              suffix={stat.suffix}
              label={stat.label}
              delay={0.2 + i * 0.1}
            />
          ))}
        </div>

        {/* Credential tags */}
        <div className="flex flex-wrap gap-3">
          {credentials.map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.5,
                delay: i * 0.05,
                ease: 'easeOut' as const,
              }}
              className="px-5 py-2.5 rounded-full border border-white/20 bg-white/5 text-white/80 text-sm font-light backdrop-blur-sm"
            >
              {tag}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  )
}
