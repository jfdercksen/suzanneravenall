'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

const programs: {
  title: string
  subtitle: string
  description: string
  price: string | null
  image: string
  href: string
  badge: string | null
  urgency: string | null
}[] = [
  {
    title: 'Precision Pattern Sessions',
    subtitle: 'Private 1:1 Work',
    description: 'Behaviour and pattern-level transformation, one-on-one with Suzanne. Nine session types: from Rapid Repatterning® to Akashic Intuitive Mastery.',
    price: null,
    image: '/images/generated/session-coaching.webp',
    href: '/services',
    badge: null,
    urgency: null,
  },
  {
    title: 'Recorded Group Repatterning',
    subtitle: 'Rapid Repatterning® Groups',
    description: 'Powerful group repatterning sessions on money, confidence, boundaries, attraction and more, recorded so you can start today.',
    price: 'From $90 · R1,500',
    image: '/images/generated/group-coaching-real.webp',
    href: '/programs#group',
    badge: null,
    urgency: null,
  },
  {
    title: 'The Basic Five (Programs 1–5)',
    subtitle: 'Practitioner Certification',
    description: 'Train as an internationally certified Resonance Repatterning practitioner. Self-study online with mentoring. Transform your life and gain the tools to transform others.',
    price: '$2,540 · R13,950',
    image: '/images/products/resonance-repatterning-full-basic-training-series-programs-1-5-live-via-zoom.jpeg',
    href: '/programs/resonance-repatterning-basic-5-series',
    badge: null,
    urgency: null,
  },
]

export default function FeaturedPrograms() {
  return (
    <section aria-labelledby="programs-heading" className="py-14 lg:py-24 bg-white">
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
          {programs.map(({ title, subtitle, description, price, image, href, badge, urgency }, i) => (
            <motion.div
              key={title}
              className="group relative bg-gray-50 border border-gray-100 rounded-card overflow-hidden hover:border-brand-accent/30 hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1 flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
            >
              <div className="relative h-52 overflow-hidden">
                <Image
                  src={image}
                  alt={title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {badge && (
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-accent text-white text-xs font-semibold uppercase tracking-wide">
                      {badge}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6 flex flex-col flex-1">
                <p className="text-brand-accent text-xs font-medium uppercase tracking-[0.2em] mb-1">{subtitle}</p>
                <h3 className="text-xl font-semibold text-brand-primary">{title}</h3>
                <p className="mt-3 text-gray-600 text-sm leading-relaxed flex-1">{description}</p>
                {urgency && (
                  <p className="mt-3 text-xs text-brand-accent font-medium">{urgency}</p>
                )}
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-brand-primary font-semibold">{price ?? 'Priced per session'}</span>
                  <Link
                    href={href}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold text-sm rounded-button transition-colors duration-150"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
