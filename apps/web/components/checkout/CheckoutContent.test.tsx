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

const readMemberContact = vi.fn(async (): Promise<unknown> => null)
vi.mock('@/lib/checkout/memberContact', () => ({ readMemberContact: () => readMemberContact() }))

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

  // KI077: a signed-in member starts with their account details filled in.
  it('prefills the contact step from the signed-in member', async () => {
    readMemberContact.mockResolvedValueOnce({ firstName: 'Ann', lastName: 'van Wyk', email: 'ann@example.com', phone: '+27 82 555 1234' })
    render(<CheckoutContent />)
    await waitFor(() => expect(screen.getByLabelText('Phone number')).toHaveValue('+27 82 555 1234'))
    expect(screen.getByLabelText(/First name/)).toHaveValue('Ann')
    expect(screen.getByLabelText(/Last name/)).toHaveValue('van Wyk')
    expect(screen.getByLabelText(/Email address/)).toHaveValue('ann@example.com')
  })

  it('leaves the contact step empty for a guest', async () => {
    render(<CheckoutContent />)
    await waitFor(() => expect(readMemberContact).toHaveBeenCalled())
    expect(screen.getByLabelText('Phone number')).toHaveValue('')
    expect(screen.getByLabelText(/Email address/)).toHaveValue('')
  })
})
