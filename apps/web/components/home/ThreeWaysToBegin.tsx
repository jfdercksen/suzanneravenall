'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

// Suzanne, 8 Nov: "3 ways to begin" listed four. Now exactly three: the
// Masterclass stays in the menu (Work With Me) and drops out of this block.
const ways = [
  {
    step: '01',
    badge: 'Free',
    title: 'Take the Pattern Scan',
    body: 'Start at the Pattern Discovery Hub and uncover the pattern quietly running your life.',
    cta: 'Pattern Discovery Hub',
    href: '/discover-your-pattern',
  },
  {
    step: '02',
    badge: 'Free',
    title: 'Book a Discovery Call',
    body: '30-minute complimentary call to map your patterns and find the right programme for you.',
    cta: 'Book Now',
    href: '/contact#book',
  },
  {
    step: '03',
    badge: 'Pathways',
    title: 'Choose a Transformation Pathway',
    body: 'Focused journeys to uncover hidden patterns, interrupt old loops and support lasting change.',
    cta: 'See the Pathways',
    href: '/transformation-pathways',
  },
]

export default function ThreeWaysToBegin() {
  return (
    <section aria-labelledby="three-ways-heading" className="w-full bg-brand-cream py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">Where to Start</p>
          <h2 id="three-ways-heading" className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary">
            Three ways to begin
          </h2>
        </motion.div>
        <ol className="grid gap-6 sm:grid-cols-3">
          {ways.map((way, i) => (
            <motion.li
              key={way.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col rounded-card bg-brand-sand p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="flex items-start justify-between mb-6">
                <span className="text-3xl font-semibold tracking-tight text-brand-primary">{way.step}</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide bg-white text-brand-ink border border-brand-border">
                  {way.badge}
                </span>
              </div>
              <h3 className="text-xl font-medium text-brand-primary mb-3">{way.title}</h3>
              <p className="text-sm text-brand-muted font-light leading-relaxed flex-1 mb-6">{way.body}</p>
              <Link
                href={way.href}
                className="inline-flex w-fit items-center justify-center px-5 py-2.5 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-xs uppercase tracking-widest font-medium rounded-button transition-colors duration-300"
              >
                {way.cta}
              </Link>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
