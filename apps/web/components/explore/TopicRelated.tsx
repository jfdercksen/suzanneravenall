'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { relatedTopics, type TopicSlug } from '@/app/explore/topics'

const sectionVariants = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

export default function TopicRelated({ slug }: { slug: TopicSlug }) {
  const related = relatedTopics(slug, 3)

  return (
    <section
      aria-labelledby="topic-related-heading"
      className="w-full bg-gray-950 py-20 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...sectionVariants} className="max-w-3xl mb-16 md:mb-20">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
            Related Focus Areas
          </p>
          <h2
            id="topic-related-heading"
            className="text-4xl md:text-6xl font-light text-white leading-tight"
          >
            Patterns rarely live in{' '}
            <span className="text-brand-accent">isolation</span>
          </h2>
        </motion.div>

        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {related.map((topic, index) => (
            <motion.li
              key={topic.slug}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: 'easeOut',
              }}
            >
              <Link
                href={`/explore/${topic.slug}`}
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-card bg-gray-900 border border-white/5 p-8 transition-all duration-500 hover:-translate-y-1 hover:border-brand-accent/60 hover:shadow-2xl hover:shadow-brand-accent/10"
              >
                <div>
                  <span className="text-2xs uppercase tracking-[0.3em] font-medium text-brand-accent/80">
                    Explore
                  </span>
                  <h3 className="mt-6 text-xl md:text-2xl font-light text-white leading-tight transition-colors duration-300 group-hover:text-brand-accent">
                    {topic.title}
                  </h3>
                  <p className="mt-4 text-sm text-white/65 font-light leading-relaxed">
                    {topic.shortDescription}
                  </p>
                </div>

                <span className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-medium text-white/50 transition-colors duration-300 group-hover:text-brand-accent">
                  Read more
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
        </ul>
      </div>
    </section>
  )
}
