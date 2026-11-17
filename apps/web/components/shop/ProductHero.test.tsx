import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { MedusaProduct } from '@/types/medusa'
import { ProductHero } from './ProductHero'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_t, tag: string) =>
        ({ children, initial, animate, transition, ...props }: Record<string, unknown> & { children?: React.ReactNode }) =>
          React.createElement(tag, props, children),
    },
  ),
}))

const product = (categories: MedusaProduct['categories']): MedusaProduct => ({
  id: 'p',
  handle: 'akashic-navigator-intuitive-coaching-advanced-clearing-others-level-2-live-via-zoom',
  title: 'Akashic Navigator: Advanced',
  description: 'Learn to read the Akashic Records for others.',
  thumbnail: null,
  variants: [],
  categories,
  metadata: {},
  collection: null,
})

// Shayna, 17 Nov: the breadcrumb said "Shop / Live / ..." on a product that
// also sells Self Study. A format category is named by its topic.
describe('ProductHero breadcrumb', () => {
  it('names the topic of a format category and links to it', () => {
    render(
      <ProductHero
        product={product([
          {
            id: 'c',
            handle: 'akashic-live',
            name: 'Live',
            parent_category_id: 't',
            parent_category: { id: 't', handle: 'akashic-navigator', name: 'Akashic Navigator' },
          },
        ])}
      />,
    )
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(crumbs).toHaveTextContent('Shop/Akashic Navigator/Akashic Navigator: Advanced')
    expect(screen.getByRole('link', { name: 'Akashic Navigator' })).toHaveAttribute('href', '/shop?category=akashic-navigator')
  })

  it('keeps any other category as it is', () => {
    render(<ProductHero product={product([{ id: 'b', handle: 'books', name: 'Books', parent_category_id: null }])} />)
    expect(screen.getByRole('link', { name: 'Books' })).toHaveAttribute('href', '/shop?category=books')
  })
})
