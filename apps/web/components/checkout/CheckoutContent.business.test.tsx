import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Business checkout (Shayna, 22 Oct): an optional company block on the contact step.

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

import CheckoutContent from './CheckoutContent'

async function fillPerson(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/First name/), 'Ann')
  await user.type(screen.getByLabelText(/Last name/), 'Buyer')
  await user.type(screen.getByLabelText(/Email address/), 'ann@example.com')
}

describe('CheckoutContent business checkout', () => {
  beforeEach(() => {
    setContact.mockClear()
  })

  it('shows no company fields until the toggle is ticked', async () => {
    const user = userEvent.setup()
    render(<CheckoutContent />)
    expect(screen.queryByLabelText(/Company name/)).not.toBeInTheDocument()
    await user.click(screen.getByLabelText('Buying for a business?'))
    expect(screen.getByLabelText(/Company name/)).toBeInTheDocument()
    expect(screen.getByLabelText('VAT number')).toBeInTheDocument()
    expect(screen.getByLabelText('Company registration number')).toBeInTheDocument()
    expect(screen.getByLabelText('Company billing address')).toBeInTheDocument()
  })

  it('a personal checkout saves empty business details, as before', async () => {
    const user = userEvent.setup()
    render(<CheckoutContent />)
    await fillPerson(user)
    await user.click(screen.getByRole('button', { name: /Continue to Payment/ }))
    await waitFor(() => expect(setContact).toHaveBeenCalledTimes(1))
    expect(setContact.mock.calls[0]![0]).toMatchObject({
      email: 'ann@example.com',
      firstName: 'Ann',
      lastName: 'Buyer',
      countryCode: 'za',
      company: '',
      metadata: {
        business_company_name: '',
        business_vat_number: '',
        business_registration_number: '',
        business_address: '',
      },
    })
  })

  it('requires the company name when the toggle is on', async () => {
    const user = userEvent.setup()
    render(<CheckoutContent />)
    await fillPerson(user)
    await user.click(screen.getByLabelText('Buying for a business?'))
    await user.click(screen.getByRole('button', { name: /Continue to Payment/ }))
    expect(screen.getByText('Company name is required')).toBeInTheDocument()
    expect(setContact).not.toHaveBeenCalled()
  })

  it('refuses a South African VAT number in the wrong format', async () => {
    const user = userEvent.setup()
    render(<CheckoutContent />)
    await fillPerson(user)
    await user.click(screen.getByLabelText('Buying for a business?'))
    await user.type(screen.getByLabelText(/Company name/), 'Acme (Pty) Ltd')
    await user.type(screen.getByLabelText('VAT number'), '123456')
    await user.tab()
    expect(screen.getByText('A South African VAT number is 10 digits and starts with 4')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Continue to Payment/ }))
    expect(setContact).not.toHaveBeenCalled()
  })

  it('saves the company on the billing address and all details in metadata', async () => {
    const user = userEvent.setup()
    render(<CheckoutContent />)
    await fillPerson(user)
    await user.click(screen.getByLabelText('Buying for a business?'))
    await user.type(screen.getByLabelText(/Company name/), 'Acme (Pty) Ltd')
    await user.type(screen.getByLabelText('VAT number'), '4123 456 789')
    await user.type(screen.getByLabelText('Company registration number'), '2020/123456/07')
    await user.type(screen.getByLabelText('Company billing address'), '1 Main Road, Sandton')
    await user.click(screen.getByRole('button', { name: /Continue to Payment/ }))
    await waitFor(() => expect(setContact).toHaveBeenCalledTimes(1))
    expect(setContact.mock.calls[0]![0]).toMatchObject({
      company: 'Acme (Pty) Ltd',
      metadata: {
        business_company_name: 'Acme (Pty) Ltd',
        business_vat_number: '4123456789',
        business_registration_number: '2020/123456/07',
        business_address: '1 Main Road, Sandton',
      },
    })
    // The payment step repeats the company for the buyer to check.
    expect(await screen.findByText(/Acme \(Pty\) Ltd \(VAT 4123456789\)/)).toBeInTheDocument()
  })

  it('switching the toggle off again saves a personal checkout', async () => {
    const user = userEvent.setup()
    render(<CheckoutContent />)
    await fillPerson(user)
    await user.click(screen.getByLabelText('Buying for a business?'))
    await user.type(screen.getByLabelText(/Company name/), 'Acme')
    await user.click(screen.getByLabelText('Buying for a business?'))
    await user.click(screen.getByRole('button', { name: /Continue to Payment/ }))
    await waitFor(() => expect(setContact).toHaveBeenCalledTimes(1))
    expect(setContact.mock.calls[0]![0]).toMatchObject({ company: '', metadata: { business_company_name: '' } })
  })
})
