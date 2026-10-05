'use client'

import { useState } from 'react'
import { ProductHero } from './ProductHero'
import { VariantSelector } from './VariantSelector'
import { FAQAccordion } from './FAQAccordion'
import { motion } from 'framer-motion'
import { Sparkles, Heart, Zap, Check } from 'lucide-react'
import Link from 'next/link'
import type { MedusaProduct } from '@/types/medusa'
import { productTestimonials } from '@/data/testimonials'
import { contactHref } from '@/app/contact/enquiry'
import {
  defaultVariantId,
  descriptionParagraphs,
  detailsEyebrow,
  getDeliveryBadge,
  getProductKind,
  hasThinkificCourse,
  metadataFaq,
  metadataList,
  paymentPlanEnquiry,
  productNoun,
  variantChooserLabel,
  type FaqItem,
} from './productKind'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
  transition: { duration: 0.6 },
}

const OUTCOME_CARDS = [
  {
    icon: Sparkles,
    title: 'Deep Pattern Release',
    description:
      'Move beyond surface-level change to heal the root patterns keeping you stuck.',
  },
  {
    icon: Heart,
    title: 'Lasting Transformation',
    description:
      'Build new neural pathways that support the life you truly want to create.',
  },
  {
    icon: Zap,
    title: 'Renewed Clarity',
    description:
      'Step into each day with purpose, energy, and unshakeable direction.',
  },
]

// Testimonial data lives in data/testimonials.ts — the single source of truth.
// Entries require Dr. Suzanne Ravenall's verified sign-off; while the list is
// empty the testimonials section below renders nothing.

// Site check C1: every product used to get the same session FAQ ("Sessions
// are typically 90 minutes, via Zoom or in person"), wrong for the book,
// self-study courses and support packages. A product's own FAQ comes from
// metadata.faq ({ question, answer }[]); without one, only this general
// question is shown, and only on coaching products.
const DISCOVERY_FAQ: FaqItem = {
  question: 'Is this right for me?',
  answer:
    'Book a free discovery call to find out: link below. If you are tired of coping strategies that only manage symptoms, and ready to resolve the root cause, this work is likely a strong fit.',
}

interface ProductPageContentProps {
  product: MedusaProduct
}

export default function ProductPageContent({ product }: ProductPageContentProps) {
  // A "Live Retaker" seat is never preselected (site check C1).
  const [selectedVariantId, setSelectedVariantId] = useState<string>(() =>
    defaultVariantId(product.variants)
  )

  // thinkific_course_id is seeded as a number (e.g. 1284792). It means the
  // order enrols the buyer on the Ravenall Institute; it does not mean the
  // course is self-paced, so the badge comes from the variants instead.
  const isThinkificCourse = hasThinkificCourse(product)

  // What is being sold (book, session, programme...), read from the product's
  // category, variants and metadata (productKind.ts). Generic blocks that do
  // not fit are hidden rather than shown with the wrong wording.
  const kind = getProductKind(product)
  const badge = getDeliveryBadge(product)
  const noun = productNoun(kind)
  const isCoaching = kind === 'session' || kind === 'group' || kind === 'programme'

  // Product-specific content Suzanne supplies in Medusa metadata. Each block
  // is hidden until it has content.
  const includedItems = metadataList(product.metadata?.included)
  const prerequisites =
    typeof product.metadata?.prerequisites === 'string' ? product.metadata.prerequisites.trim() : ''
  const productFaq = metadataFaq(product.metadata?.faq)
  const faqItems = productFaq.length > 0 ? productFaq : isCoaching ? [DISCOVERY_FAQ] : []
  const aboutParagraphs = descriptionParagraphs(product.description)

  const paymentPlanHref = contactHref(paymentPlanEnquiry(kind), `Payment plan: ${product.title}`)

  const primaryCategory = product.categories[0]

  return (
    <div>
      {/* 1: Hero (dark) */}
      <ProductHero product={product} />

      {/* 2: Variant Selector / primary conversion zone (cream) */}
      <section className="w-full bg-brand-cream py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <VariantSelector
              variants={product.variants}
              selectedVariantId={selectedVariantId}
              onSelect={setSelectedVariantId}
              productHandle={product.handle}
              chooseLabel={variantChooserLabel(kind)}
              paymentPlanHref={paymentPlanHref}
            />

            {isThinkificCourse && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-8 flex gap-3 rounded-card bg-brand-accent/5 border border-brand-accent/20 p-5"
              >
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-brand-accent/15 flex items-center justify-center">
                  <Check className="w-3 h-3 text-brand-accent" />
                </span>
                <p className="text-sm text-brand-ink leading-relaxed">
                  After purchase, you&apos;ll receive instant access to this course via the Ravenall
                  Institute. A welcome email with your login details will be sent to your registered
                  email address.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 3: Transformation Promise (sand): coaching products only, not the
          book, downloads or support add-ons */}
      {isCoaching && (
      <section className="w-full bg-brand-sand py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              The Shift
            </p>
            <h2 className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary">
              What You&apos;ll Experience
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {OUTCOME_CARDS.map((card, i) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px' }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="group relative bg-brand-cream rounded-card p-8 border border-brand-border hover:border-brand-primary-300 hover:-translate-y-1 hover:shadow-2xl transition-all duration-500"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-accent/10 text-brand-accent mb-6 group-hover:bg-brand-accent group-hover:text-white transition-all duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-medium text-brand-ink mb-3">{card.title}</h3>
                  <p className="text-brand-muted leading-relaxed">{card.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
      )}

      {/* 4: Details (cream) */}
      {/* Sand when section 3 is hidden, so two cream sections never meet. */}
      <section className={`w-full ${isCoaching ? 'bg-brand-cream' : 'bg-brand-sand'} py-20 lg:py-32 overflow-hidden`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mb-12">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              {detailsEyebrow(kind)}
            </p>
            <h2 className="text-4xl lg:text-5xl font-medium tracking-tight text-brand-primary">
              Everything You Need to Know
            </h2>
          </motion.div>

          {/* The full store description (the hero shows only its first sentence). */}
          {aboutParagraphs.length > 0 && (
            <motion.div {...fadeUp} className="max-w-3xl mb-12 space-y-4">
              {aboutParagraphs.map((paragraph, i) => (
                <p key={i} className="text-brand-ink leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </motion.div>
          )}

          {/* Both columns rise in on y: the old x: 30 slide-in pushed the page
              to 389px wide on a 375px phone (site check V2). */}
          <div className={`grid grid-cols-1 gap-12 ${includedItems.length > 0 ? 'sm:grid-cols-2' : ''}`}>
            {/* Left: detail list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {badge && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
              )}

              {primaryCategory && (
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] font-medium text-brand-muted mb-1">
                    Category
                  </dt>
                  <dd className="text-brand-ink font-medium">{primaryCategory.name}</dd>
                </div>
              )}

              {product.metadata?.duration && (
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] font-medium text-brand-muted mb-1">
                    Duration
                  </dt>
                  <dd className="text-brand-ink font-medium">{String(product.metadata.duration)}</dd>
                </div>
              )}

              {product.metadata?.who_its_for && (
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] font-medium text-brand-muted mb-1">
                    Who It&apos;s For
                  </dt>
                  <dd className="text-brand-ink font-medium">{String(product.metadata.who_its_for)}</dd>
                </div>
              )}

              {prerequisites && (
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] font-medium text-brand-muted mb-1">
                    Prerequisites
                  </dt>
                  <dd className="text-brand-ink font-medium">{prerequisites}</dd>
                </div>
              )}
            </motion.div>

            {/* Right: what's included, from metadata.included */}
            {includedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-xl font-medium text-brand-ink mb-6">
                What&apos;s Included
              </h3>
              <ul className="space-y-4">
                {includedItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-brand-accent/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-brand-accent" />
                    </div>
                    <span className="text-brand-ink">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* 5: Testimonials (sand): hidden entirely until data/testimonials.ts
          holds entries verified and signed off by Suzanne */}
      {productTestimonials.length > 0 && (
      <section className="relative w-full bg-brand-sand py-20 lg:py-32 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Client Stories
            </p>
            <h2 className="text-4xl lg:text-5xl font-medium tracking-tight text-brand-primary">
              Real Results, Real People
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {productTestimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-brand-cream rounded-card p-8 border border-brand-border"
              >
                <p
                  className="text-6xl font-serif leading-none text-brand-accent mb-4"
                  aria-hidden="true"
                >
                  &ldquo;
                </p>
                <blockquote className="text-brand-muted leading-relaxed text-lg mb-6 italic">
                  {t.quote}
                </blockquote>
                <footer className="text-brand-ink text-sm font-medium">
                  {t.name}
                  {t.location && (
                    <>
                      ,{' '}
                      <span className="text-brand-muted font-normal">{t.location}</span>
                    </>
                  )}
                </footer>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* 6: FAQ Accordion (sand, to alternate with the cream details section) */}
      {faqItems.length > 0 && (
      <section className="w-full bg-brand-sand py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mb-12">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              FAQ
            </p>
            <h2 className="text-4xl lg:text-5xl font-medium tracking-tight text-brand-primary">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl"
          >
            <FAQAccordion items={faqItems} />
          </motion.div>
        </div>
      </section>
      )}

      {/* 7: Final CTA (cream) */}
      <section className="w-full bg-brand-cream py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Your next step
            </p>
            <h2 className="text-4xl lg:text-5xl font-medium tracking-tight text-brand-primary mb-4">
              Ready to Transform?
            </h2>
            <p className="text-brand-muted text-lg max-w-xl mx-auto">
              Choose your {noun} below and take the first step toward permanent change.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <VariantSelector
              variants={product.variants}
              selectedVariantId={selectedVariantId}
              onSelect={setSelectedVariantId}
              productHandle={product.handle}
              chooseLabel={variantChooserLabel(kind)}
              paymentPlanHref={paymentPlanHref}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12 space-y-3"
          >
            <p className="text-brand-muted text-sm">
              Not sure which {noun} is right for you?{' '}
              <Link
                href="/contact#book"
                className="text-brand-accent hover:text-brand-primary underline underline-offset-4 transition-colors duration-200"
              >
                Book a free discovery call
              </Link>{' '}
              with Dr. Ravenall.
            </p>
            <p>
              <Link
                href="/shop"
                className="text-brand-muted hover:text-brand-primary text-sm transition-colors duration-200"
              >
                &larr; Back to the shop
              </Link>
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
