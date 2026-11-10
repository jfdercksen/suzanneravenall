'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Program } from '@/data/programs'

// Self-study programmes and the recorded group healing series on the home
// page (Suzanne, 8 Nov). The cards are passed in from the server page.
export default function SelfStudyBand({ programs }: { programs: Program[] }) {
  return (
    <section aria-labelledby="home-self-study-heading" className="w-full bg-brand-cream py-20 lg:py-32">
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
              Self-Study Programmes
            </p>
            <h2
              id="home-self-study-heading"
              className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-tight mb-4"
            >
              Learn at your own pace
            </h2>
            <p className="text-base lg:text-lg text-brand-muted font-light leading-relaxed">
              Recorded programmes you can start anytime. Let your journey unfold in a time that is right for you.
            </p>
          </div>
          <Link
            href="/programs#self-paced"
            className="inline-flex w-fit items-center justify-center px-6 py-3 border border-brand-primary-300 hover:border-brand-primary text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-brand-sand"
          >
            All Self-Study
          </Link>
        </motion.div>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {programs.map((program, i) => (
            <motion.li
              key={program.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                href={`/programs/${program.slug}`}
                className="group relative flex h-full min-h-[280px] flex-col justify-end overflow-hidden rounded-card bg-brand-primary-900 p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
              >
                <Image
                  src={program.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover opacity-40 group-hover:opacity-20 transition-opacity duration-500"
                />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
                <span className="relative z-10 text-xs uppercase tracking-[0.25em] font-medium text-white/80 mb-2">Self-Study</span>
                <span className="relative z-10 text-lg font-medium text-white leading-snug mb-2">{program.name}</span>
                <span className="relative z-10 text-sm text-white/80 font-light leading-relaxed">{program.cardText ?? program.shortDescription}</span>
              </Link>
            </motion.li>
          ))}
          <motion.li
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: programs.length * 0.1 }}
          >
            <Link
              href="/programs/recorded-group-healing"
              className="group flex h-full min-h-[280px] flex-col justify-end rounded-card bg-brand-sand border border-brand-border p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
            >
              <span className="text-xs uppercase tracking-[0.25em] font-medium text-brand-accent mb-2">Recorded</span>
              <span className="text-lg font-medium text-brand-ink leading-snug mb-2">Recorded Group Healing Sessions</span>
              <span className="text-sm text-brand-muted font-light leading-relaxed">Group healing, in your own time.</span>
            </Link>
          </motion.li>
        </ul>
      </div>
    </section>
  )
}
