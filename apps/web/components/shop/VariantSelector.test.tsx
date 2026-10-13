import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VariantSelector } from './VariantSelector'

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/cart', () => ({
  useCart: () => ({ cart: null, addItem: vi.fn() }),
}))

const variants = [
  { id: 'a', title: 'Live via Zoom', prices: [{ currency_code: 'zar', amount: 100000 }] },
  { id: 'b', title: 'Self Study', prices: [{ currency_code: 'zar', amount: 50000 }] },
]

describe('VariantSelector (site check M11, C1)', () => {
  it('does not promise payment plans (decision 15, 6 Oct)', () => {
    render(<VariantSelector variants={variants} selectedVariantId="a" onSelect={() => {}} />)
    expect(screen.queryByText(/payment plan/i)).not.toBeInTheDocument()
  })

  it('uses the chooser label it is given instead of "Choose Your Programme"', () => {
    render(<VariantSelector variants={variants} selectedVariantId="a" onSelect={() => {}} chooseLabel="Choose Your Format" />)
    expect(screen.getByText('Choose Your Format')).toBeInTheDocument()
    expect(screen.queryByText('Choose Your Programme')).not.toBeInTheDocument()
  })
})

describe('VariantSelector coming soon (Suzanne, 12 Oct)', () => {
  const formats = [
    { id: 'live', title: 'Live', prices: [{ currency_code: 'zar', amount: 150000 }] },
    { id: 'rec', title: 'Recorded series', prices: [{ currency_code: 'zar', amount: 150000 }], metadata: { coming_soon: true } },
  ]

  it('replaces Add to Cart with a disabled Coming Soon button for a coming-soon format', () => {
    render(<VariantSelector variants={formats} selectedVariantId="rec" onSelect={() => {}} />)
    expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument()
    const button = screen.getByRole('button', { name: /^coming soon$/i })
    expect(button).toBeDisabled()
    expect(screen.getByText(/not available to buy yet/i)).toBeInTheDocument()
    expect(screen.getByText(/let me know when it is available/i).closest('a')).toHaveAttribute('href', '/contact')
  })

  it('keeps Add to Cart for the live format of the same product and marks the other option', () => {
    render(<VariantSelector variants={formats} selectedVariantId="live" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument()
    expect(screen.getByText('(coming soon)')).toBeInTheDocument()
  })
})
