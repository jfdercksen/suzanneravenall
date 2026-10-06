'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function AboutTeaser() {
  return (
    <section aria-labelledby="about-heading" className="py-14 lg:py-24 bg-brand-sand">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Text — left on desktop, below image on mobile */}
          <motion.div
            className="order-2 lg:order-1 lg:pr-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <p className="text-brand-accent text-xs font-medium uppercase tracking-[0.3em] mb-3">
              Meet Your Guide
            </p>
            <p className="text-sm text-brand-muted font-light italic mb-5 max-w-sm leading-relaxed">
              {/* Sourced 6 Oct: "over 30 years of entrepreneurial experience" (https://suzanneravenall.com/)
                  and "30+ Awards" (https://suzanneravenall.com/about/). The old client and country
                  counts are on none of her sites. */}
              Dr. Suzanne Ravenall, Neuro-Repatterning® pioneer, author, keynote speaker and award-winning transformation coach with over 30 years of experience.
            </p>
            <h2 id="about-heading" className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-[1.08]">
              Science-backed coaching with a track record of real results
            </h2>
            <p className="mt-6 text-brand-ink leading-relaxed">
              Dr. Suzanne Ravenall developed Neuro-Repatterning® from more than 30 years of experience. Her methodology targets the childhood brain patterns that sabotage adult success, and dissolves them at the root.
            </p>
            <p className="mt-4 text-brand-ink leading-relaxed">
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
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          >
            {/* Offset electric-blue block behind the portrait — flat accent as a
                graphic element (never as text colour), echoing the reference site's
                signature blue panel */}
            {/* The block is sized to the portrait only: sized to the whole column it
                also covered the credentials badge stacked below on mobile/tablet */}
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute top-4 -right-2 lg:top-6 lg:-right-4 w-full h-full bg-brand-accent rounded-card"
              />
              <div className="relative aspect-[4/5] rounded-card overflow-hidden shadow-card-hover">
                <Image
                  src="/images/suzanne-casual.jpg"
                  alt="Dr. Suzanne Ravenall"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-top"
                />
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0 lg:absolute lg:-bottom-4 lg:-left-8 bg-white border border-brand-border text-brand-primary rounded-card p-4 shadow-card-hover inline-block lg:block">
              <p className="text-xs text-brand-muted uppercase tracking-wider mb-0.5">Academic credentials</p>
              <p className="font-semibold text-sm text-brand-primary">B.Msc · M.Msc · Msc.D.</p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
