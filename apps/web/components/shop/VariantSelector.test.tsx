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
  useCart: vi.fn(() => ({ cart: null, addItem: vi.fn() })),
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

describe('VariantSelector before and after hydration (KI066)', () => {
  it('renders the picker and Add to Cart disabled with a pending label in the server HTML', async () => {
    const { renderToString } = await import('react-dom/server')
    const html = renderToString(
      <VariantSelector variants={variants} selectedVariantId="a" onSelect={() => {}} />
    )
    const buttons = html.match(/<button[^>]*>/g) ?? []
    expect(buttons.length).toBe(3)
    for (const b of buttons) expect(b).toMatch(/\bdisabled\b/)
    expect(html).toContain('Loading...')
    expect(html).not.toContain('>Add to Cart<')
  })

  it('accepts a variant click once hydrated', async () => {
    const { fireEvent } = await import('@testing-library/react')
    const onSelect = vi.fn()
    render(<VariantSelector variants={variants} selectedVariantId="a" onSelect={onSelect} />)
    const button = screen.getByRole('button', { name: 'Self Study' })
    expect(button).not.toBeDisabled()
    fireEvent.click(button)
    expect(onSelect).toHaveBeenCalledWith('b')
    expect(screen.getByRole('button', { name: /add to cart/i })).not.toBeDisabled()
  })
})

describe('VariantSelector add-to-cart feedback (KI066)', () => {
  it('names the variant in a confirmation that stays until another variant is chosen', async () => {
    const { fireEvent, waitFor } = await import('@testing-library/react')
    const { rerender } = render(
      <VariantSelector variants={variants} selectedVariantId="b" onSelect={() => {}} />
    )
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Self Study is in your cart.'))
    expect(screen.getByRole('button', { name: /added to cart/i })).toBeDisabled()
    expect(screen.getByText(/View cart/).closest('a')).toHaveAttribute('href', '/cart')

    // No timed reset: still there after a pause.
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.getByRole('status')).toBeInTheDocument()

    // Picking the other variant brings back a live Add to Cart for it.
    rerender(<VariantSelector variants={variants} selectedVariantId="a" onSelect={() => {}} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^add to cart$/i })).not.toBeDisabled()
  })
})

describe('VariantSelector after an add, per quantity rule (review note)', () => {
  it('offers Add another for the book, which allows more than one per order', async () => {
    const { fireEvent, waitFor } = await import('@testing-library/react')
    const book = [{ id: 'book', title: 'Paperback', prices: [{ currency_code: 'zar', amount: 35000 }] }]
    const cartLib = await import('@/lib/cart')
    vi.mocked(cartLib.useCart).mockReturnValue({
      cart: {
        items: [{ variant_id: 'book', product_handle: 'the-latest-book-by-suzanne', quantity: 1 }],
      },
      addItem: vi.fn(),
    } as unknown as ReturnType<typeof cartLib.useCart>)
    render(<VariantSelector variants={book} selectedVariantId="book" onSelect={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('This item is in your cart.'))
    expect(screen.getByRole('button', { name: 'Add another' })).not.toBeDisabled()
  })
})
