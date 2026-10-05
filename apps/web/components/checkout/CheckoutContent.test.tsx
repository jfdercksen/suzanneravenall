import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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

// Site check M5: contact fields are checked on blur, and phone takes no letters.
describe('CheckoutContent contact step', () => {
  beforeEach(() => {
    cartState = {
      cart: {
        id: 'cart_1',
        items: [{ id: 'i1', title: 'Session', thumbnail: null, quantity: 1, subtotal: 100000 }],
        promotions: [],
        currency_code: 'zar',
        subtotal: 100000,
        discount_total: 0,
        tax_total: 0,
        total: 100000,
      },
      isLoading: false,
    }
  })

  it('shows the email message when the field loses focus', async () => {
    const user = userEvent.setup()
    render(<CheckoutContent />)
    await user.type(screen.getByLabelText(/Email address/), 'ann@')
    await user.tab()
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
  })

  it('strips letters from the phone number and marks it as a tel input', async () => {
    const user = userEvent.setup()
    render(<CheckoutContent />)
    const phone = screen.getByLabelText('Phone number')
    await user.type(phone, '082abc5551234')
    expect(phone).toHaveValue('0825551234')
    expect(phone).toHaveAttribute('inputmode', 'tel')
  })
})
