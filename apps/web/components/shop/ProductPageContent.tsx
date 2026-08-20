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

const FAQ_ITEMS = [
  {
    question: 'How does a session work?',
    answer:
      'Each session is a structured deep-dive using Neuro-Repatterning® techniques. You will meet with Dr. Ravenall via Zoom or in person, moving through a facilitated process that identifies and permanently resolves the root pattern driving your presenting challenge. Sessions are typically 90 minutes.',
  },
  {
    question: 'What results can I expect?',
    answer:
      'Most clients report a noticeable shift in their first session, a reduction in the emotional charge around a specific pattern or belief. Lasting transformation builds across the programme as multiple root causes are addressed. Results vary by individual, but permanent pattern release is the goal of every session.',
  },
  {
    question: 'Is this right for me?',
    answer:
      'Book a free discovery call to find out: link below. If you are tired of coping strategies that only manage symptoms, and ready to resolve the root cause, this work is likely a strong fit.',
  },
]

function getDeliveryBadge(handle: string, title: string = ''): { label: string; className: string } {
  const text = `${handle} ${title}`.toLowerCase()
  if (/live(-via-zoom)?/.test(text) || text.includes(' live'))
    return {
      label: 'Live',
      className: 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30',
    }
  if (/self-study|self-paced/.test(text))
    return {
      label: 'Self Paced',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    }
  if (/in-person/.test(text))
    return {
      label: 'In-Person',
      className: 'bg-amber-50 text-amber-700 border border-amber-200',
    }
  if (/recorded/.test(text))
    return {
      label: 'Recorded',
      className: 'bg-purple-50 text-purple-700 border border-purple-200',
    }
  return { label: 'Session', className: 'bg-gray-100 text-gray-600' }
}

interface ProductPageContentProps {
  product: MedusaProduct
}

export default function ProductPageContent({ product }: ProductPageContentProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id ?? ''
  )

  // thinkific_course_id is seeded as a number (e.g. 1284792) — check for any truthy non-zero value.
  const isThinkificCourse =
    product.metadata?.thinkific_course_id != null &&
    product.metadata.thinkific_course_id !== 0 &&
    product.metadata.thinkific_course_id !== ''

  const badge = isThinkificCourse
    ? { label: 'Self-Paced', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
    : getDeliveryBadge(product.handle, product.title)

  const includedItems = isThinkificCourse
    ? [
        'Self-paced online course',
        'Lifetime access via the Ravenall Institute',
        'Course materials and resources',
        'Study at your own pace, anywhere',
      ]
    : [
        'Live sessions via Zoom',
        'Session recordings',
        'Course materials',
        'Email support between sessions',
      ]

  const primaryCategory = product.categories[0]

  return (
    <div>
      {/* 1 — Hero (dark) */}
      <ProductHero product={product} />

      {/* 2 — Variant Selector / primary conversion zone (light) */}
      <section className="w-full bg-white py-20 lg:py-32">
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
                <p className="text-sm text-gray-700 leading-relaxed">
                  After purchase, you&apos;ll receive instant access to this course via the Ravenall
                  Institute. A welcome email with your login details will be sent to your registered
                  email address.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 3 — Transformation Promise (light) */}
      <section className="w-full bg-gray-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              The Shift
            </p>
            <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight text-brand-primary">
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
                  className="group relative bg-white rounded-card p-8 border border-gray-100 hover:border-brand-accent hover:-translate-y-1 hover:shadow-2xl transition-all duration-500"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-accent/10 text-brand-accent mb-6 group-hover:bg-brand-accent group-hover:text-white transition-all duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{card.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{card.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4 — Programme Details (light) */}
      <section className="w-full bg-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mb-12">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Programme Details
            </p>
            <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight text-brand-primary">
              Everything You Need to Know
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
            {/* Left — detail list */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>
              </div>

              {primaryCategory && (
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] font-medium text-gray-400 mb-1">
                    Category
                  </dt>
                  <dd className="text-gray-900 font-medium">{primaryCategory.name}</dd>
                </div>
              )}

              {product.metadata?.duration && (
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] font-medium text-gray-400 mb-1">
                    Duration
                  </dt>
                  <dd className="text-gray-900 font-medium">{String(product.metadata.duration)}</dd>
                </div>
              )}

              {product.metadata?.who_its_for && (
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] font-medium text-gray-400 mb-1">
                    Who It&apos;s For
                  </dt>
                  <dd className="text-gray-900 font-medium">{String(product.metadata.who_its_for)}</dd>
                </div>
              )}

              <div>
                <dt className="text-xs uppercase tracking-[0.2em] font-medium text-gray-400 mb-1">
                  Prerequisites
                </dt>
                <dd className="text-gray-900 font-medium">None required</dd>
              </div>
            </motion.div>

            {/* Right — what's included */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                What&apos;s Included
              </h3>
              <ul className="space-y-4">
                {includedItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-brand-accent/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-brand-accent" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5 — Testimonials (light) — hidden entirely until data/testimonials.ts
          holds entries verified and signed off by Suzanne */}
      {productTestimonials.length > 0 && (
      <section className="relative w-full bg-gray-50 py-20 lg:py-32 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Client Stories
            </p>
            <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight text-brand-primary">
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
                className="bg-white rounded-card p-8 border border-gray-100"
              >
                <p
                  className="text-6xl font-serif leading-none text-brand-accent mb-4"
                  aria-hidden="true"
                >
                  &ldquo;
                </p>
                <blockquote className="text-gray-600 leading-relaxed text-lg mb-6 italic">
                  {t.quote}
                </blockquote>
                <footer className="text-gray-700 text-sm font-medium">
                  {t.name}
                  {t.location && (
                    <>
                      ,{' '}
                      <span className="text-gray-500 font-normal">{t.location}</span>
                    </>
                  )}
                </footer>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* 6 — FAQ Accordion (light, gray-50 to alternate with the white details section) */}
      <section className="w-full bg-gray-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mb-12">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              FAQ
            </p>
            <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight text-brand-primary">
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
            <FAQAccordion items={FAQ_ITEMS} />
          </motion.div>
        </div>
      </section>

      {/* 7 — Final CTA (light) */}
      <section className="w-full bg-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Your next step
            </p>
            <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight text-brand-primary mb-4">
              Ready to Transform?
            </h2>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              Choose your programme below and take the first step toward permanent change.
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
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12 space-y-3"
          >
            <p className="text-gray-600 text-sm">
              Not sure which programme is right for you?{' '}
              <Link
                href="/contact"
                className="text-brand-accent hover:text-brand-primary underline underline-offset-4 transition-colors duration-200"
              >
                Book a free discovery call
              </Link>{' '}
              with Dr. Ravenall.
            </p>
            <p>
              <Link
                href="/shop"
                className="text-gray-500 hover:text-brand-primary text-sm transition-colors duration-200"
              >
                &larr; Back to all programmes
              </Link>
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
