'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function AboutTeaser() {
  return (
    <section aria-labelledby="about-heading" className="py-20 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Text — left on desktop, below image on mobile */}
          <motion.div
            className="order-2 lg:order-1 lg:pr-4"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <p className="text-brand-accent text-xs font-medium uppercase tracking-[0.3em] mb-3">
              Meet Your Guide
            </p>
            <p className="text-sm text-gray-500 font-light italic mb-5 max-w-sm leading-relaxed">
              Dr. Suzanne Ravenall — Neuro-Repatterning® pioneer, author, keynote speaker and transformation coach to 2,000+ clients across 30+ countries.
            </p>
            <h2 id="about-heading" className="text-4xl lg:text-6xl font-light text-brand-primary leading-tight">
              Science-backed coaching with a track record of real results
            </h2>
            <p className="mt-6 text-gray-600 leading-relaxed">
              Dr. Suzanne Ravenall developed Neuro-Repatterning® after two decades of clinical study and thousands of hours with private clients across four continents. Her methodology targets the childhood brain patterns that sabotage adult success — and dissolves them at the root.
            </p>
            <p className="mt-4 text-gray-600 leading-relaxed">
              The result is not motivation. It is permanent, measurable change.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-7 py-3.5 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold rounded-button transition-colors duration-150"
              >
                Meet Suzanne
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center px-7 py-3.5 border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white font-semibold rounded-button transition-all duration-300"
              >
                View Services
              </Link>
            </div>
          </motion.div>

          {/* Image — right on desktop, above text on mobile */}
          <motion.div
            className="order-1 lg:order-2 relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          >
            <div className="relative aspect-[4/5] rounded-card overflow-hidden shadow-card-hover">
              <Image
                src="/images/suzanne-casual.jpg"
                alt="Dr. Suzanne Ravenall"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top"
              />
            </div>
            <div className="mt-4 lg:mt-0 lg:absolute lg:-bottom-4 lg:-left-8 bg-white border border-gray-100 text-brand-primary rounded-card p-4 shadow-card-hover inline-block lg:block">
              <p className="text-xs text-brand-primary/50 uppercase tracking-wider mb-0.5">Academic credentials</p>
              <p className="font-semibold text-sm text-brand-primary">B.Msc · M.Msc · Msc.D.</p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
