"use client"

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import type { BlogPost } from '@/types/payload'

interface BlogPostContentProps {
  post: BlogPost
  relatedPosts: BlogPost[]
}

function formatDate(dateString?: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function BlogPostContent({ post, relatedPosts }: BlogPostContentProps) {
  return (
    <>
      {/* Hero with featured image overlay */}
      <section className="relative min-h-[60vh] flex items-end bg-brand-primary-900">
        {/* TODO: Replace placeholder with actual Payload image once payload:3001 is added
            to next.config.mjs remotePatterns */}
        <div className="absolute inset-0">
          <Image
            src="/images/blog-placeholder.jpg"
            alt={post.featuredImage?.alt ?? post.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-brand-primary-900/75" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/blog"
              className="inline-flex items-center text-sm text-gray-300 hover:text-white transition-colors duration-300 mb-8 group"
            >
              <span className="mr-2 group-hover:-translate-x-1 transition-transform duration-300">&larr;</span>
              Back to Blog
            </Link>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
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

            <h1 className="text-4xl lg:text-6xl font-light text-white max-w-4xl leading-tight">
              {post.title}
            </h1>

            {(post.author || post.publishedAt) && (
              <div className="flex items-center gap-4 mt-6 text-gray-300 text-sm">
                {post.author && <span>{post.author}</span>}
                {post.author && post.publishedAt && <span>&mdash;</span>}
                {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Article body */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            {/* SEO description teaser — shown until rich text renderer is wired up */}
            {post.seoDescription && (
              <p className="text-xl text-gray-600 leading-relaxed mb-8 font-light border-l-4 border-brand-accent pl-6">
                {post.seoDescription}
              </p>
            )}

            {/* TODO: install @payloadcms/richtext-lexical or @payloadcms/next/RichText
                to render the full Lexical rich text stored in post.content.
                The raw content object is intentionally not displayed — it is unstructured JSON. */}
            <div className="text-gray-700 leading-relaxed">
              <p className="text-gray-400 italic text-sm">
                Full article content will render here once the Payload Lexical rich text renderer is configured.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="py-20 lg:py-32 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
                Continue Reading
              </p>
              <h2 className="text-4xl font-light text-gray-900">Related Posts</h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedPosts.map((related, index) => (
                <motion.article
                  key={related.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                >
                  <Link href={`/blog/${related.slug}`} className="block relative aspect-[16/9] overflow-hidden">
                    {/* TODO: Replace placeholder with actual Payload image once remotePatterns is updated */}
                    <Image
                      src="/images/blog-placeholder.jpg"
                      alt={related.featuredImage?.alt ?? related.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </Link>
                  <div className="p-6">
                    <Link href={`/blog/${related.slug}`}>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand-accent transition-colors duration-300 mb-2 line-clamp-2">
                        {related.title}
                      </h3>
                    </Link>
                    {related.publishedAt && (
                      <p className="text-xs text-gray-400">{formatDate(related.publishedAt)}</p>
                    )}
                    <Link
                      href={`/blog/${related.slug}`}
                      className="inline-block mt-4 text-sm font-medium text-brand-accent hover:text-brand-accent-700 transition-colors duration-300"
                    >
                      Read More &rarr;
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
