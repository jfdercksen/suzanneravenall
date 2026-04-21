'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Award } from 'lucide-react'

const featuredAwards = [
  {
    name: 'Global 100 — Most Inspiring Companies',
    organisation: 'Global 100 Awards',
    year: '2021',
    description:
      'The Ravenall Institute recognised among the Global 100 most inspiring companies, celebrating innovation and impact in human transformation.',
  },
  {
    name: 'Healthcare & Pharmaceutical Excellence Award',
    organisation: 'Healthcare & Pharmaceutical Awards',
    year: '2021',
    description:
      'Recognised for outstanding contribution to health and wellness through transformational coaching and integrative medicine approaches.',
  },
  {
    name: 'CRF Leading Managers & Best Employers',
    organisation: 'CRF (Corporate Research Foundation)',
    year: '2021',
    description:
      'Acknowledged for exemplary leadership management and creating an exceptional workplace culture that supports human flourishing.',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

export default function ResourcesFeaturedAwards() {
  return (
    <section aria-labelledby="featured-awards-heading" className="w-full bg-gray-50 py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
        >
          Recognition
        </motion.p>

        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <motion.h2
            id="featured-awards-heading"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl lg:text-5xl font-light text-gray-900"
          >
            Awards &amp; Honours
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link
              href="/resources/awards"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-accent hover:gap-3 transition-all duration-300"
            >
              See all awards <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {featuredAwards.map((award) => (
            <motion.div
              key={award.name}
              variants={cardVariants}
              className="bg-white rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-accent/10 text-brand-accent group-hover:bg-brand-accent/20 transition-colors duration-300">
                  <Award size={22} />
                </div>
                <span className="text-3xl font-light text-brand-accent">{award.year}</span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-snug">
                {award.name}
              </h3>

              <p className="text-sm font-medium text-brand-accent mb-4">{award.organisation}</p>

              <p className="text-sm text-gray-600 font-light leading-relaxed">{award.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
