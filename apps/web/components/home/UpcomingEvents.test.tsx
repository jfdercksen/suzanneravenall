import React from 'react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import UpcomingEvents from './UpcomingEvents'
import type { FeaturedCohort } from '@/lib/inventory/group-sessions'

// The visitor's currency (D021); tests switch it with cartState.currency.
const cartState = vi.hoisted(() => ({ currency: 'zar' as 'zar' | 'usd' | null }))
vi.mock('@/lib/cart', () => ({ useCart: () => ({ cart: null, currency: cartState.currency }) }))

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
  prices: [
    { currency_code: 'zar', amount: 150000 },
    { currency_code: 'usd', amount: 9000 },
  ],
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

  it('shows no "spots left" or "Next intake" claims (sourcing report 6 Oct, decision 6)', () => {
    const { unmount } = render(<UpcomingEvents cohort={cohort} />)
    expect(screen.queryByText(/spots? left/i)).not.toBeInTheDocument()
    unmount()
    render(<UpcomingEvents cohort={null} />)
    expect(screen.queryByText(/Next intake/i)).not.toBeInTheDocument()
  })

  it('does not claim the discovery call is "Available this week"', () => {
    render(<UpcomingEvents cohort={cohort} />)
    expect(screen.queryByText('Available this week')).not.toBeInTheDocument()
  })
})

describe('UpcomingEvents prices follow the visitor currency (KI094)', () => {
  const book = [
    { currency_code: 'zar', amount: 16500 },
    { currency_code: 'usd', amount: 1750 },
  ]
  afterEach(() => {
    cartState.currency = 'zar'
  })

  it('shows dollars to a visitor outside South Africa', () => {
    render(<UpcomingEvents cohort={cohort} bookPrices={book} defaultCurrency="usd" />)
    expect(screen.getByText('$90')).toBeInTheDocument()
    expect(screen.getByText('$17.50')).toBeInTheDocument()
    expect(screen.queryByText(/^R/)).not.toBeInTheDocument()
  })

  it('shows rand to a South African visitor', () => {
    render(<UpcomingEvents cohort={cohort} bookPrices={book} defaultCurrency="zar" />)
    expect(screen.getByText(/^R1\s?500$/)).toBeInTheDocument()
    expect(screen.getByText('R165')).toBeInTheDocument()
  })

  it('shows no price rather than rand when the product has none in dollars', () => {
    render(<UpcomingEvents cohort={{ ...cohort, prices: [{ currency_code: 'zar', amount: 150000 }] }} bookPrices={null} defaultCurrency="usd" />)
    expect(screen.queryByText(/^R/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^\$/)).not.toBeInTheDocument()
  })
})
