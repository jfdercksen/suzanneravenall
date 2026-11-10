'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

// Suzanne, 8 Nov: "work with me / book a talk" near the top of the home page
// instead of hidden at the bottom. Copy comes from the existing service pages.
const offers = [
  {
    eyebrow: 'Private 1:1 Work',
    title: 'Precision Pattern Sessions',
    body: 'One-on-one with Suzanne. Nine session types.',
    image: '/images/generated/session-coaching.webp',
    cta: 'Book a Session',
    href: '/services#private',
  },
  {
    eyebrow: 'Speaking',
    title: 'Book Suzanne to Speak',
    body: 'Most talks inspire for an evening. Suzanne changes how people see themselves, and what they do next.',
    image: '/images/hero-bg-suzanne-ravenall.jpg',
    cta: 'Book Suzanne to Speak',
    href: '/speaking',
  },
  {
    eyebrow: 'Group & Corporate',
    title: 'Corporate Wellness Retreats',
    body: 'Group sessions and corporate wellness retreats that get into the unconscious beliefs that disrupt lives.',
    image: '/images/generated/group-coaching-real.webp',
    cta: 'Explore Group Work',
    href: '/services#group',
  },
]

export default function WorkWithSuzanne() {
  return (
    <section
      id="work-with-suzanne"
      aria-labelledby="work-with-suzanne-heading"
      className="w-full bg-brand-cream py-20 lg:py-32 scroll-mt-16 lg:scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-12 max-w-3xl"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">Work With Me</p>
          <h2
            id="work-with-suzanne-heading"
            className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-tight"
          >
            Work with Suzanne
          </h2>
        </motion.div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer, i) => (
            <motion.li
              key={offer.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative flex flex-col overflow-hidden min-h-[360px] bg-brand-primary-900 rounded-card transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
            >
              <Image
                src={offer.image}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover opacity-40 group-hover:opacity-20 transition-opacity duration-500"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/20" />
              <div className="relative z-10 flex flex-1 flex-col justify-end p-8">
                <p className="text-xs uppercase tracking-[0.25em] font-medium text-white/80 mb-3">{offer.eyebrow}</p>
                <h3 className="text-2xl font-medium text-white leading-snug mb-3">{offer.title}</h3>
                <p className="text-sm text-white/80 font-light leading-relaxed mb-6">{offer.body}</p>
                <Link
                  href={offer.href}
                  className="inline-flex w-fit items-center justify-center px-6 py-3 bg-white hover:bg-brand-sand text-brand-primary text-xs uppercase tracking-widest font-medium rounded-button transition-all duration-300"
                >
                  {offer.cta}
                </Link>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
