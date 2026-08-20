"use client"

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import type { BlogPost } from '@/types/payload'

interface BlogListingContentProps {
  posts: BlogPost[]
}

const CAL_URL = process.env.NEXT_PUBLIC_CAL_URL ?? 'https://cal.suzanneravenall.com'

function formatDate(dateString?: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getExcerpt(post: BlogPost): string {
  if (post.seoDescription) return post.seoDescription
  return ''
}

export function ComingSoonSection() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center bg-brand-primary-900 overflow-hidden py-20 lg:py-32">
        {/* Background image with lightened overlay so image is visible */}
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src="/images/suzanne-casual.jpg"
            alt=""
            fill
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-4">
              Insights & Inspiration
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
              Our Blog is Launching Soon
            </h1>
            <p className="text-lg text-white/80 max-w-xl mx-auto mb-10">
              Insights on transformation, pattern mastery, and the science of lasting change.
              Subscribe to be the first to know when we go live.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-medium px-8 py-4 rounded-button transition-all duration-300"
            >
              Stay Updated
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        aria-labelledby="coming-soon-cta-heading"
        className="relative w-full bg-white py-20 lg:py-32 overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-brand-accent/10 blur-[120px]"
        />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
          >
            YOUR NEXT STEP
          </motion.p>

          <motion.h2
            id="coming-soon-cta-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl lg:text-6xl font-semibold tracking-tight text-brand-primary leading-[1.08] mb-6"
          >
            Ready to Transform Your Life?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-600 text-lg font-light leading-relaxed mb-10"
          >
            Book a free discovery call with Dr. Suzanne Ravenall and find your path to lasting change.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href={`${CAL_URL}/suzanneravenall/discovery-call`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-10 py-4 bg-brand-primary hover:bg-brand-primary-700 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:shadow-[0_8px_30px_theme(colors.brand.primary/30%)]"
            >
              Book Discovery Call &rarr;
            </a>
            <Link
              href="/programs"
              className="inline-flex items-center justify-center px-10 py-4 border border-brand-primary/30 hover:border-brand-primary text-brand-primary font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300"
            >
              Explore Programmes &rarr;
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}

export default function BlogListingContent({ posts }: BlogListingContentProps) {
  const [activeTag, setActiveTag] = useState<string>('All')

  const allTags = useMemo(
    () => Array.from(new Set(posts.flatMap((p) => (p.tags ?? []).map((t) => t.tag)))).sort(),
    [posts]
  )

  const filtered = useMemo(
    () =>
      activeTag === 'All'
        ? posts
        : posts.filter((p) => p.tags?.some((t) => t.tag === activeTag)),
    [posts, activeTag]
  )

  if (posts.length === 0) {
    return <ComingSoonSection />
  }

  return (
    <>
      {/* Hero */}
      <motion.section
        aria-labelledby="blog-hero-heading"
        className="relative py-20 lg:py-32 bg-gray-50 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
            Insights & Inspiration
          </p>
          <h1
            id="blog-hero-heading"
            className="text-4xl sm:text-5xl lg:text-7xl font-semibold tracking-tight text-brand-primary"
          >
            The Blog
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Science-backed perspectives on transformation, pattern mastery, and the art of
            becoming who you were always meant to be.
          </p>
        </div>
      </motion.section>

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <section className="bg-white border-b border-gray-100 sticky top-16 lg:top-20 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-2 py-4">
              {['All', ...allTags].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeTag === tag
                      ? 'bg-brand-accent text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Post grid */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <motion.p
              key={activeTag}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-500 text-lg py-16"
            >
              No posts found for &ldquo;{activeTag}&rdquo;.
            </motion.p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px' }}
                  transition={{ duration: 0.6, delay: (index % 3) * 0.1 }}
                  className="group bg-white rounded-card overflow-hidden border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                >
                  {/* Featured image */}
                  <Link href={`/blog/${post.slug}`} className="block relative aspect-[16/9] overflow-hidden">
                    {/* TODO: Replace placeholder with actual Payload image once payload:3001 is added
                        to next.config.mjs remotePatterns */}
                    <Image
                      src="/images/suzanne-ravenall.jpg"
                      alt={post.featuredImage?.alt ?? post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </Link>

                  {/* Card body */}
                  <div className="p-6">
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.map((t) => (
                          <span
                            key={t.id}
                            className="text-xs uppercase tracking-[0.2em] font-medium text-brand-accent"
                          >
                            {t.tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <Link href={`/blog/${post.slug}`}>
                      <h2 className="text-xl font-semibold text-gray-900 group-hover:text-brand-accent transition-colors duration-300 mb-3 line-clamp-2">
                        {post.title}
                      </h2>
                    </Link>

                    {getExcerpt(post) && (
                      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                        {getExcerpt(post)}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      {post.publishedAt && (
                        <span className="text-xs text-gray-500">
                          {formatDate(post.publishedAt)}
                        </span>
                      )}
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-sm font-medium text-brand-accent hover:text-brand-accent-700 transition-colors duration-300 ml-auto"
                      >
                        Read More &rarr;
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA — dark, photo-backed band */}
      <section
        aria-labelledby="blog-cta-heading"
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

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-4"
          >
            YOUR NEXT STEP
          </motion.p>

          <motion.h2
            id="blog-cta-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.05] mb-6"
          >
            Ready to Transform Your Life?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/80 text-lg font-light leading-relaxed mb-10"
          >
            Book a free discovery call with Dr. Suzanne Ravenall and find your path to lasting change.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href={`${CAL_URL}/suzanneravenall/discovery-call`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-10 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:shadow-[0_8px_30px_theme(colors.brand.accent/30%)]"
            >
              Book Discovery Call &rarr;
            </a>
            <Link
              href="/programs"
              className="inline-flex items-center justify-center px-10 py-4 border border-white/30 hover:border-white text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300"
            >
              Explore Programmes &rarr;
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}
