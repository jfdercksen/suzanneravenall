'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Newspaper, ArrowRight } from 'lucide-react'

const mediaItems = [
  {
    outlet: 'Leadership Magazine',
    type: 'Article',
    title: 'Leadership Magazine Feature',
    description:
      'Dr. Suzanne Ravenall featured in Leadership Magazine, sharing insights on transformational leadership and the science of human potential.',
    href: 'https://suzanneravenall.com/article-leadership-magazine/',
  },
  {
    outlet: 'CEO Magazine',
    type: 'Cover Story',
    title: 'Fast and Furious — Leading at Speed',
    description:
      "A CEO Magazine cover story exploring how high-performing leaders drive transformation at pace. Dr. Ravenall's strategies for sustainable execution.",
    href: 'https://suzanneravenall.com/article-ceo-magazine-cover-story-fast-and-furious/',
  },
  {
    outlet: 'CEO Magazine',
    type: 'Cover Story',
    title: 'Execution Excellence',
    description:
      'The gap between strategic intention and actual execution — and the mindset shifts that close it. A CEO Magazine cover story.',
    href: 'https://suzanneravenall.com/article-ceo-magazine-cover-story-execution-excellence/',
  },
  {
    outlet: 'CEO Magazine',
    type: 'Cover Story',
    title: 'The Power of Positivity',
    description:
      'Dr. Ravenall on how positivity is not naive optimism but a disciplined neurological practice that reshapes outcomes in business and life.',
    href: 'https://suzanneravenall.com/article-ceo-magzaine-cover-story-power-of-positivity/',
  },
  {
    outlet: 'CEO Magazine',
    type: 'Article',
    title: 'B2B Outsourcing — A Human Lens',
    description:
      'Applying a human-centred lens to B2B outsourcing decisions — how people patterns determine whether partnerships succeed or fail.',
    href: 'https://suzanneravenall.com/article-ceo-magazine-b2b-outsourcing/',
  },
  {
    outlet: 'Business Excellence Awards',
    type: 'Press Release',
    title: 'Ravenall Institute — Business Excellence Award',
    description:
      'Official press release recognising the Ravenall Institute for outstanding contribution to coaching, human development and business excellence.',
    href: 'https://suzanneravenall.com/article-business-excellence-awards-press-release/',
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

export default function MediaContent() {
  return (
    <main>
      {/* Hero */}
      <section
        aria-labelledby="media-hero-heading"
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
            id="media-hero-heading"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-4xl lg:text-6xl font-light text-white leading-[1.1] max-w-3xl mb-6"
          >
            Media &amp; Press
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-white/70 font-light max-w-xl leading-relaxed"
          >
            Dr. Suzanne Ravenall featured across leading business and leadership publications —
            from CEO Magazine cover stories to international award announcements.
          </motion.p>
        </div>
      </section>

      {/* Media Grid */}
      <section
        aria-labelledby="media-appearances-heading"
        className="w-full bg-gray-950 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            id="media-appearances-heading"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-3xl lg:text-4xl font-light text-white mb-12"
          >
            All Media Appearances
          </motion.h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {mediaItems.map((item) => (
              <motion.div key={item.title} variants={cardVariants}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-gray-900 rounded-2xl p-6 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 h-full"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-accent/10 text-brand-accent group-hover:bg-brand-accent/20 transition-colors duration-300">
                      <Newspaper size={18} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-medium text-brand-accent">
                        {item.type}
                      </p>
                      <p className="text-sm font-semibold text-white">{item.outlet}</p>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-white mb-3 leading-snug flex-1">
                    {item.title}
                  </h3>

                  <p className="text-sm text-gray-400 font-light leading-relaxed mb-5">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm font-medium text-brand-accent group-hover:gap-3 transition-all duration-300">
                    <span>Read</span>
                    <ArrowRight size={14} />
                  </div>
                </a>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Press Enquiries CTA */}
      <section
        aria-labelledby="press-cta-heading"
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
            Media Enquiries
          </motion.p>

          <motion.h2
            id="press-cta-heading"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl lg:text-5xl font-light text-white mb-6"
          >
            Working on a story?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/70 font-light max-w-xl mx-auto mb-10 leading-relaxed"
          >
            For media enquiries, interview requests or press kit access, please get in touch.
            Dr. Ravenall is available for comment on topics covering transformation, neuroscience,
            leadership and human potential.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
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
