'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Newspaper, ArrowRight } from 'lucide-react'
import { FEATURED_MEDIA_ARTICLES, type MediaArticle } from '@/data/mediaArticles'

// KI025: entries without an `href` (status 'needs-content-decision') render
// as unlinked citation cards — never a dead anchor to the old WordPress site.
const mediaItems = FEATURED_MEDIA_ARTICLES

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

function MediaCard({ item }: { item: MediaArticle }) {
  const inner = (
    <>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-accent/10 text-brand-accent group-hover:bg-brand-accent/20 transition-colors duration-300">
          <Newspaper size={18} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider font-medium text-brand-accent">
            {item.type}
          </p>
          <p className="text-sm font-semibold text-brand-primary">{item.outlet}</p>
        </div>
      </div>

      <h3 className="text-base font-semibold text-gray-900 mb-3 leading-snug flex-1">
        {item.title}
      </h3>

      <p className="text-sm text-gray-600 font-light leading-relaxed">{item.description}</p>
    </>
  )

  if (item.href) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col bg-gray-50 rounded-2xl p-6 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 h-full"
      >
        {inner}
        <div className="mt-5 flex items-center gap-2 text-sm font-medium text-brand-accent group-hover:gap-3 transition-all duration-300">
          <span>Read</span>
          <ArrowRight size={14} />
        </div>
      </a>
    )
  }

  // No live destination yet (KI025) — static citation card, no anchor.
  return <div className="flex flex-col bg-gray-50 rounded-2xl p-6 h-full">{inner}</div>
}

export default function MediaContent() {
  return (
    <main>
      {/* Hero */}
      <section
        aria-labelledby="media-hero-heading"
        className="w-full bg-gray-50 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
          >
            Resources
          </motion.p>

          <motion.h1
            id="media-hero-heading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-semibold tracking-tight text-brand-primary leading-[1.05] max-w-3xl mb-6"
          >
            Media &amp; Press
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-gray-600 font-light max-w-xl leading-relaxed"
          >
            Dr. Suzanne Ravenall featured across leading business and leadership publications,
            from CEO Magazine cover stories to international award announcements.
          </motion.p>
        </div>
      </section>

      {/* Media Grid */}
      <section
        aria-labelledby="media-appearances-heading"
        className="w-full bg-white py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            id="media-appearances-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6 }}
            className="text-3xl lg:text-4xl font-semibold tracking-tight text-brand-primary mb-12"
          >
            All Media Appearances
          </motion.h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '0px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {mediaItems.map((item) => (
              <motion.div key={item.title} variants={cardVariants}>
                <MediaCard item={item} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Press Enquiries CTA — dark, photo-backed band */}
      <section
        aria-labelledby="press-cta-heading"
        className="relative w-full bg-brand-primary py-20 lg:py-32 overflow-hidden"
      >
        <Image
          src="/images/generated/session-coaching.webp"
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className="object-cover opacity-50"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-brand-primary/90 via-brand-primary/75 to-brand-primary/90"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-4"
          >
            Media Enquiries
          </motion.p>

          <motion.h2
            id="press-cta-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-6"
          >
            Working on a story?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/80 font-light max-w-xl mx-auto mb-10 leading-relaxed"
          >
            For media enquiries, interview requests or press kit access, please get in touch.
            Dr. Ravenall is available for comment on topics covering transformation, neuroscience,
            leadership and human potential.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.3 }}
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
