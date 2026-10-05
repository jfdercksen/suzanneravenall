'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ExternalLink, Newspaper, Star } from 'lucide-react'
import { MEDIA_ARTICLES, type MediaArticle } from '@/data/mediaArticles'

// C20: the hub shows a subset of the shared press dataset rather than its own
// copy, so titles match /resources/media and /resources/articles, and a card
// becomes a link to the source the moment its entry gets an `href`.
const FEATURED_TITLES = [
  'Fast and Furious: Leading at Speed',
  'Leadership Magazine Feature',
  'Ravenall Institute: Business Excellence Award',
  'Execution Excellence',
]

export const featuredMedia: MediaArticle[] = FEATURED_TITLES.map((title) =>
  MEDIA_ARTICLES.find((a) => a.title === title),
).filter((a): a is MediaArticle => Boolean(a))

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

export default function ResourcesFeaturedMedia() {
  return (
    <section id="articles" aria-labelledby="featured-media-heading" className="w-full bg-brand-cream py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6 }}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
        >
          Featured In
        </motion.p>

        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <motion.h2
            id="featured-media-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl lg:text-5xl font-medium tracking-tight text-brand-primary"
          >
            Press &amp; Media
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link
              href="/resources/media"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-accent hover:gap-3 transition-all duration-300"
            >
              See all media appearances
              <span className="text-xs font-medium uppercase tracking-wider bg-brand-accent/20 text-brand-accent rounded-full px-2 py-0.5">
                Members
              </span>
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '0px' }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          {featuredMedia.map((item) => {
            const inner = (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-card bg-brand-primary/10 text-brand-primary">
                    <Newspaper size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider font-medium text-brand-accent">
                      {item.type}
                    </p>
                    <p className="text-sm font-medium text-brand-ink">{item.outlet}</p>
                  </div>
                </div>

                <h3 className="text-lg font-medium text-brand-ink mb-3 leading-snug">
                  {item.title}
                </h3>

                <p className="text-sm text-brand-muted font-light leading-relaxed">{item.description}</p>
              </>
            )

            return (
              <motion.div key={item.title} variants={cardVariants}>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block h-full bg-brand-sand rounded-card p-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                  >
                    {inner}
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-accent">
                      Read the article <ExternalLink size={14} aria-hidden="true" />
                    </span>
                  </a>
                ) : (
                  // No live source yet (KI025): a static citation, so no hover lift.
                  <div className="h-full bg-brand-sand rounded-card p-8">{inner}</div>
                )}
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex items-center gap-3 text-sm text-brand-muted font-light"
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
