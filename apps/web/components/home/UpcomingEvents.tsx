'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { FeaturedCohort } from '@/lib/inventory/group-sessions'

// TODO: Suzanne to provide real upcoming event dates for the FREE/BOOK cards
// below — replace with dynamic data from Payload CMS when the real programme
// schedule is confirmed. The GROUP card is real (see cohort prop).

type BadgeVariant = 'free' | 'group' | 'book'

interface Opportunity {
  type: 'FREE' | 'GROUP' | 'BOOK'
  variant: BadgeVariant
  title: string
  description: string
  cta: string
  href: string
  badge: string
  price?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  free: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  group: 'bg-brand-accent/15 text-brand-accent border border-brand-accent/30',
  book: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
}

interface UpcomingEventsProps {
  /** Same real, inventory-backed cohort used on UpcomingPrograms — null when
   *  no group session currently has tracked inventory. Never fabricate a
   *  fallback number here. */
  cohort: FeaturedCohort | null
}

function buildGroupOpportunity(cohort: FeaturedCohort | null): Opportunity {
  if (cohort && cohort.spotsRemaining > 0) {
    return {
      type: 'GROUP',
      variant: 'group',
      title: cohort.productTitle,
      description:
        'Join Suzanne and a small group for a powerful Rapid Repatterning® session.',
      cta: 'Reserve Your Spot',
      href: `/shop/${cohort.productHandle}`,
      badge: `${cohort.spotsRemaining} spot${cohort.spotsRemaining === 1 ? '' : 's'} left`,
    }
  }

  if (cohort) {
    return {
      type: 'GROUP',
      variant: 'group',
      title: cohort.productTitle,
      description:
        'Join Suzanne and a small group for a powerful Rapid Repatterning® session.',
      cta: 'Join Waitlist',
      href: `/shop/${cohort.productHandle}`,
      badge: 'Fully booked',
    }
  }

  return {
    type: 'GROUP',
    variant: 'group',
    title: 'Group Transformation Session',
    description:
      'Join Suzanne and a small group for a powerful Rapid Repatterning® session.',
    cta: 'Register Interest',
    href: '/events',
    badge: 'Next intake opening soon',
  }
}

export default function UpcomingEvents({ cohort }: UpcomingEventsProps) {
  const opportunities: Opportunity[] = [
    {
      type: 'FREE',
      variant: 'free',
      title: 'Discovery Call',
      description:
        '30-minute complimentary call to map your patterns and find the right programme for you.',
      cta: 'Book Now',
      href: '/contact',
      badge: 'Available this week',
    },
    buildGroupOpportunity(cohort),
    {
      type: 'BOOK',
      variant: 'book',
      title: 'Breakthrough Trilogy',
      description:
        "Start your transformation journey with Suzanne's complete guide to decoding your patterns.",
      price: 'R165',
      cta: 'Pre-Order Now',
      href: '/shop/the-latest-book-by-suzanne',
      badge: 'Available now',
    },
  ]

  return (
    <section aria-labelledby="upcoming-events-heading" className="bg-gray-50 py-14 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          className="text-center mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-brand-accent text-xs font-medium uppercase tracking-[0.3em] mb-3">
            Upcoming Opportunities
          </p>
          <h2
            id="upcoming-events-heading"
            className="text-4xl lg:text-6xl font-light text-brand-primary"
          >
            Your next step starts here
          </h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map(({ type, variant, title, description, cta, href, badge, price }, i) => (
            <motion.div
              key={title}
              className="group bg-white border border-gray-200 rounded-card overflow-hidden hover:border-brand-accent/30 hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1 flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
            >
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${variantStyles[variant]}`}
                  >
                    {type}
                  </span>
                  <span className="text-gray-500 text-xs text-right max-w-[120px]">{badge}</span>
                </div>

                <h3 className="text-xl font-semibold text-brand-primary mb-3">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed flex-1">{description}</p>

                <div className="mt-6 flex items-center justify-between">
                  {price ? (
                    <span className="text-brand-primary font-semibold">{price}</span>
                  ) : (
                    <span className="text-emerald-600 text-sm font-medium">Complimentary</span>
                  )}
                  <Link
                    href={href}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold text-sm rounded-button transition-colors duration-150"
                  >
                    {cta}
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
