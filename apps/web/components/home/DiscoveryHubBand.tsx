'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

// Suzanne, 8 Nov: the Pattern Discovery Hub is the main entry to the site,
// and the Pattern Coach needs a tile on the home page. Copy from the hub and
// /pattern-coach pages.
export default function DiscoveryHubBand() {
  return (
    <section aria-labelledby="discovery-hub-heading" className="w-full bg-brand-sand py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="group relative flex flex-col overflow-hidden lg:col-span-2 min-h-[420px] rounded-card bg-brand-primary-900"
        >
          <Image
            src="/images/generated/explore-repatterning.webp"
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover opacity-50 group-hover:opacity-40 transition-opacity duration-500"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/10" />
          <div className="relative z-10 flex flex-1 flex-col justify-end p-8 lg:p-12">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-4">Start Here · Free</p>
            <h2
              id="discovery-hub-heading"
              className="text-4xl lg:text-6xl font-medium tracking-tight text-white leading-tight mb-4"
            >
              Pattern Discovery Hub
            </h2>
            <p className="text-base lg:text-lg text-white/85 font-light leading-relaxed max-w-xl mb-8">
              Take a free diagnostic to uncover the emotional, relational, health or performance
              pattern quietly running your life, then learn how to change it.
            </p>
            <Link
              href="/discover-your-pattern"
              className="inline-flex w-fit items-center justify-center px-7 py-3.5 bg-white hover:bg-brand-sand text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
            >
              Take the Free Pattern Scan
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col rounded-card bg-white border border-brand-border p-8 lg:p-10"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">24/7 AI Coach</p>
          <h3 className="text-2xl lg:text-3xl font-medium tracking-tight text-brand-primary leading-snug mb-4">
            Pattern Coach
          </h3>
          <p className="text-base text-brand-muted font-light leading-relaxed mb-8 flex-1">
            The moments that shape you rarely happen in a coaching session. The Pattern Intelligence
            Coach™ is your always-on AI coach, built on Dr. Suzanne Ravenall&rsquo;s method, ready
            whenever a pattern shows up. Try it free for 30 days.
          </p>
          <Link
            href="/pattern-coach"
            className="inline-flex w-fit items-center justify-center px-6 py-3 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
          >
            Meet the Pattern Coach
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
