'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Award, ArrowRight } from 'lucide-react'

const awardItems = [
  {
    name: 'Healthcare & Pharmaceutical Excellence Award',
    organisation: 'Healthcare & Pharmaceutical Awards',
    description:
      'Recognised for outstanding contribution to health and wellness through transformational coaching and integrative medicine approaches.',
  },
  {
    name: '20 Promising Companies Which Everyone Should Know',
    organisation: 'Industry Shortlist',
    description:
      'The Ravenall Institute shortlisted among 20 promising companies for its impact on human transformation and development.',
  },
  {
    name: 'Global 100: Most Inspiring Companies',
    organisation: 'Global 100 Awards',
    description:
      'The Ravenall Institute recognised among the Global 100 most inspiring companies, celebrating innovation and impact in human transformation.',
  },
  {
    name: 'Best Companies to Work For',
    organisation: 'CRF (Corporate Research Foundation)',
    description:
      'Acknowledged for creating an exceptional workplace culture that supports human flourishing and sustainable performance.',
  },
  {
    name: 'Best Company to Work For: 7th Edition',
    organisation: 'CRF (Corporate Research Foundation)',
    description:
      'Repeat recognition from CRF for consistent excellence in workplace culture and people leadership.',
  },
  {
    name: 'Leading Managers & Best Employers',
    organisation: 'CRF (Corporate Research Foundation)',
    description:
      'Acknowledged for exemplary leadership management and creating an exceptional workplace culture that supports human flourishing.',
  },
  {
    name: 'Leading Managers: Beyond the Ordinary',
    organisation: 'CRF (Corporate Research Foundation)',
    description:
      'Recognised for management practices that go beyond conventional leadership standards.',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

export default function AwardsContent() {
  return (
    <main>
      {/* Hero */}
      <section
        aria-labelledby="awards-hero-heading"
        className="w-full bg-brand-primary py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-6"
          >
            Resources
          </motion.p>

          <motion.h1
            id="awards-hero-heading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-4xl lg:text-6xl font-light text-white leading-[1.1] max-w-3xl mb-6"
          >
            Awards &amp; Honours
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-white/70 font-light max-w-xl leading-relaxed"
          >
            Recognised across healthcare, business and leadership excellence for the Ravenall
            Institute&rsquo;s contribution to coaching and human development.
          </motion.p>
        </div>
      </section>

      {/* Awards Grid */}
      <section
        aria-labelledby="all-awards-heading"
        className="w-full bg-gray-950 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            id="all-awards-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6 }}
            className="text-3xl lg:text-4xl font-light text-white mb-12"
          >
            All Awards
          </motion.h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '0px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {awardItems.map((item) => (
              <motion.div
                key={item.name}
                variants={cardVariants}
                className="flex flex-col bg-gray-900 rounded-2xl p-6 h-full"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-accent/10 text-brand-accent-400">
                    <Award size={18} />
                  </div>
                  <p className="text-xs uppercase tracking-wider font-medium text-brand-accent-400">
                    {item.organisation}
                  </p>
                </div>

                <h3 className="text-base font-semibold text-white mb-3 leading-snug flex-1">
                  {item.name}
                </h3>

                <p className="text-sm text-gray-400 font-light leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section
        aria-labelledby="awards-cta-heading"
        className="w-full bg-brand-primary py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-4"
          >
            Work With Suzanne
          </motion.p>

          <motion.h2
            id="awards-cta-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl lg:text-5xl font-light text-white mb-6"
          >
            Ready to start your transformation?
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold text-sm px-8 py-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Get in touch <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
