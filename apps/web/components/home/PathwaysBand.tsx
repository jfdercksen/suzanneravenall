'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { personalPathways, youthPathways, PATHWAY_BOOKING_HREF } from '@/data/pathways'

// Transformation Pathways on the home page (Suzanne, 8 Nov), with the Book
// button every pathway now carries (item 7.1).
export default function PathwaysBand() {
  return (
    <section aria-labelledby="home-pathways-heading" className="w-full bg-brand-cream py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12"
        >
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Transformation Pathways
            </p>
            <h2
              id="home-pathways-heading"
              className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-tight"
            >
              Choose your pathway
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={PATHWAY_BOOKING_HREF}
              className="inline-flex items-center justify-center px-6 py-3 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
            >
              Book a Session
            </Link>
            <Link
              href="/transformation-pathways"
              className="inline-flex items-center justify-center px-6 py-3 border border-brand-primary-300 hover:border-brand-primary text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-brand-sand"
            >
              All Pathways
            </Link>
          </div>
        </motion.div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {personalPathways.map((pathway, i) => (
            <motion.li
              key={pathway.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.1 }}
            >
              <Link
                href={`/transformation-pathways/${pathway.slug}`}
                className="group flex h-full flex-col rounded-card bg-brand-sand p-6 transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-2xl"
              >
                <h3 className="text-lg font-medium text-brand-ink leading-snug mb-2">{pathway.title}</h3>
                <p className="text-sm text-brand-muted font-light leading-relaxed">{pathway.description}</p>
              </Link>
            </motion.li>
          ))}
          <motion.li
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href="/transformation-pathways#pathways-grid-heading"
              className="group flex h-full flex-col rounded-card bg-brand-primary-900 p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
            >
              <h3 className="text-lg font-medium text-white leading-snug mb-2">Young People Pathways</h3>
              <p className="text-sm text-white/80 font-light leading-relaxed">
                {youthPathways.map((p) => p.title).join(' · ')}
              </p>
            </Link>
          </motion.li>
        </ul>
      </div>
    </section>
  )
}
