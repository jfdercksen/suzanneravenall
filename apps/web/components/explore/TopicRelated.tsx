'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { relatedTopics, type TopicSlug } from '@/app/explore/topics'

export default function TopicRelated({ slug }: { slug: TopicSlug }) {
  const related = relatedTopics(slug)

  if (related.length === 0) return null

  return (
    <section
      aria-labelledby="topic-related-heading"
      className="w-full bg-gray-950 py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-3xl mb-16 lg:mb-20"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
            Related Focus Areas
          </p>
          <h2
            id="topic-related-heading"
            className="text-4xl lg:text-6xl font-light text-white leading-tight"
          >
            Patterns rarely live in{' '}
            <span className="text-brand-accent">isolation</span>
          </h2>
        </motion.div>

        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {related.map((topic, index) => (
            <motion.li
              key={topic.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
            >
              <Link
                href={`/explore/${topic.slug}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-card transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 min-h-[280px]"
              >
                {/* Topic image fill */}
                <Image
                  src={topic.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />

                {/* Dark gradient overlay — stronger at bottom */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 transition-opacity duration-500 group-hover:from-black/95 group-hover:via-black/55"
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-end h-full p-7">
                  <span className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400 mb-3">
                    Explore
                  </span>
                  <h3 className="text-xl font-light text-white leading-snug mb-3 transition-colors duration-300 group-hover:text-brand-accent-400">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-white/65 font-light leading-relaxed mb-5 italic">
                    {topic.shortDescription}
                  </p>
                  <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-medium text-white/50 transition-colors duration-300 group-hover:text-brand-accent-400">
                    Read more
                    <span
                      aria-hidden="true"
                      className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
