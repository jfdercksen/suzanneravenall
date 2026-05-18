'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

const services = [
  {
    title: '1-on-1 Coaching',
    promise: 'Eliminate the hidden patterns blocking your success',
    image: '/images/suzanne-portrait.jpg',
    href: '/services',
    cta: 'Learn More',
  },
  {
    title: 'Group Programs',
    promise: 'Transform alongside others committed to real change',
    image: '/images/group-coaching.jpg',
    href: '/services',
    cta: 'View Programs',
  },
  {
    title: 'Practitioner Licensing',
    promise: 'Master Neuro-Repatterning® and change lives professionally',
    image: '/images/session.jpg',
    href: '/services',
    cta: 'Get Certified',
  },
]

export default function ServicesSection() {
  return (
    <section aria-labelledby="services-heading" className="py-20 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">

        <motion.div
          className="text-center mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-brand-accent text-xs font-medium uppercase tracking-[0.3em] mb-3">
            Work With Suzanne
          </p>
          <h2 id="services-heading" className="text-4xl lg:text-6xl font-light text-brand-primary">
            Choose your path to transformation
          </h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ title, promise, image, href, cta }, i) => (
            <motion.div
              key={title}
              className="group relative bg-white rounded-card overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={image}
                  alt={title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/60 to-transparent" />
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-brand-primary">{title}</h3>
                <p className="mt-2 text-gray-600 text-sm leading-relaxed">{promise}</p>
                <Link
                  href={href}
                  className="mt-5 inline-flex items-center text-brand-accent font-semibold text-sm hover:text-brand-accent-700 transition-colors duration-150"
                >
                  {cta}
                  <svg className="ml-1.5 w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
