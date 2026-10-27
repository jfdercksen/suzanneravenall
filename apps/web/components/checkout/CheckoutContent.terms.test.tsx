import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Terms tick box (Suzanne, 24 Oct; D024): required on every order before payment.

const setContact = vi.fn(async (_c: unknown) => true)

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}))

vi.mock('@/lib/cart', () => ({
  useCart: () => ({
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
    setContact,
    applyPromoCode: vi.fn(),
    removePromoCode: vi.fn(),
  }),
  formatPrice: (n: number) => `R${(n / 100).toFixed(2)}`,
}))

vi.mock('@/lib/checkout/memberContact', () => ({ readMemberContact: async () => null }))

import CheckoutContent, { TERMS_REQUIRED_MESSAGE } from './CheckoutContent'

async function fillPerson(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/First name/), 'Ann')
  await user.type(screen.getByLabelText(/Last name/), 'Buyer')
  await user.type(screen.getByLabelText(/Email address/), 'ann@example.com')
}

describe('CheckoutContent terms tick box', () => {
  beforeEach(() => {
    setContact.mockClear()
  })

  it('shows the box unticked, with a link to the Terms page', () => {
    render(<CheckoutContent />)
    const box = screen.getByLabelText(/I have read and accept the Terms and Conditions/)
    expect(box).not.toBeChecked()
    expect(screen.getByRole('link', { name: 'Terms and Conditions' })).toHaveAttribute('href', '/legal/terms')
  })

  it('refuses to continue to payment without the tick', async () => {
    const user = userEvent.setup()
    render(<CheckoutContent />)
    await fillPerson(user)
    await user.click(screen.getByRole('button', { name: /Continue to Payment/ }))
    expect(screen.getByRole('alert')).toHaveTextContent(TERMS_REQUIRED_MESSAGE)
    expect(screen.getByLabelText(/I have read and accept/)).toHaveAttribute('aria-invalid', 'true')
    expect(setContact).not.toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: 'Payment' })).not.toBeInTheDocument()
  })

  it('continues once ticked and records when the Terms were accepted', async () => {
    const user = userEvent.setup()
    render(<CheckoutContent />)
    await fillPerson(user)
    await user.click(screen.getByRole('button', { name: /Continue to Payment/ }))
    await user.click(screen.getByLabelText(/I have read and accept/))
    expect(screen.queryByText(TERMS_REQUIRED_MESSAGE)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Continue to Payment/ }))
    await waitFor(() => expect(setContact).toHaveBeenCalledTimes(1))
    const metadata = (setContact.mock.calls[0]![0] as { metadata: Record<string, string> }).metadata
    expect(Number.isNaN(Date.parse(metadata.terms_accepted_at ?? ''))).toBe(false)
    expect(await screen.findByRole('heading', { name: 'Payment' })).toBeInTheDocument()
  })
})
