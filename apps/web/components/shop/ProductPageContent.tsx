'use client'

import { useState } from 'react'
import { ProductHero } from './ProductHero'
import { VariantSelector } from './VariantSelector'
import { FAQAccordion } from './FAQAccordion'
import { motion } from 'framer-motion'
import { Sparkles, Heart, Zap, Check } from 'lucide-react'
import Link from 'next/link'
import type { MedusaProduct } from '@/types/medusa'

const fadeUp = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
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

const TESTIMONIALS = [
  {
    quote:
      'I spent years trying to change my patterns through therapy and self-help books. One programme with Dr. Ravenall did more than all of that combined. The shifts were permanent.',
    name: 'Sarah M.',
    location: 'Cape Town',
  },
  {
    quote:
      'The science behind the process gave me confidence it would work — and it did. I went from chronic anxiety to a calm I never thought was possible for me.',
    name: 'James K.',
    location: 'Johannesburg',
  },
]

const FAQ_ITEMS = [
  {
    question: 'How does a session work?',
    answer:
      'Each session is a structured deep-dive using Neuro-Repatterning® techniques. You will meet with Dr. Ravenall via Zoom or in person, moving through a facilitated process that identifies and permanently resolves the root pattern driving your presenting challenge. Sessions are typically 90 minutes.',
  },
  {
    question: 'What results can I expect?',
    answer:
      'Most clients report a noticeable shift in their first session — a reduction in the emotional charge around a specific pattern or belief. Lasting transformation builds across the programme as multiple root causes are addressed. Results vary by individual, but permanent pattern release is the goal of every session.',
  },
  {
    question: 'Is this right for me?',
    answer:
      'Book a free discovery call to find out — link below. If you are tired of coping strategies that only manage symptoms, and ready to resolve the root cause, this work is likely a strong fit.',
  },
]

function getDeliveryBadge(handle: string, title: string = ''): { label: string; className: string } {
  const text = `${handle} ${title}`.toLowerCase()
  if (/live(-via-zoom)?/.test(text) || text.includes(' live'))
    return {
      label: 'Live',
      className: 'bg-brand-accent/20 text-brand-accent border border-brand-accent',
    }
  if (/self-study|self-paced/.test(text))
    return {
      label: 'Self Paced',
      className: 'bg-emerald-900/40 text-emerald-400 border border-emerald-800',
    }
  if (/in-person/.test(text))
    return {
      label: 'In-Person',
      className: 'bg-amber-900/40 text-amber-400 border border-amber-700',
    }
  if (/recorded/.test(text))
    return {
      label: 'Recorded',
      className: 'bg-purple-900/40 text-purple-400 border border-purple-800',
    }
  return { label: 'Session', className: 'bg-gray-800 text-gray-300' }
}

interface ProductPageContentProps {
  product: MedusaProduct
}

export default function ProductPageContent({ product }: ProductPageContentProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id ?? ''
  )

  const badge = getDeliveryBadge(product.handle, product.title)
  const primaryCategory = product.categories[0]

  return (
    <div>
      {/* 1 — Hero (dark) */}
      <ProductHero product={product} />

      {/* 2 — Variant Selector / primary conversion zone (light) */}
      <section className="w-full bg-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <VariantSelector
              variants={product.variants}
              selectedVariantId={selectedVariantId}
              onSelect={setSelectedVariantId}
            />
          </motion.div>
        </div>
      </section>

      {/* 3 — Transformation Promise (dark) */}
      <section className="w-full bg-gray-950 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              The Shift
            </p>
            <h2 className="text-4xl lg:text-6xl font-light text-white">
              What You&apos;ll Experience
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {OUTCOME_CARDS.map((card, i) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="group relative bg-gray-900 rounded-card p-8 border border-white/5 hover:border-brand-accent hover:-translate-y-1 hover:shadow-2xl transition-all duration-500"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-accent/10 text-brand-accent mb-6 group-hover:bg-brand-accent group-hover:text-white transition-all duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{card.title}</h3>
                  <p className="text-white/60 leading-relaxed">{card.description}</p>
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
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900">
              Everything You Need to Know
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
            {/* Left — detail list */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
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
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                What&apos;s Included
              </h3>
              {/* TODO: Replace with actual included items from Medusa product metadata */}
              <ul className="space-y-4">
                {[
                  'Live sessions via Zoom',
                  'Session recordings',
                  'Course materials',
                  'Email support between sessions',
                ].map((item) => (
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

      {/* 5 — Testimonials (dark) */}
      <section className="relative w-full bg-brand-primary py-20 lg:py-32 overflow-hidden">
        {/* Ambient glow */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bg-brand-accent/10 blur-[140px] rounded-full w-96 h-96 top-1/4 left-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Client Stories
            </p>
            <h2 className="text-4xl lg:text-5xl font-light text-white">
              Real Results, Real People
            </h2>
            {/* TODO: Replace with real testimonials — source from Suzanne */}
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-brand-primary-700 rounded-card p-8 border border-white/10"
              >
                <p
                  className="text-6xl font-serif leading-none text-brand-accent mb-4"
                  aria-hidden="true"
                >
                  &ldquo;
                </p>
                <blockquote className="text-white/80 leading-relaxed text-lg mb-6 italic">
                  {t.quote}
                </blockquote>
                <footer className="text-white/50 text-sm font-medium">
                  {t.name},{' '}
                  <span className="text-white/40 font-normal">{t.location}</span>
                </footer>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — FAQ Accordion (light) */}
      <section className="w-full bg-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mb-12">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              FAQ
            </p>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl"
          >
            <FAQAccordion items={FAQ_ITEMS} />
          </motion.div>
        </div>
      </section>

      {/* 7 — Final CTA (dark) */}
      <section className="w-full bg-brand-primary py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Your next step
            </p>
            <h2 className="text-4xl lg:text-5xl font-light text-white mb-4">
              Ready to Transform?
            </h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              Choose your programme below and take the first step toward permanent change.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <VariantSelector
              variants={product.variants}
              selectedVariantId={selectedVariantId}
              onSelect={setSelectedVariantId}
              dark
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12 space-y-3"
          >
            <p className="text-white/50 text-sm">
              Not sure which programme is right for you?{' '}
              <Link
                href="/contact"
                className="text-brand-accent hover:text-white underline underline-offset-4 transition-colors duration-200"
              >
                Book a free discovery call
              </Link>{' '}
              with Dr. Ravenall.
            </p>
            <p>
              <Link
                href="/shop"
                className="text-white/30 hover:text-white/60 text-sm transition-colors duration-200"
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
