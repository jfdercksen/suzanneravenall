'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, ArrowRight, ExternalLink } from 'lucide-react'

const articles = [
  {
    title: 'Leadership Magazine Feature',
    publication: 'Leadership Magazine',
    date: 'December 2021',
    summary:
      'Dr. Suzanne Ravenall shares her proven framework for transformational leadership, exploring how leaders can harness the science of human potential to inspire enduring change in individuals and organisations.',
    href: 'https://suzanneravenall.com/article-leadership-magazine/',
  },
  {
    title: 'Business Excellence Awards Press Release',
    publication: 'Business Excellence Awards',
    date: 'December 2021',
    summary:
      'The Ravenall Institute recognised in the Business Excellence Awards — celebrating outstanding impact in coaching, human development and conscious business leadership.',
    href: 'https://suzanneravenall.com/article-business-excellence-awards-press-release/',
  },
  {
    title: 'Fast and Furious — Leading at Speed',
    publication: 'CEO Magazine',
    date: 'November 2021',
    summary:
      'How do high-performing leaders sustain transformation at pace without burning out? Dr. Ravenall breaks down the neurological and behavioural strategies that make speed and substance compatible.',
    href: 'https://suzanneravenall.com/article-ceo-magazine-cover-story-fast-and-furious/',
  },
  {
    title: 'Execution Excellence — Closing the Strategy-Action Gap',
    publication: 'CEO Magazine',
    date: 'November 2021',
    summary:
      'Most organisations know what they want to do. Far fewer actually do it. Dr. Ravenall examines the mindset, pattern and systemic shifts that turn strategic intent into real results.',
    href: 'https://suzanneravenall.com/article-ceo-magazine-cover-story-execution-excellence/',
  },
  {
    title: 'The Power of Positivity',
    publication: 'CEO Magazine',
    date: 'November 2021',
    summary:
      'Positivity is not naive optimism — it is a disciplined neurological practice. Dr. Ravenall explains how a regulated nervous system and rewired belief system produce measurably better outcomes.',
    href: 'https://suzanneravenall.com/article-ceo-magzaine-cover-story-power-of-positivity/',
  },
  {
    title: 'B2B Outsourcing — A Human Lens',
    publication: 'CEO Magazine',
    date: 'November 2021',
    summary:
      'Applying a human-centred lens to B2B outsourcing decisions. The people patterns — not the commercial terms — are what determine whether partnerships succeed or ultimately fail.',
    href: 'https://suzanneravenall.com/article-ceo-magazine-b2b-outsourcing/',
  },
  {
    title: 'Be Effective or Be at Risk',
    publication: 'CEO Magazine',
    date: 'November 2021',
    summary:
      'In a rapidly changing world, effectiveness is no longer optional. Dr. Ravenall on how organisations can develop human effectiveness as a strategic capability rather than an afterthought.',
    href: 'https://suzanneravenall.com/article-ceo-magazine-be-effective-or-be-at-risk/',
  },
  {
    title: 'Transformation — What It Really Takes',
    publication: 'CEO Magazine',
    date: 'November 2021',
    summary:
      'True transformation is a shift in being, not just behaviour. Dr. Ravenall distinguishes between surface-level change and the deep, lasting metamorphosis that rewires how people operate in the world.',
    href: 'https://suzanneravenall.com/article-ceo-magazine-transformation/',
  },
  {
    title: 'Creating the Future',
    publication: 'CEO Magazine',
    date: 'November 2021',
    summary:
      'You do not stumble into a great future — you design it from the inside out. Dr. Ravenall on intentional creation, purpose alignment and the role of consciousness in building what comes next.',
    href: 'https://suzanneravenall.com/article-ceo-magazine-creating-the-future/',
  },
  {
    title: 'New Trends in the Labour Market',
    publication: 'CEO Magazine',
    date: 'November 2021',
    summary:
      'The labour market is shifting fundamentally. Dr. Ravenall analyses what employees now want — and why organisations that ignore human needs will struggle to attract and retain top talent.',
    href: 'https://suzanneravenall.com/article-ceo-magazine-new-trend-labour-market/',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

export default function ArticlesContent() {
  return (
    <main>
      {/* Hero */}
      <section
        aria-labelledby="articles-hero-heading"
        className="w-full bg-brand-primary py-32 lg:py-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
          >
            Resources
          </motion.p>

          <motion.h1
            id="articles-hero-heading"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-4xl lg:text-6xl font-light text-white leading-[1.1] max-w-3xl mb-6"
          >
            Articles &amp; Publications
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-white/70 font-light max-w-xl leading-relaxed"
          >
            Thought leadership from Dr. Suzanne Ravenall — published across leading business
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
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-3xl lg:text-4xl font-light text-gray-900 mb-12"
          >
            All Published Articles
          </motion.h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {articles.map((article) => (
              <motion.div key={article.href} variants={cardVariants}>
                <a
                  href={article.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 h-full"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary/20 transition-colors duration-300 flex-shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-brand-accent uppercase tracking-wider">
                        {article.publication}
                      </span>
                      <span className="text-xs text-gray-400">{article.date}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-snug group-hover:text-brand-primary transition-colors duration-300">
                    {article.title}
                  </h3>

                  <p className="text-sm text-gray-600 font-light leading-relaxed flex-1">
                    {article.summary}
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-sm font-medium text-brand-accent group-hover:gap-3 transition-all duration-300">
                    <span>Read article</span>
                    <ExternalLink size={14} />
                  </div>
                </a>
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
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
          >
            Stay Informed
          </motion.p>

          <motion.h2
            id="articles-newsletter-cta-heading"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl lg:text-5xl font-light text-white mb-6"
          >
            Want more insights?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/70 font-light max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Subscribe to the monthly newsletter and receive Dr. Ravenall&apos;s latest thinking
            on consciousness, healing, transformation and human potential — delivered directly
            to your inbox.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
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
