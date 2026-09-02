'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

// Poster-style cards modelled on the reference site's event carousel: full-bleed
// portrait photo, neutral black scrim, centered white type lockup. All text over
// imagery is white per no-bad-patterns.md.
const programs: {
  title: string
  subtitle: string
  tagline: string
  price: string | null
  image: string
  href: string
}[] = [
  {
    title: 'Precision Pattern Sessions',
    subtitle: 'Private 1:1 Work',
    tagline: 'One-on-one with Suzanne. Nine session types.',
    price: null,
    image: '/images/generated/session-coaching.webp',
    href: '/services',
  },
  {
    title: 'Recorded Group Repatterning',
    subtitle: 'Rapid Repatterning® Groups',
    tagline: 'Money, confidence, boundaries, attraction and more.',
    price: 'From $90 · R1,500',
    image: '/images/generated/group-coaching-real.webp',
    href: '/programs#group',
  },
  {
    title: 'The Basic Five',
    subtitle: 'Practitioner Certification',
    tagline: 'Train as an internationally certified practitioner.',
    price: '$2,540 · R13,950',
    image: '/images/products/resonance-repatterning-full-basic-training-series-programs-1-5-live-via-zoom.jpeg',
    href: '/programs/resonance-repatterning-basic-5-series',
  },
]

export default function FeaturedPrograms() {
  return (
    <section aria-labelledby="programs-heading" className="py-14 lg:py-24 bg-brand-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          className="text-center mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-brand-accent text-xs font-medium uppercase tracking-[0.3em] mb-3">
            Featured Programs
          </p>
          <h2 id="programs-heading" className="text-4xl lg:text-6xl font-semibold tracking-tight text-brand-primary">
            The fastest path to your breakthrough
          </h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map(({ title, subtitle, tagline, price, image, href }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
            >
              <Link
                href={href}
                aria-label={`${title} - ${subtitle}. Learn more`}
                className="group relative block aspect-[3/4] rounded-card overflow-hidden shadow-card-hover transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              >
                <Image
                  src={image}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Neutral black scrim — heavier at the foot for the meta row */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-brand-primary-900/85 via-brand-primary-900/55 to-brand-primary-900/25 transition-opacity duration-500 group-hover:from-brand-primary-900/90"
                />

                {/* Centered type lockup */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pb-16">
                  <p className="text-white/80 text-xs font-medium uppercase tracking-[0.3em] mb-4">
                    {subtitle}
                  </p>
                  <h3 className="text-3xl xl:text-4xl font-semibold tracking-tight uppercase text-white leading-[1.08]">
                    {title}
                  </h3>
                </div>

                {/* Foot — tagline, price, affordance */}
                <div className="absolute bottom-0 inset-x-0 p-6 text-center">
                  <p className="text-white/80 text-sm leading-snug">{tagline}</p>
                  <p className="mt-3 text-white text-sm font-semibold uppercase tracking-widest">
                    {price ?? 'Priced per session'}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-2 text-white text-xs font-semibold uppercase tracking-widest border-b border-white/40 group-hover:border-white pb-0.5 transition-colors duration-300">
                    Learn more <span aria-hidden="true">→</span>
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
