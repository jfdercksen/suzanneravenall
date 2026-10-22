import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PRICE_ON_REQUEST, type ProgramPriceTexts } from '@/lib/programs/program-prices'
import FeaturedPrograms from './FeaturedPrograms'

const cartState: { cart: { currency_code: string } | null } = { cart: null }
vi.mock('@/lib/cart', () => ({ useCart: () => cartState }))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_t, tag: string) =>
        function MotionStub({ children, initial, whileInView, viewport, transition, ...props }: Record<string, unknown>) {
          return React.createElement(tag, props, children as React.ReactNode)
        },
    },
  ),
}))

const GROUP: ProgramPriceTexts = { zar: 'R1,500', usd: '$90', zarCents: 150000, usdCents: 9000 }
const BASIC_FIVE: ProgramPriceTexts = { zar: 'R13,950', usd: '$2,105', zarCents: 1395000, usdCents: 210500 }

// L-USD3: the homepage programme cards show the visitor's currency only.
describe('FeaturedPrograms prices', () => {
  it('shows a South African visitor rand only', () => {
    render(<FeaturedPrograms groupPrice={GROUP} basicFivePrice={BASIC_FIVE} defaultCurrency="zar" />)
    expect(screen.getByText('From R1,500')).toBeInTheDocument()
    expect(screen.getByText('R13,950')).toBeInTheDocument()
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
  })

  it('shows a visitor elsewhere dollars only', () => {
    render(<FeaturedPrograms groupPrice={GROUP} basicFivePrice={BASIC_FIVE} defaultCurrency="usd" />)
    expect(screen.getByText('From $90')).toBeInTheDocument()
    expect(screen.getByText('$2,105')).toBeInTheDocument()
    expect(screen.queryByText(/R1/)).not.toBeInTheDocument()
  })

  it('says "Price on request" without "From" when there is no price, and keeps the per-session card', () => {
    render(<FeaturedPrograms defaultCurrency="usd" />)
    expect(screen.getAllByText(PRICE_ON_REQUEST).length).toBe(2)
    expect(screen.getByText('Priced per session')).toBeInTheDocument()
  })

  it('follows the cart currency once a cart exists', () => {
    cartState.cart = { currency_code: 'usd' }
    try {
      render(<FeaturedPrograms groupPrice={GROUP} basicFivePrice={BASIC_FIVE} defaultCurrency="zar" />)
      expect(screen.getByText('$2,105')).toBeInTheDocument()
    } finally {
      cartState.cart = null
    }
  })
})
