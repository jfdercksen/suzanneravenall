"use client"

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/PageHeader'
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
      {/* Header: shared PageHeader, the header rule. Suzanne stands on the left
          of this photo, so the text takes the right-hand column. The picture is
          decorative (the same placeholder on every post), so it carries no alt.
          TODO: Replace placeholder with actual Payload image once payload:3001 is
          added to next.config.mjs remotePatterns */}
      <PageHeader
        id="blog-post-heading"
        image="/images/suzanne-ravenall.jpg"
        mobileCrop="object-left"
        align="right"
        title={post.title}
        description={
          (post.author || post.publishedAt) && (
            <>
              {post.author && <span>{post.author}</span>}
              {post.author && post.publishedAt && <span aria-hidden="true" className="mx-3">&middot;</span>}
              {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
            </>
          )
        }
      />

      {/* Back link and tags: a slim black band under the header, which holds a
          headline and one line at most. Lined up with the header's text column. */}
      <div className="bg-brand-primary-900 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 sm:ml-auto sm:max-w-md lg:max-w-2xl">
            <Link
              href="/blog"
              className="inline-flex items-center text-sm text-white/80 hover:text-white transition-colors duration-300 group"
            >
              <span className="mr-2 group-hover:-translate-x-1 transition-transform duration-300">&larr;</span>
              Back to Blog
            </Link>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {post.tags.map((t) => (
                  <span
                    key={t.id}
                    className="text-xs uppercase tracking-[0.2em] font-medium text-white/80"
                  >
                    {t.tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Article body */}
      <section className="py-20 lg:py-32 bg-brand-cream">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6 }}
          >
            {/* SEO description teaser: shown until rich text renderer is wired up */}
            {post.seoDescription && (
              <p className="text-xl text-brand-ink leading-relaxed mb-8 font-light border-l-4 border-brand-accent pl-6">
                {post.seoDescription}
              </p>
            )}

            {/* TODO: install @payloadcms/richtext-lexical or @payloadcms/next/RichText
                to render the full Lexical rich text stored in post.content.
                The raw content object is intentionally not displayed: it is unstructured JSON. */}
            <div className="text-brand-ink leading-relaxed">
              <p className="text-brand-muted italic text-sm">
                Full article content will render here once the Payload Lexical rich text renderer is configured.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="py-20 lg:py-32 bg-brand-sand">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
                Continue Reading
              </p>
              <h2 className="text-4xl font-medium tracking-tight text-brand-primary">Related Posts</h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedPosts.map((related, index) => (
                <motion.article
                  key={related.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px' }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group bg-white rounded-2xl overflow-hidden border border-brand-border hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                >
                  <Link href={`/blog/${related.slug}`} className="block relative aspect-[16/9] overflow-hidden">
                    {/* TODO: Replace placeholder with actual Payload image once remotePatterns is updated */}
                    <Image
                      src="/images/suzanne-ravenall.jpg"
                      alt={related.featuredImage?.alt ?? related.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </Link>
                  <div className="p-6">
                    <Link href={`/blog/${related.slug}`}>
                      <h3 className="text-lg font-medium text-brand-ink group-hover:text-brand-accent transition-colors duration-300 mb-2 line-clamp-2">
                        {related.title}
                      </h3>
                    </Link>
                    {related.publishedAt && (
                      <p className="text-xs text-brand-muted">{formatDate(related.publishedAt)}</p>
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
