'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function AboutTeaser() {
  return (
    <section aria-labelledby="about-heading" className="py-20 lg:py-32 bg-brand-primary">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Image — left on desktop */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
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
            <div className="mt-4 lg:mt-0 lg:absolute lg:-bottom-4 lg:-right-8 bg-white text-brand-primary rounded-card p-4 shadow-card-hover inline-block lg:block">
              <p className="text-xs text-brand-primary/50 uppercase tracking-wider mb-0.5">Academic credentials</p>
              <p className="font-semibold text-sm text-brand-primary">B.Msc · M.Msc · Msc.D.</p>
            </div>
          </motion.div>

          {/* Text — right on desktop */}
          <motion.div
            className="lg:pl-4"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          >
            <p className="text-brand-accent text-xs font-medium uppercase tracking-[0.3em] mb-4">
              About Dr. Suzanne
            </p>
            <h2 id="about-heading" className="text-4xl lg:text-6xl font-light text-white leading-tight">
              Science-backed coaching with a track record of real results
            </h2>
            <p className="mt-6 text-white/70 leading-relaxed">
              Dr. Suzanne Ravenall developed Neuro-Repatterning® after two decades of clinical study and thousands of hours with private clients across four continents. Her methodology targets the childhood brain patterns that sabotage adult success — and dissolves them at the root.
            </p>
            <p className="mt-4 text-white/70 leading-relaxed">
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
                className="inline-flex items-center justify-center px-7 py-3.5 border-2 border-white text-white hover:bg-white hover:text-brand-primary font-semibold rounded-button transition-all duration-300"
              >
                View Services
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
