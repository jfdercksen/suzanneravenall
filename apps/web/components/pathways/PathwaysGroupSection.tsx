'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { groupPathways } from '@/data/pathways'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

export default function PathwaysGroupSection() {
  return (
    <section
      aria-labelledby="pathways-group-heading"
      className="w-full bg-white py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6 }}
          className="mb-12 lg:mb-16"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
            Coming Soon
          </p>
          <h2
            id="pathways-group-heading"
            className="text-4xl lg:text-6xl font-light text-brand-primary leading-tight"
          >
            Group Transformation Pathways
          </h2>
          <p className="mt-5 text-base lg:text-lg text-gray-600 font-light max-w-2xl leading-relaxed">
            A new series of group immersions is currently in development — live
            cohort experiences guided by Suzanne. Register your interest to be
            the first to hear when enrolment opens.
          </p>
        </motion.div>

        {/* Immersion cards — 4 items, dark cards on light section */}
        <motion.ul
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {groupPathways.map((immersion) => (
            <motion.li key={immersion.id} variants={cardVariants} className="h-full">
              <div className="group relative flex h-full flex-col overflow-hidden rounded-card bg-brand-primary p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-brand-accent/15 blur-3xl transition-opacity duration-500 opacity-60 group-hover:opacity-100"
                />
                <div className="relative z-10 flex h-full flex-col">
                  <span className="inline-flex w-fit items-center rounded-button bg-white/10 border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold text-white/80 mb-5">
                    In Development
                  </span>
                  <h3 className="text-xl lg:text-2xl font-light text-white leading-tight mb-3">
                    {immersion.title}
                  </h3>
                  <p className="text-sm text-white/60 font-light leading-relaxed mb-8">
                    {immersion.description}
                  </p>
                  <Link
                    href="/contact"
                    className="mt-auto inline-flex w-fit items-center gap-2 rounded-button border border-white/30 px-5 py-2.5 text-xs uppercase tracking-[0.2em] font-semibold text-white transition-all duration-300 hover:border-brand-accent hover:bg-brand-accent hover:shadow-2xl hover:shadow-brand-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
                  >
                    Register Your Interest
                    <span
                      aria-hidden="true"
                      className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </Link>
                </div>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
