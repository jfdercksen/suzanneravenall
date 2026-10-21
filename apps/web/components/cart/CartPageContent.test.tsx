import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CartPageContent from './CartPageContent'

const cartState: { cart: unknown; isLoading: boolean } = { cart: null, isLoading: true }

vi.mock('@/lib/cart', () => ({
  useCart: () => ({ droppedOnSwitch: [], ...cartState, updateItem: vi.fn(), removeItem: vi.fn() }),
  formatPrice: (n: number) => `R${(n / 100).toFixed(2)}`,
}))
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}))
vi.mock('framer-motion', () => {
  const strip = (tag: string) =>
    function MotionStub({
      children,
      initial,
      animate,
      transition,
      variants,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) {
      return React.createElement(tag, props, children)
    }
  return { motion: { div: strip('div'), ul: strip('ul'), li: strip('li') } }
})

describe('CartPageContent loading state (KI064)', () => {
  it('shows the page title and a loading line while the cart is being fetched', () => {
    cartState.isLoading = true
    render(<CartPageContent />)
    expect(screen.getByRole('heading', { level: 1, name: 'Your Cart' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Loading your cart...')
    expect(screen.queryByText(/your cart is empty/i)).not.toBeInTheDocument()
  })

  it('renders the same loading state in the server HTML', async () => {
    cartState.isLoading = true
    const { renderToString } = await import('react-dom/server')
    const html = renderToString(<CartPageContent />)
    expect(html).toContain('Your Cart')
    expect(html).toContain('Loading your cart...')
  })

  it('shows the empty state once loading has finished with no cart', () => {
    cartState.isLoading = false
    cartState.cart = null
    render(<CartPageContent />)
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
