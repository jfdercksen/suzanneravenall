'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Newspaper, Star } from 'lucide-react'

const featuredMedia = [
  {
    outlet: 'CEO Magazine',
    type: 'Cover Story',
    title: 'Fast and Furious — Leading at Speed',
    description:
      'Dr. Suzanne Ravenall graces the cover of CEO Magazine, sharing her proven framework for leaders who must drive transformation at pace without burning out their teams.',
  },
  {
    outlet: 'Leadership Magazine',
    type: 'Feature Article',
    title: 'The Science of Human Transformation',
    description:
      'An in-depth feature exploring how Dr. Ravenall applies neuroscience and pattern-recognition to deliver lasting change in individuals and organisations.',
  },
  {
    outlet: 'Business Excellence Awards',
    type: 'Press Release',
    title: 'Ravenall Institute Recognised for Business Excellence',
    description:
      'The Ravenall Institute featured in the official Business Excellence Awards press release, celebrating outstanding contribution to coaching and human development.',
  },
  {
    outlet: 'CEO Magazine',
    type: 'Article',
    title: 'Execution Excellence — Turning Strategy into Results',
    description:
      'Dr. Ravenall on the gap between strategic intention and actual execution — and the mindset shifts that close it.',
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

export default function ResourcesFeaturedMedia() {
  return (
    <section aria-labelledby="featured-media-heading" className="w-full bg-white py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
        >
          Featured In
        </motion.p>

        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <motion.h2
            id="featured-media-heading"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl lg:text-5xl font-light text-gray-900"
          >
            Press &amp; Media
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link
              href="/resources/media"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-accent hover:gap-3 transition-all duration-300"
            >
              See all media appearances <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          {featuredMedia.map((item) => (
            <motion.div
              key={item.title}
              variants={cardVariants}
              className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary">
                  <Newspaper size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider font-medium text-brand-accent">
                    {item.type}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{item.outlet}</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-snug">
                {item.title}
              </h3>

              <p className="text-sm text-gray-600 font-light leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex items-center gap-3 text-sm text-gray-500 font-light"
        >
          <Star size={14} className="text-brand-accent flex-shrink-0" />
          <span>
            Featured in Leadership Magazine, CEO Magazine, Business Excellence Awards and more.
          </span>
        </motion.div>
      </div>
    </section>
  )
}
