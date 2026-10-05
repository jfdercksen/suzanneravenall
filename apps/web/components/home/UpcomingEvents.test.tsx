import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import UpcomingEvents from './UpcomingEvents'
import type { FeaturedCohort } from '@/lib/inventory/group-sessions'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  ),
}))

// Strip animation props and render each motion.<tag> as the plain element
vi.mock('framer-motion', () => {
  const strip = ({
    initial, animate, exit, transition, variants, whileInView, viewport, whileHover, whileTap,
    ...rest
  }: Record<string, unknown>) => rest
  const motion = new Proxy(
    {},
    {
      get: (_t, tag: string) =>
        ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) =>
          React.createElement(tag, strip(props), children),
    },
  )
  return { motion, AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</> }
})

const cohort: FeaturedCohort = {
  productTitle: 'Group Session: Being a Great Boundary Setter',
  productHandle: 'group-session-being-a-great-boundary-setter',
  variantTitle: 'Live (booked as series)',
  spotsRemaining: 12,
  capacity: 12,
  priceZar: 1500,
  duration: null,
}

describe('UpcomingEvents (site check C5)', () => {
  it('shows the group cohort price instead of "Complimentary"', () => {
    render(<UpcomingEvents cohort={cohort} />)
    expect(screen.getAllByText('Complimentary')).toHaveLength(1)
    expect(screen.getByText(/^R1\s?500$/)).toBeInTheDocument()
  })

  it('never labels the paid group card Complimentary, even without a cohort', () => {
    render(<UpcomingEvents cohort={null} />)
    expect(screen.getAllByText('Complimentary')).toHaveLength(1)
  })

  it('labels the pre-order book card as a pre-order, not "Available now"', () => {
    render(<UpcomingEvents cohort={cohort} />)
    expect(screen.queryByText('Available now')).not.toBeInTheDocument()
    expect(screen.getByText('Pre-order')).toBeInTheDocument()
    expect(screen.getByText('Pre-Order Now')).toBeInTheDocument()
  })

  it('does not claim the discovery call is "Available this week"', () => {
    render(<UpcomingEvents cohort={cohort} />)
    expect(screen.queryByText('Available this week')).not.toBeInTheDocument()
  })
})
