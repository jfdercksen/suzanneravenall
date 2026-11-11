"use client"

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/PageHeader'
import { mediaSrc } from '@/lib/blog/media'
import type { BlogPost } from '@/types/payload'

interface BlogListingContentProps {
  posts: BlogPost[]
  /** Tag to open on (/blog?tag=newsletter); ignored when no post carries it. */
  initialTag?: string
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
      {/* Header: shared PageHeader, the header rule. The old photo
          (suzanne-casual.jpg) has Suzanne in the middle of the frame, so any
          text band crossed her face; this one has her on the left, so the text
          takes the right-hand column (as on the blog posts). */}
      <PageHeader
        id="blog-coming-soon-heading"
        eyebrow="Insights & Inspiration"
        image="/images/suzanne-ravenall.jpg"
        mobileCrop="object-left"
        align="right"
        title="Our Blog is Launching Soon"
        description={
          <>
            Insights on transformation, pattern mastery, and the science of lasting change.
            Subscribe to be the first to know when we go live.
          </>
        }
      >
        {/* The copy promises a subscription, so this goes to the real newsletter
            sign-up (ResourcesNewsletterCTA, section id="newsletter" on /resources). */}
        <Link
          href="/resources#newsletter"
          className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 bg-white hover:bg-brand-sand text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
        >
          Stay Updated
        </Link>
      </PageHeader>

      {/* Final CTA */}
      <section
        aria-labelledby="coming-soon-cta-heading"
        className="relative w-full bg-brand-cream py-20 lg:py-32 overflow-hidden"
      >
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
            className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-[1.08] mb-6"
          >
            Ready to Transform Your Life?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-brand-muted text-lg font-light leading-relaxed mb-10"
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
              className="inline-flex items-center justify-center px-10 py-4 bg-brand-primary hover:bg-brand-primary-700 text-white font-medium text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:shadow-[0_8px_30px_theme(colors.brand.primary/30%)]"
            >
              Book Discovery Call &rarr;
            </a>
            <Link
              href="/programs"
              className="inline-flex items-center justify-center px-10 py-4 border border-brand-primary/30 hover:border-brand-primary text-brand-primary font-medium text-sm uppercase tracking-widest rounded-button transition-all duration-300"
            >
              Explore Programmes &rarr;
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}

/** Cards per page: 158 imported posts would otherwise render at once. */
export const BLOG_PAGE_SIZE = 12

export default function BlogListingContent({ posts, initialTag }: BlogListingContentProps) {
  const [activeTag, setActiveTag] = useState<string>(() =>
    initialTag && posts.some((p) => p.tags?.some((t) => t.tag === initialTag)) ? initialTag : 'All',
  )
  const [page, setPage] = useState(1)
  // A client-side visit to /blog?tag=... re-renders without remounting.
  useEffect(() => {
    if (initialTag && posts.some((p) => p.tags?.some((t) => t.tag === initialTag))) {
      setActiveTag(initialTag)
      setPage(1)
    }
  }, [initialTag, posts])

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
  const pageCount = Math.max(1, Math.ceil(filtered.length / BLOG_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * BLOG_PAGE_SIZE, currentPage * BLOG_PAGE_SIZE)
  const goTo = (next: number) => {
    setPage(next)
    document.getElementById('blog-posts')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }

  if (posts.length === 0) {
    return <ComingSoonSection />
  }

  return (
    <>
      {/* Hero */}
      <motion.section
        aria-labelledby="blog-hero-heading"
        className="relative py-20 lg:py-32 bg-brand-sand overflow-hidden"
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
            className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-brand-primary"
          >
            The Blog
          </h1>
          <p className="mt-6 text-lg text-brand-muted max-w-2xl mx-auto">
            Science-backed perspectives on transformation, pattern mastery, and the art of
            becoming who you were always meant to be.
          </p>
        </div>
      </motion.section>

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <section className="bg-brand-primary-900 border-b border-white/10 sticky top-16 lg:top-20 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-2 py-4">
              {['All', ...allTags].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setActiveTag(tag)
                    setPage(1)
                  }}
                  aria-pressed={activeTag === tag}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeTag === tag
                      ? 'bg-white text-brand-primary'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
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
      <section id="blog-posts" className="py-20 lg:py-32 bg-brand-cream scroll-mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <motion.p
              key={activeTag}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-brand-muted text-lg py-16"
            >
              No posts found for &ldquo;{activeTag}&rdquo;.
            </motion.p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {visible.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px' }}
                  transition={{ duration: 0.6, delay: (index % 3) * 0.1 }}
                  className="group bg-white rounded-card overflow-hidden border border-brand-border hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                >
                  {/* Featured image */}
                  <Link href={`/blog/${post.slug}`} className="block relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={mediaSrc(post.featuredImage?.url) ?? '/images/suzanne-ravenall.jpg'}
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
                      <h2 className="text-xl font-medium text-brand-ink group-hover:text-brand-accent transition-colors duration-300 mb-3 line-clamp-2">
                        {post.title}
                      </h2>
                    </Link>

                    {getExcerpt(post) && (
                      <p className="text-brand-muted text-sm leading-relaxed mb-4 line-clamp-3">
                        {getExcerpt(post)}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      {post.publishedAt && (
                        <span className="text-xs text-brand-muted">
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

          {pageCount > 1 && (
            <nav aria-label="Blog pages" className="mt-16 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => goTo(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-5 py-2.5 rounded-button border border-brand-primary-300 text-sm font-medium text-brand-primary transition-colors duration-300 hover:bg-brand-sand disabled:opacity-40 disabled:hover:bg-transparent"
              >
                &larr; Newer
              </button>
              <span className="text-sm text-brand-muted" aria-live="polite">
                Page {currentPage} of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => goTo(currentPage + 1)}
                disabled={currentPage === pageCount}
                className="px-5 py-2.5 rounded-button border border-brand-primary-300 text-sm font-medium text-brand-primary transition-colors duration-300 hover:bg-brand-sand disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Older &rarr;
              </button>
            </nav>
          )}
        </div>
      </section>

      {/* Final CTA: dark, photo-backed band */}
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
            className="text-4xl lg:text-6xl font-medium tracking-tight text-white leading-[1.05] mb-6"
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
              className="inline-flex items-center justify-center px-10 py-4 bg-white hover:bg-brand-sand text-brand-primary font-medium text-sm uppercase tracking-widest rounded-button transition-all duration-300"
            >
              Book Discovery Call &rarr;
            </a>
            <Link
              href="/programs"
              className="inline-flex items-center justify-center px-10 py-4 border border-white/50 hover:border-white text-white font-medium text-sm uppercase tracking-widest rounded-button transition-all duration-300"
            >
              Explore Programmes &rarr;
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}
