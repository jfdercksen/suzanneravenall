'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

const sectionReveal = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

// Note: the scraped about.md references Rapid Repatterning\u00ae and
// Neuro-repatterning\u00ae as Suzanne's named method, but does NOT contain
// a distinct "Human Performance Replicator" brand or description.
// Descriptions below are drawn from the about.md methodology language.
// The Human Performance Replicator copy is flagged [CONFIRM] for the client.
const cards: {
  label: string
  title: string
  description: string
  href: string
  confirm?: boolean
}[] = [
  {
    label: 'Methodology',
    title: 'Rapid Repatterning\u00ae',
    description:
      'The flagship method. A fusion of metaphysics, neuroscience, trauma science, energy psychology and NLP — helping people and organisations rewire from the inside out, unlock their potential, and rise.',
    href: '/services',
  },
  {
    label: 'Scalable transformation',
    title: 'Human Performance Replicator',
    // [CONFIRM] — scraped about.md names this concept but has no client-supplied
    // description for Human Performance Replicator. Copy below is from her methodology
    // language. Needs client review before shipping.
    description:
      'Suzanne\u2019s moonshot: making deep human transformation a replicable science that can be taught, scaled and licensed globally, so people, teams and entire systems can repattern their way to coherence, health optimisation and joy.',
    href: '/services',
    confirm: true,
  },
]

export default function TheEcosystem() {
  return (
    <section
      aria-labelledby="ecosystem-heading"
      className="bg-white py-20 md:py-32"
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
          className="text-4xl md:text-6xl font-light text-brand-primary leading-[1.08] max-w-3xl mb-16"
        >
          Two arms of the same mission.
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: 'easeOut' as const,
              }}
            >
              <Link
                href={card.href}
                className="group relative block h-full overflow-hidden rounded-card border border-white/5 bg-gray-900 transition-all duration-500 hover:border-brand-accent/40 hover:shadow-2xl hover:-translate-y-1"
              >
                <Image
                  src="/images/hero-bg.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-transparent"
                />
                <div className="relative z-10 p-10">
                  <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
                    {card.label}
                  </p>
                  <h3 className="text-3xl font-light text-white mb-5">
                    {card.title}
                  </h3>
                  <p className="text-white/65 font-light leading-relaxed mb-8">
                    {card.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-brand-accent font-medium text-sm uppercase tracking-widest">
                    Explore
                    <ArrowUpRight
                      className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
