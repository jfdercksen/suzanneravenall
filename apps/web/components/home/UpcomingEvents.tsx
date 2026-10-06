'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { FeaturedCohort } from '@/lib/inventory/group-sessions'

// TODO: Suzanne to provide real upcoming event dates for the FREE/BOOK cards
// below — replace with dynamic data from Payload CMS when the real programme
// schedule is confirmed. The GROUP card is real (see cohort prop).

// Sourcing report 6 Oct (section 9, decision 6): no live or group dates have
// been published since 2022 (https://suzanneravenall.com/datesrepo/meditation/),
// so no "Next intake", "spots left" or "new dates coming soon" claims.

type BadgeVariant = 'free' | 'group' | 'book'

interface Opportunity {
  type: 'FREE' | 'GROUP' | 'BOOK'
  variant: BadgeVariant
  title: string
  description: string
  cta: string
  href: string
  /** Omitted rather than invented when there is no real status to show. */
  badge?: string
  price?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  free: 'bg-brand-primary-900 text-white border border-brand-primary-900',
  group: 'bg-brand-sand text-brand-ink border border-brand-border',
  book: 'bg-brand-sand text-brand-ink border border-brand-border',
}

interface UpcomingEventsProps {
  /** Same real, inventory-backed cohort used on UpcomingPrograms — null when
   *  no group session currently has tracked inventory. Never fabricate a
   *  fallback number here. */
  cohort: FeaturedCohort | null
}

/** Same ZAR format as the cohort card on UpcomingPrograms, so the page shows
 *  one price style. Undefined when the product has no ZAR price. */
function formatCohortPrice(cohort: FeaturedCohort): string | undefined {
  if (cohort.priceZar === null) return undefined
  return `R${cohort.priceZar.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
}

function buildGroupOpportunity(cohort: FeaturedCohort | null): Opportunity {
  if (cohort && cohort.spotsRemaining > 0) {
    return {
      type: 'GROUP',
      variant: 'group',
      title: cohort.productTitle,
      description:
        'Join Suzanne and a small group for a powerful Rapid Repatterning® session.',
      cta: 'View Details',
      href: `/shop/${cohort.productHandle}`,
      price: formatCohortPrice(cohort),
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
      price: formatCohortPrice(cohort),
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
      href: '/contact#book',
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
      // Matches the Pre-Order CTA and the /book page
      badge: 'Pre-order',
    },
  ]

  return (
    <section aria-labelledby="upcoming-events-heading" className="bg-brand-sand py-14 lg:py-24">
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
          {/* Copy differs from UpcomingPrograms on purpose — the page had the
              identical headline twice, which read as template filler */}
          <h2
            id="upcoming-events-heading"
            className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary"
          >
            Three ways to begin
          </h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map(({ type, variant, title, description, cta, href, badge, price }, i) => (
            <motion.div
              key={title}
              className="group bg-white border border-brand-border rounded-card overflow-hidden hover:border-brand-accent/30 hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1 flex flex-col"
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
                  {badge && (
                    <span className="text-brand-muted text-xs text-right max-w-[120px]">{badge}</span>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-brand-primary mb-3">{title}</h3>
                <p className="text-brand-ink text-sm leading-relaxed flex-1">{description}</p>

                <div className="mt-6 flex items-center justify-between">
                  {/* Only the free card is complimentary: a paid product with no
                      ZAR price shows no price rather than a wrong one */}
                  {price ? (
                    <span className="text-brand-primary font-semibold">{price}</span>
                  ) : type === 'FREE' ? (
                    <span className="text-brand-ink text-sm font-medium">Complimentary</span>
                  ) : (
                    <span />
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
