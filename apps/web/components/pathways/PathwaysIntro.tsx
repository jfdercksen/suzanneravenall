'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { featuredPathway } from '@/data/pathways'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

// Meta tags for the featured card: sourced from
// docs/content-source/pathways-overview-cards.md (Break the Loop featured block).
const FEATURED_META = [
  { label: 'Pathway Type', value: 'Personal' },
  { label: 'Format', value: 'Multi-session' },
]

export default function PathwaysIntro() {
  return (
    <section
      aria-labelledby="pathways-intro-heading"
      className="w-full bg-brand-sand py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-stretch">
          {/* Left: guided entry framing */}
          <motion.div
            {...fadeUp(0)}
            className="flex flex-col justify-center rounded-card bg-white border border-brand-border p-8 lg:p-12 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-5">
              A Guided Entry Point
            </p>
            <h2
              id="pathways-intro-heading"
              className="text-3xl lg:text-5xl font-medium tracking-tight text-brand-primary leading-tight mb-5"
            >
              Choose the pathway that meets you where you are
            </h2>
            <p className="text-base lg:text-lg text-brand-muted font-light leading-relaxed">
              Every pathway is built around a distinct transformation theme. Some
              focus on personal breakthrough and pattern interruption, others on
              foundations for children and young people. Think of this as a clear
              starting point: find the area that fits the season of life you are
              in right now.
            </p>
          </motion.div>

          {/* Right: featured pathway card */}
          {featuredPathway && (
            <motion.div
              {...fadeUp(0.15)}
              className="relative flex flex-col justify-center overflow-hidden rounded-card bg-brand-primary-900 p-8 lg:p-12"
            >
              {/* Background photo + neutral scrim: dark cards carry imagery, never flat colour */}
              <Image
                src="/images/generated/hero-masterclass.webp"
                alt=""
                aria-hidden="true"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-center opacity-40"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/85 via-black/60 to-black/90"
              />
              <div className="relative z-10">
                <span className="inline-flex items-center rounded-button bg-black/70 border border-white/40 px-4 py-1.5 text-xs uppercase tracking-[0.2em] font-medium text-white mb-6">
                  Featured Pathway
                </span>
                <h3 className="text-3xl lg:text-4xl font-medium tracking-tight text-white leading-tight mb-4">
                  {featuredPathway.title}
                </h3>
                <p className="text-base lg:text-lg text-white/80 font-light leading-relaxed mb-6">
                  {featuredPathway.description}
                </p>

                <dl className="flex flex-wrap gap-x-8 gap-y-3 mb-8">
                  {FEATURED_META.map((meta) => (
                    <div key={meta.label}>
                      <dt className="text-[10px] uppercase tracking-[0.25em] text-white/80 mb-1">
                        {meta.label}
                      </dt>
                      <dd className="text-sm font-medium text-white">{meta.value}</dd>
                    </div>
                  ))}
                </dl>

                <Link
                  href={`/transformation-pathways/${featuredPathway.slug}`}
                  className="group inline-flex items-center gap-3 rounded-button bg-white px-7 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-brand-primary transition-all duration-300 hover:bg-brand-sand hover:shadow-2xl"
                >
                  View Pathway
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
