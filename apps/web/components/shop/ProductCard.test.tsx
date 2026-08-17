import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductCard } from './ProductCard'
import type { MedusaProduct } from '@/types/medusa'

// ---------------------------------------------------------------------------
// Mock next/link — render as plain <a> so href is inspectable in tests
// ---------------------------------------------------------------------------
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</a>,
}))

// ---------------------------------------------------------------------------
// Mock next/image — render as plain <img>
// ---------------------------------------------------------------------------
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fill,
    sizes,
    className,
  }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} data-fill={fill} data-sizes={sizes} />
  ),
}))

// ---------------------------------------------------------------------------
// Mock framer-motion — strip animation props and render as plain HTML elements
// ---------------------------------------------------------------------------
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      exit,
      transition,
      variants,
      whileInView,
      viewport,
      whileHover,
      whileTap,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    ),
  },
}))

// ---------------------------------------------------------------------------
// Mock cart — ProductCard only reads cart?.currency_code
// ---------------------------------------------------------------------------
vi.mock('@/lib/cart', () => ({
  useCart: () => ({ cart: null }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProduct(overrides: Partial<MedusaProduct> = {}): MedusaProduct {
  return {
    id: 'prod_1',
    handle: 'test-programme',
    title: 'Test Programme',
    description: null,
    thumbnail: '/images/test.webp',
    variants: [
      { id: 'var_1', title: 'Default', prices: [{ currency_code: 'zar', amount: 250000 }] },
    ],
    categories: [],
    collection: null,
    ...overrides,
  }
}

describe('ProductCard — decision-guidance highlight badge', () => {
  it('renders a Most Popular badge when metadata.badge is most_popular', () => {
    render(
      <ProductCard
        product={makeProduct({ metadata: { badge: 'most_popular' } })}
        index={0}
      />
    )
    expect(screen.getByText('Most Popular')).toBeInTheDocument()
  })

  it('renders a Recommended badge when metadata.badge is recommended', () => {
    render(
      <ProductCard
        product={makeProduct({ metadata: { badge: 'recommended' } })}
        index={0}
      />
    )
    expect(screen.getByText('Recommended')).toBeInTheDocument()
  })

  it('renders no highlight badge when the product is not flagged', () => {
    render(<ProductCard product={makeProduct()} index={0} />)
    expect(screen.queryByText('Most Popular')).not.toBeInTheDocument()
    expect(screen.queryByText('Recommended')).not.toBeInTheDocument()
  })

  it('renders no highlight badge for unknown metadata.badge values', () => {
    render(
      <ProductCard
        product={makeProduct({ metadata: { badge: 'bestseller' } })}
        index={0}
      />
    )
    expect(screen.queryByText('Most Popular')).not.toBeInTheDocument()
    expect(screen.queryByText('Recommended')).not.toBeInTheDocument()
    expect(screen.queryByText('bestseller')).not.toBeInTheDocument()
  })

  it('overlays the badge on the image (absolute) so unflagged cards have no layout shift', () => {
    const { container: flagged } = render(
      <ProductCard
        product={makeProduct({ metadata: { badge: 'most_popular' } })}
        index={0}
      />
    )
    const badge = screen.getByText('Most Popular')
    expect(badge.className).toContain('absolute')

    // Removing the badge from the flagged card's DOM yields exactly the
    // unflagged card's DOM — the badge adds nothing to the card's flow layout.
    const { container: unflagged } = render(<ProductCard product={makeProduct()} index={0} />)
    badge.remove()
    expect(flagged.innerHTML).toBe(unflagged.innerHTML)
  })

  it('still renders the normal card content alongside the badge', () => {
    render(
      <ProductCard
        product={makeProduct({ metadata: { badge: 'most_popular' } })}
        index={0}
      />
    )
    expect(screen.getByText('Test Programme')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/shop/test-programme')
  })
})
