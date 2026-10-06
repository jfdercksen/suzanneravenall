'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

const sectionReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

// Card copy: Rapid Repatterning from her methodology language; Human Performance
// Replicator sourced 6 Oct from HPR's own homepage (https://humanperformancereplicator.com/)
// and the HPR blurb on Suzanne's homepage (https://suzanneravenall.com/).
const cards: {
  label: string
  title: string
  description: string
  href: string
}[] = [
  {
    label: 'Methodology',
    title: 'Rapid Repatterning\u00ae',
    description:
      'The flagship method. A fusion of metaphysics, neuroscience, trauma science, energy psychology and NLP, helping people and organisations rewire from the inside out, unlock their potential, and rise.',
    href: '/services/private-sessions/rapid-repatterning',
  },
  {
    label: 'Scalable transformation',
    title: 'Human Performance Replicator',
    description:
      'World-class behavioural modelling for the boardroom. HPR replicates the performance, skills, behaviours and attributes of the top ten percent into the average 80%, with lasting change in a matter of weeks, through a proprietary methodology and a licensed practice.',
    // HPR is a separate brand with its own site, as linked from the old homepage.
    href: 'https://humanperformancereplicator.com/',
  },
]

export default function TheEcosystem() {
  return (
    <section
      aria-labelledby="ecosystem-heading"
      className="bg-brand-cream py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          {...sectionReveal}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
        >
          The Ecosystem
        </motion.p>

        <motion.h2
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' as const }}
          id="ecosystem-heading"
          className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-[1.08] max-w-3xl mb-16"
        >
          Two arms of the same mission.
        </motion.h2>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
          {cards.map((card, i) => {
            const external = card.href.startsWith('http')
            // The diagonal "leaves the site" arrow only for the external card.
            const Arrow = external ? ArrowUpRight : ArrowRight
            return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: 'easeOut' as const,
              }}
            >
              <Link
                href={card.href}
                {...(external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                aria-label={card.title}
                className="group relative block h-full overflow-hidden rounded-card border border-white/5 bg-brand-primary-900 transition-all duration-500 hover:border-white/30 hover:shadow-2xl hover:-translate-y-1"
              >
                <Image
                  src="/images/hero-bg-suzanne-ravenall.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-br from-black/80 to-transparent"
                />
                <div className="relative z-10 p-10">
                  <p className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-6">
                    {card.label}
                  </p>
                  <h3 className="text-3xl font-medium tracking-tight text-white mb-5">
                    {card.title}
                  </h3>
                  <p className="text-white/80 font-light leading-relaxed mb-8">
                    {card.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-white font-medium text-sm uppercase tracking-widest">
                    Explore
                    <Arrow
                      className={`w-4 h-4 transition-transform duration-500 group-hover:translate-x-1${
                        external ? ' group-hover:-translate-y-1' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Link>
            </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
