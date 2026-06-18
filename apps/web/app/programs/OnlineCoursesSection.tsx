'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useCart } from '@/lib/cart'

export interface Course {
  id: string
  handle: string
  title: string
  description: string | null
  /** metadata.category from Medusa, e.g. "resonance-repatterning" | "bundle" */
  category: string
  prices: Array<{ currency_code: string; amount: number }>
}

// Filter tabs (client-side, no reload). "bundle" courses have no dedicated tab —
// they surface only under "All", which matches the requested tab set.
const TABS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'resonance-repatterning', label: 'Resonance Repatterning' },
  { key: 'akashic', label: 'Akashic' },
  { key: 'energy-clearing', label: 'Energy Clearing' },
  { key: 'trauma-transformation', label: 'Trauma & Transformation' },
  { key: 'personal-development', label: 'Personal Development' },
]

const CATEGORY_LABELS: Record<string, string> = {
  'resonance-repatterning': 'Resonance Repatterning',
  akashic: 'Akashic',
  'energy-clearing': 'Energy Clearing',
  'trauma-transformation': 'Trauma & Transformation',
  'personal-development': 'Personal Development',
  bundle: 'Bundle',
}

// Region-aware price: pick the price matching the visitor's cart currency,
// fall back to ZAR. Amounts are stored in minor units (cents) — divide by 100.
function formatCoursePrice(prices: Course['prices'], currency: string): string | null {
  if (!prices || prices.length === 0) return null
  const match =
    prices.find((p) => p.currency_code === currency) ??
    prices.find((p) => p.currency_code === 'zar')
  if (!match) return null
  const amount = match.amount / 100
  if (match.currency_code === 'usd') {
    return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  }
  return `R${amount.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, delay, ease: 'easeOut' as const },
})

export function OnlineCoursesSection({ courses }: { courses: Course[] }) {
  const [active, setActive] = useState('all')
  const { cart } = useCart()
  const currency = cart?.currency_code ?? 'zar'

  const filtered = active === 'all' ? courses : courses.filter((c) => c.category === active)

  return (
    <section
      aria-labelledby="online-courses-heading"
      className="w-full bg-white py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp(0)} className="max-w-3xl mb-12">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
            Self-Paced Learning
          </p>
          <h2
            id="online-courses-heading"
            className="text-4xl lg:text-6xl font-light text-brand-primary leading-tight mb-6"
          >
            Online Courses &amp; Self-Study Programmes
          </h2>
          <p className="text-lg text-gray-600 font-light leading-relaxed">
            Learn in your own time, at your own pace. These self-paced courses are delivered
            through the Ravenall Institute online learning platform — work through each
            programme whenever and wherever suits you, with ongoing access to the material.
          </p>
        </motion.div>

        {courses.length === 0 ? (
          <p className="text-gray-500 font-light">
            Our online course catalogue is being updated — please check back shortly.
          </p>
        ) : (
          <>
            {/* Category filter tabs */}
            <motion.div
              {...fadeUp(0.05)}
              className="flex flex-wrap gap-3 mb-12"
              role="tablist"
              aria-label="Course categories"
            >
              {TABS.map((tab) => {
                const isActive = active === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(tab.key)}
                    className={`rounded-button px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/30'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-brand-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </motion.div>

            {/* Course cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {filtered.map((course, idx) => {
                const price = formatCoursePrice(course.prices, currency)
                return (
                  <motion.article
                    key={course.id}
                    {...fadeUp(Math.min(idx, 6) * 0.05)}
                    className="group flex flex-col bg-gray-50 rounded-card p-8 border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <span className="inline-flex self-start items-center rounded-button bg-brand-accent/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-accent mb-5">
                      {CATEGORY_LABELS[course.category] ?? 'Course'}
                    </span>
                    <h3 className="text-xl font-semibold text-brand-primary mb-3 group-hover:text-brand-accent transition-colors duration-300">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 font-light leading-relaxed line-clamp-2 mb-6">
                      {course.description ??
                        'A self-paced online course delivered via the Ravenall Institute.'}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-4">
                      {price ? (
                        <span className="text-lg font-semibold text-brand-primary">{price}</span>
                      ) : (
                        <span className="text-sm text-gray-400">View pricing</span>
                      )}
                      <Link
                        href={`/shop/${course.handle}`}
                        className="inline-flex items-center justify-center rounded-button bg-brand-accent px-5 py-2.5 text-sm font-medium text-white transition-colors duration-300 hover:bg-brand-accent-700"
                      >
                        Enroll Now
                      </Link>
                    </div>
                  </motion.article>
                )
              })}
            </div>

            {filtered.length === 0 && (
              <p className="text-gray-500 font-light mt-8">No courses in this category yet.</p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
