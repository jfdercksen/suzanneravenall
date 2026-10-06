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
