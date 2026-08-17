'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, ArrowRight, ExternalLink } from 'lucide-react'
import { MEDIA_ARTICLES, type MediaArticle } from '@/data/mediaArticles'

// KI025: shared dataset — entries without an `href` (status
// 'needs-content-decision') render as unlinked citation cards.
const articles = MEDIA_ARTICLES

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

function ArticleCard({ article }: { article: MediaArticle }) {
  const inner = (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary/20 transition-colors duration-300 flex-shrink-0">
          <FileText size={16} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-brand-accent uppercase tracking-wider">
            {article.outlet}
          </span>
          <span className="text-xs text-gray-400">{article.date}</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-snug group-hover:text-brand-primary transition-colors duration-300">
        {article.title}
      </h3>

      <p className="text-sm text-gray-600 font-light leading-relaxed flex-1">
        {article.description}
      </p>
    </>
  )

  if (article.href) {
    return (
      <a
        href={article.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 h-full"
      >
        {inner}
        <div className="mt-5 flex items-center gap-2 text-sm font-medium text-brand-accent group-hover:gap-3 transition-all duration-300">
          <span>Read article</span>
          <ExternalLink size={14} />
        </div>
      </a>
    )
  }

  // No live destination yet (KI025) — static citation card, no anchor.
  return <div className="flex flex-col bg-gray-50 rounded-2xl p-6 h-full">{inner}</div>
}

export default function ArticlesContent() {
  return (
    <main>
      {/* Hero */}
      <section
        aria-labelledby="articles-hero-heading"
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
            id="articles-hero-heading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-4xl lg:text-6xl font-light text-white leading-[1.1] max-w-3xl mb-6"
          >
            Articles &amp; Publications
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-white/70 font-light max-w-xl leading-relaxed"
          >
            Thought leadership from Dr. Suzanne Ravenall, published across leading business
            and leadership magazines covering transformation, execution and human potential.
          </motion.p>
        </div>
      </section>

      {/* Articles Grid */}
      <section
        aria-labelledby="articles-grid-heading"
        className="w-full bg-white py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            id="articles-grid-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6 }}
            className="text-3xl lg:text-4xl font-light text-gray-900 mb-12"
          >
            All Published Articles
          </motion.h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '0px' }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {articles.map((article) => (
              <motion.div key={article.title} variants={cardVariants}>
                <ArticleCard article={article} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section
        aria-labelledby="articles-newsletter-cta-heading"
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
            Stay Informed
          </motion.p>

          <motion.h2
            id="articles-newsletter-cta-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl lg:text-5xl font-light text-white mb-6"
          >
            Want more insights?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/70 font-light max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Subscribe to the monthly newsletter and receive Dr. Ravenall&apos;s latest thinking
            on consciousness, healing, transformation and human potential, delivered directly
            to your inbox.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              href="/resources/newsletter"
              className="inline-flex items-center gap-2 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold text-sm px-8 py-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Subscribe to the newsletter <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
