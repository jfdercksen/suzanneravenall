import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { MedusaProduct } from '@/types/medusa'
import { ShopAddOns } from './ShopAddOns'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, whileInView, viewport, transition, ...props }: Record<string, unknown> & { children?: React.ReactNode }) =>
      React.createElement('div', props, children),
  },
}))
vi.mock('./ProductCard', () => ({
  ProductCard: ({ product }: { product: MedusaProduct }) => <a href={`/shop/${product.handle}`}>{product.title}</a>,
}))

const addOn = (handle: string, title: string): MedusaProduct => ({
  id: `prod_${handle}`,
  handle,
  title,
  description: null,
  thumbnail: null,
  metadata: null,
  variants: [],
  categories: [],
  collection: null,
})

describe('ShopAddOns', () => {
  it('shows an Add-ons section with a card per add-on, at the #add-ons anchor', () => {
    const { container } = render(
      <ShopAddOns
        products={[
          addOn('bonus-lifetime-access-self-study-online', 'Bonus Lifetime Access'),
          addOn('email-support', 'Email Support'),
        ]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Add to Your Journey' })).toBeInTheDocument()
    expect(screen.getByText('Add-ons')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bonus Lifetime Access' })).toHaveAttribute(
      'href',
      '/shop/bonus-lifetime-access-self-study-online',
    )
    expect(screen.getByRole('link', { name: 'Email Support' })).toBeInTheDocument()
    expect(container.querySelector('section#add-ons')).not.toBeNull()
  })

  it('renders nothing when the store returned no add-ons', () => {
    const { container } = render(<ShopAddOns products={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
