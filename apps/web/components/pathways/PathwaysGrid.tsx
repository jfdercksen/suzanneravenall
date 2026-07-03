'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { personalPathways, youthPathways, categoryLabel, type PathwayCategory } from '@/data/pathways'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const badgeClasses = (category: PathwayCategory): string =>
  category === 'youth'
    ? 'bg-emerald-500/20 text-emerald-400'
    : 'bg-brand-accent/20 text-brand-accent'

const cardAccentClass = (category: PathwayCategory): string =>
  category === 'youth' ? 'border-l-emerald-500' : 'border-l-brand-accent'

export default function PathwaysGrid() {
  return (
    <section
      aria-labelledby="pathways-grid-heading"
      className="w-full bg-brand-primary-900 py-20 lg:py-32"
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
            Explore the Pathways
          </p>
          <h2
            id="pathways-grid-heading"
            className="text-4xl lg:text-6xl font-light text-white leading-tight"
          >
            Transformation Pathways
          </h2>
        </motion.div>

        {/* Personal Pathways — 7 cards, lg:grid-cols-4 = 2 rows (4+3) */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.5 }}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
        >
          Personal Pathways
        </motion.p>
        <motion.ul
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {personalPathways.map((pathway) => (
            <motion.li key={pathway.slug} variants={cardVariants}>
              <Link
                href={`/transformation-pathways/${pathway.slug}`}
                className={`group flex h-full flex-col rounded-card bg-white/5 border border-white/10 border-l-2 ${cardAccentClass(pathway.category)} p-6 transition-all duration-500 hover:-translate-y-1 hover:border-t-brand-accent/40 hover:border-r-brand-accent/40 hover:border-b-brand-accent/40 hover:bg-white/[0.07] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary-900`}
              >
                <span
                  className={`inline-flex w-fit items-center rounded-button px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold mb-4 ${badgeClasses(pathway.category)}`}
                >
                  {categoryLabel(pathway.category)}
                </span>
                <h3 className="text-base lg:text-lg font-light text-white leading-tight mb-3">
                  {pathway.title}
                </h3>
                <p className="text-sm text-white/60 font-light leading-relaxed mb-5">
                  {pathway.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-medium text-white/70 transition-colors duration-300 group-hover:text-brand-accent">
                  Learn More
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>

        {/* Young People Pathways — 5 cards, lg:grid-cols-3 = 2 rows (3+2) */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.5 }}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6 mt-16"
        >
          Young People Pathways
        </motion.p>
        <motion.ul
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {youthPathways.map((pathway) => (
            <motion.li key={pathway.slug} variants={cardVariants}>
              <Link
                href={`/transformation-pathways/${pathway.slug}`}
                className={`group flex h-full flex-col rounded-card bg-white/5 border border-white/10 border-l-2 ${cardAccentClass(pathway.category)} p-7 transition-all duration-500 hover:-translate-y-1 hover:border-t-brand-accent/40 hover:border-r-brand-accent/40 hover:border-b-brand-accent/40 hover:bg-white/[0.07] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary-900`}
              >
                <span
                  className={`inline-flex w-fit items-center rounded-button px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold mb-5 ${badgeClasses(pathway.category)}`}
                >
                  {categoryLabel(pathway.category)}
                </span>
                <h3 className="text-xl lg:text-2xl font-light text-white leading-tight mb-3">
                  {pathway.title}
                </h3>
                <p className="text-sm lg:text-base text-white/60 font-light leading-relaxed mb-6">
                  {pathway.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-medium text-white/70 transition-colors duration-300 group-hover:text-brand-accent">
                  Learn More
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}