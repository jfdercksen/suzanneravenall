'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Topic } from '@/app/explore/topics'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

export default function TopicCTA({ topic }: { topic: Topic }) {
  return (
    <section
      aria-labelledby="topic-cta-heading"
      className="relative w-full bg-brand-primary overflow-hidden"
    >
      {/* Background gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-primary-800 to-brand-primary-900"
      />
      {/* Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-accent/10 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
          {/* Left — copy + CTAs */}
          <div>
            <motion.p
              {...fadeUp(0)}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              Work With Suzanne
            </motion.p>

            {/* ctaHook replaces the awkward "Work on [title] with Suzanne" concatenation */}
            <motion.h2
              id="topic-cta-heading"
              {...fadeUp(0.1)}
              className="text-4xl lg:text-5xl font-light text-white leading-tight mb-6"
            >
              {topic.ctaHook}
            </motion.h2>

            <motion.p
              {...fadeUp(0.2)}
              className="text-lg text-white/70 font-light leading-relaxed mb-8"
            >
              Book a discovery call. We&apos;ll map the pattern underneath what
              you&apos;re working with and the path to change it.
            </motion.p>

            {/* Social proof — outcome placeholder */}
            <motion.div
              {...fadeUp(0.25)}
              className="mb-8 pl-5 border-l border-brand-accent/40"
            >
              <p className="text-sm text-white/55 font-light italic leading-relaxed">
                {topic.testimonial.outcome}
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-3 rounded-button bg-brand-accent px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-brand-accent-700 hover:shadow-2xl hover:shadow-brand-accent/30"
              >
                Book Discovery Call
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/portal/resources"
                className="inline-flex items-center justify-center px-8 py-4 border border-white/30 hover:border-white/60 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-white/10"
              >
                Start with a Free Resource
              </Link>
            </motion.div>

            {/* Reassurance line */}
            <motion.p
              {...fadeUp(0.4)}
              className="mt-4 text-xs text-white/40 font-light tracking-wide"
            >
              Discovery calls are 30 minutes, complimentary.
            </motion.p>
          </div>

          {/* Right — Suzanne portrait */}
          <motion.div
            {...fadeUp(0.15)}
            className="relative hidden lg:block"
          >
            <div className="relative h-[520px] w-full overflow-hidden rounded-card">
              <Image
                src="/images/suzanne-portrait.jpg"
                alt="Dr. Suzanne Ravenall"
                fill
                sizes="(max-width: 1280px) 50vw, 640px"
                className="object-cover object-left-top"
              />
              {/* Inner gradient — fade to brand at bottom */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-brand-primary/60 via-transparent to-transparent"
              />
            </div>

            {/* Floating name badge */}
            <div className="absolute bottom-6 left-6 right-6 bg-brand-primary/80 backdrop-blur-sm rounded-card p-4 border border-white/10">
              <p className="text-sm font-medium text-white">Dr. Suzanne Ravenall</p>
              <p className="text-xs text-brand-accent/80 font-light mt-0.5">
                Rapid Repatterning® Specialist
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
