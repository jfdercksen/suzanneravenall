import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { CartProvider, useCart, type Cart } from './cart-context'

const MEDUSA_BASE = 'http://medusa-test:9000'
const CART_ID_KEY = 'medusa_cart_id'
const EMAIL_CART_ID = 'cart_01JEMAILEMAILEMAILEMAIL000'
const LOCAL_CART_ID = 'cart_01JLOCALLOCALLOCALLOCAL000'

function makeCart(id: string, extra: Partial<Cart> = {}): Cart {
  return {
    id,
    items: [
      {
        id: `item_${id}`,
        title: 'Programme',
        subtitle: null,
        thumbnail: null,
        quantity: 1,
        unit_price: 10000,
        subtotal: 10000,
        total: 10000,
        product_handle: null,
        variant_id: 'variant_1',
      },
    ],
    subtotal: 10000,
    discount_total: 0,
    shipping_total: 0,
    tax_total: 0,
    total: 10000,
    currency_code: 'zar',
    region_id: 'reg_zar',
    email: 'buyer@example.com',
    promotions: [],
    ...extra,
  }
}

function Probe() {
  const { cart, isLoading } = useCart()
  return <div data-testid="cart">{isLoading ? 'loading' : (cart?.id ?? 'none')}</div>
}

function stubMedusa(carts: Record<string, Cart>) {
  const fetchMock = vi.fn(async (input: string | URL) => {
    const url = input.toString()
    if (url === '/api/region') {
      return { ok: true, json: async () => ({ regionId: 'reg_zar' }) }
    }
    const match = url.match(/\/store\/carts\/([^/]+)$/)
    if (match) {
      const cart = carts[match[1] ?? '']
      return cart
        ? { ok: true, status: 200, json: async () => ({ cart }) }
        : { ok: false, status: 404, json: async () => ({}) }
    }
    throw new Error(`unexpected fetch call: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function visit(path: string) {
  window.history.replaceState({}, '', path)
}

describe('cart-context cart recovery (?cartId=)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_MEDUSA_URL = MEDUSA_BASE
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = 'pk_test_123'
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    visit('/')
    delete process.env.NEXT_PUBLIC_MEDUSA_URL
    delete process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  })

  it('restores the cart from the email link on a device with no stored cart', async () => {
    stubMedusa({ [EMAIL_CART_ID]: makeCart(EMAIL_CART_ID) })
    visit(`/checkout?cartId=${EMAIL_CART_ID}`)

    render(<CartProvider><Probe /></CartProvider>)

    await waitFor(() => expect(screen.getByTestId('cart').textContent).toBe(EMAIL_CART_ID))
    expect(localStorage.getItem(CART_ID_KEY)).toBe(EMAIL_CART_ID)
  })

  it('prefers the email link over a different cart stored in this browser', async () => {
    stubMedusa({
      [EMAIL_CART_ID]: makeCart(EMAIL_CART_ID),
      [LOCAL_CART_ID]: makeCart(LOCAL_CART_ID),
    })
    localStorage.setItem(CART_ID_KEY, LOCAL_CART_ID)
    visit(`/checkout?cartId=${EMAIL_CART_ID}`)

    render(<CartProvider><Probe /></CartProvider>)

    await waitFor(() => expect(screen.getByTestId('cart').textContent).toBe(EMAIL_CART_ID))
    expect(localStorage.getItem(CART_ID_KEY)).toBe(EMAIL_CART_ID)
  })

  it('falls back to the stored cart when the linked cart is already an order', async () => {
    stubMedusa({
      [EMAIL_CART_ID]: makeCart(EMAIL_CART_ID, { completed_at: '2026-10-01T09:00:00Z' }),
      [LOCAL_CART_ID]: makeCart(LOCAL_CART_ID),
    })
    localStorage.setItem(CART_ID_KEY, LOCAL_CART_ID)
    visit(`/checkout?cartId=${EMAIL_CART_ID}`)

    render(<CartProvider><Probe /></CartProvider>)

    await waitFor(() => expect(screen.getByTestId('cart').textContent).toBe(LOCAL_CART_ID))
  })

  it('ignores cartId outside the shopping pages (the PayPal return carries one)', async () => {
    const fetchMock = stubMedusa({ [EMAIL_CART_ID]: makeCart(EMAIL_CART_ID) })
    visit(`/checkout/confirmation?gateway=paypal&cartId=${EMAIL_CART_ID}`)

    render(<CartProvider><Probe /></CartProvider>)

    await waitFor(() => expect(screen.getByTestId('cart').textContent).toBe('none'))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(localStorage.getItem(CART_ID_KEY)).toBeNull()
  })

  it('drops a stored cart that has already become an order', async () => {
    stubMedusa({ [LOCAL_CART_ID]: makeCart(LOCAL_CART_ID, { completed_at: '2026-10-01T09:00:00Z' }) })
    localStorage.setItem(CART_ID_KEY, LOCAL_CART_ID)
    visit('/shop')

    render(<CartProvider><Probe /></CartProvider>)

    await waitFor(() => expect(screen.getByTestId('cart').textContent).toBe('none'))
    expect(localStorage.getItem(CART_ID_KEY)).toBeNull()
  })
})

describe('cart-context clearCart(cartId)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_MEDUSA_URL = MEDUSA_BASE
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    visit('/')
    delete process.env.NEXT_PUBLIC_MEDUSA_URL
  })

  function Clearer({ id }: { id: string }) {
    const { cart, isLoading, clearCart } = useCart()
    return (
      <div>
        <div data-testid="cart">{isLoading ? 'loading' : (cart?.id ?? 'none')}</div>
        <button onClick={() => clearCart(id)}>clear</button>
      </div>
    )
  }

  it('leaves a different live cart alone', async () => {
    stubMedusa({ [LOCAL_CART_ID]: makeCart(LOCAL_CART_ID) })
    localStorage.setItem(CART_ID_KEY, LOCAL_CART_ID)
    visit('/checkout/confirmation')

    render(<CartProvider><Clearer id={EMAIL_CART_ID} /></CartProvider>)
    await waitFor(() => expect(screen.getByTestId('cart').textContent).toBe(LOCAL_CART_ID))

    screen.getByText('clear').click()
    await waitFor(() => expect(screen.getByTestId('cart').textContent).toBe(LOCAL_CART_ID))
    expect(localStorage.getItem(CART_ID_KEY)).toBe(LOCAL_CART_ID)
  })

  it('clears the cart the order was for', async () => {
    stubMedusa({ [LOCAL_CART_ID]: makeCart(LOCAL_CART_ID) })
    localStorage.setItem(CART_ID_KEY, LOCAL_CART_ID)
    visit('/checkout/confirmation')

    render(<CartProvider><Clearer id={LOCAL_CART_ID} /></CartProvider>)
    await waitFor(() => expect(screen.getByTestId('cart').textContent).toBe(LOCAL_CART_ID))

    screen.getByText('clear').click()
    await waitFor(() => expect(screen.getByTestId('cart').textContent).toBe('none'))
    expect(localStorage.getItem(CART_ID_KEY)).toBeNull()
  })
})
