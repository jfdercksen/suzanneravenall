import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// D021: the gateway follows the cart currency, never the billing country.

let cartState: { cart: unknown; isLoading: boolean } = { cart: null, isLoading: false }
const setContact = vi.fn(async () => true)

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}))

vi.mock('@/lib/cart', () => ({
  useCart: () => ({
    ...cartState,
    setContact,
    applyPromoCode: vi.fn(),
    removePromoCode: vi.fn(),
  }),
  formatPrice: (n: number, c = 'zar') => `${c === 'usd' ? '$' : 'R'}${(n / 100).toFixed(2)}`,
}))

vi.mock('@/lib/checkout/memberContact', () => ({ readMemberContact: async () => null }))

import CheckoutContent from './CheckoutContent'

function cartIn(currency: 'zar' | 'usd', total = 55500, codes: string[] = []) {
  return {
    id: 'cart_1',
    items: [{ id: 'i1', title: 'Program Live', thumbnail: null, quantity: 1, subtotal: total }],
    promotions: codes.map((code) => ({ id: `p_${code}`, code })),
    currency_code: currency,
    subtotal: total,
    discount_total: 0,
    tax_total: 0,
    total: codes.length > 0 ? 0 : total,
  }
}

async function reachPayment(country?: 'ZA' | 'INTL') {
  const user = userEvent.setup()
  render(<CheckoutContent />)
  await user.type(screen.getByLabelText(/First name/), 'Johan')
  await user.type(screen.getByLabelText(/Last name/), 'QA Test')
  await user.type(screen.getByLabelText(/Email address/), 'qa@example.com')
  if (country) await user.selectOptions(screen.getByLabelText('Billing country'), country)
  await user.click(screen.getByLabelText(/I have read and accept the/))
  await user.click(screen.getByRole('button', { name: /Continue to Payment/ }))
  return user
}

describe('CheckoutContent gateway by cart currency', () => {
  beforeEach(() => {
    setContact.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('a USD cart offers PayPal only, even with a South African billing country', async () => {
    cartState = { cart: cartIn('usd'), isLoading: false }
    await reachPayment('ZA')
    expect(await screen.findByRole('button', { name: /Pay with PayPal/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Pay with PayFast/ })).not.toBeInTheDocument()
    // The USD region has no ZA in it, so no country goes on the billing address.
    expect(setContact).toHaveBeenCalledWith(expect.objectContaining({ countryCode: undefined }))
  })

  it('a USD cart starts the billing country on International', () => {
    cartState = { cart: cartIn('usd'), isLoading: false }
    render(<CheckoutContent />)
    expect(screen.getByLabelText('Billing country')).toHaveValue('INTL')
  })

  it('a ZAR cart offers PayFast only, even with an international billing country', async () => {
    cartState = { cart: cartIn('zar'), isLoading: false }
    await reachPayment('INTL')
    expect(await screen.findByRole('button', { name: /Pay with PayFast/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Pay with PayPal/ })).not.toBeInTheDocument()
  })

  it('a ZAR cart records ZA on the billing address', async () => {
    cartState = { cart: cartIn('zar'), isLoading: false }
    await reachPayment('ZA')
    await screen.findByRole('button', { name: /Pay with PayFast/ })
    expect(setContact).toHaveBeenCalledWith(expect.objectContaining({ countryCode: 'za' }))
  })

  it.each(['zar', 'usd'] as const)('a %s cart taken to zero by a voucher shows Place order and no gateway', async (currency) => {
    cartState = { cart: cartIn(currency, 55500, ['QA-SELFTEST-100']), isLoading: false }
    await reachPayment()
    expect(await screen.findByRole('button', { name: /Place order/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Pay with/ })).not.toBeInTheDocument()
  })

  it('posts a USD cart to /api/checkout/paypal and shows the route message on failure (KI085)', async () => {
    cartState = { cart: cartIn('usd'), isLoading: false }
    const fetchMock = vi.fn(async () => ({ ok: false, status: 400, json: async () => ({ error: 'Add your email address first' }) }))
    vi.stubGlobal('fetch', fetchMock)
    const user = await reachPayment()
    await user.click(await screen.findByRole('button', { name: /Pay with PayPal/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Add your email address first')
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/checkout/paypal')
    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(body.cartId).toBe('cart_1')
    // The currency comes from the cart on the server, never from the client.
    expect(body).not.toHaveProperty('currencyCode')
  })
})
