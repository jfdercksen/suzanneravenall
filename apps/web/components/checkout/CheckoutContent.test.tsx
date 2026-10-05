import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const replace = vi.fn()
let cartState: { cart: unknown; isLoading: boolean } = { cart: null, isLoading: false }

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}))

vi.mock('@/lib/cart', () => ({
  useCart: () => ({
    ...cartState,
    setContact: vi.fn(),
    applyPromoCode: vi.fn(),
    removePromoCode: vi.fn(),
  }),
  formatPrice: (n: number) => `R${(n / 100).toFixed(2)}`,
}))

import CheckoutContent from './CheckoutContent'

describe('CheckoutContent with nothing to check out', () => {
  beforeEach(() => {
    replace.mockReset()
  })

  it('redirects a visitor with no cart at all to /cart and shows no form', async () => {
    cartState = { cart: null, isLoading: false }
    render(<CheckoutContent />)

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/cart'))
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
  })

  it('redirects an empty cart to /cart', async () => {
    cartState = { cart: { id: 'cart_1', items: [], promotions: [], total: 0 }, isLoading: false }
    render(<CheckoutContent />)

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/cart'))
  })

  it('waits for the cart to load before deciding', () => {
    cartState = { cart: null, isLoading: true }
    render(<CheckoutContent />)

    expect(replace).not.toHaveBeenCalled()
    expect(screen.getByText('Loading your cart...')).toBeInTheDocument()
  })
})
