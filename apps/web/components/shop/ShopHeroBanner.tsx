'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { PageHeader, HEADER_UNDERLINE } from '@/components/shared/PageHeader'

export function ShopHeroBanner() {
  return (
    <>
      {/* Header: shared PageHeader, the header rule. The video plays behind
          it with the photo as its poster, which handles the static fallback. */}
      <PageHeader
        id="shop-hero-heading"
        eyebrow="Transform Your Life"
        video={{ src: '/videos/generated/hero-shop.mp4', poster: '/images/hero-bg-suzanne-ravenall.jpg' }}
        title={
          <>
            Your Breakthrough
            <br />
            <span className={HEADER_UNDERLINE}>Starts Here</span>
          </>
        }
        description="48 programmes. One destination. The tools Suzanne has used to transform 2,000+ lives, now available to you."
      >
        <button
          type="button"
          onClick={() =>
            document.getElementById('programmes')?.scrollIntoView({ behavior: 'smooth' })
          }
          className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 bg-white hover:bg-brand-sand text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
        >
          Explore All Programmes
        </button>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 border border-white/50 hover:border-white text-white hover:bg-white/10 text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
        >
          Book a Discovery Call
        </Link>
      </PageHeader>

      {/* Credibility stats: a slim black band directly under the header */}
      <div className="bg-brand-primary-900 border-t border-white/10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex gap-6 sm:gap-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8"
        >
          {[
            { value: '2,000+', label: 'Lives transformed' },
            { value: '20+',    label: 'Years experience' },
            { value: '30+',    label: 'Countries reached' },
          ].map(({ value, label }) => (
            <div key={label}>
              <span className="block text-2xl sm:text-3xl font-semibold tracking-tight text-white">{value}</span>
              <span className="block mt-0.5 text-xs sm:text-sm text-white/70">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </>
  )
}
