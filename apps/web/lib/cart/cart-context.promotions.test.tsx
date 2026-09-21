import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { CartProvider, useCart, type Cart } from './cart-context'

const MEDUSA_BASE = 'http://medusa-test:9000'

const NEW_CART: Cart = {
  id: 'cart_1',
  items: [],
  subtotal: 0,
  discount_total: 0,
  shipping_total: 0,
  tax_total: 0,
  total: 0,
  currency_code: 'zar',
  region_id: 'reg_zar',
  email: null,
  promotions: [],
}

const CART_WITH_PROMO: Cart = {
  ...NEW_CART,
  discount_total: 5000,
  total: -5000,
  promotions: [{ id: 'promo_1', code: 'SAVE10' }],
}

const CART_WITHOUT_PROMO: Cart = {
  ...NEW_CART,
  promotions: [],
}

// Small harness that exercises applyPromoCode / removePromoCode through the
// public useCart() surface, the smallest slice that proves the two behaviours
// without reaching into the provider's internals.
function TestHarness() {
  const { cart, applyPromoCode, removePromoCode } = useCart()
  const [error, setError] = useState<string | null>(null)

  const handleApply = async () => {
    setError(null)
    try {
      await applyPromoCode('SAVE10')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error')
    }
  }

  const handleRemove = async () => {
    setError(null)
    try {
      await removePromoCode('SAVE10')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error')
    }
  }

  return (
    <div>
      <button onClick={handleApply}>apply</button>
      <button onClick={handleRemove}>remove</button>
      <div data-testid="error">{error ?? ''}</div>
      <div data-testid="promo-codes">
        {(cart?.promotions ?? []).map((p) => p.code).join(',')}
      </div>
    </div>
  )
}

interface FetchMockOptions {
  applyResult?: Cart
  removeResult?: Cart
}

// Answers the three calls the promotions flow makes: the region lookup used to
// bootstrap a cart, the cart creation itself, and the promotions POST/DELETE.
function makeFetchMock({ applyResult = CART_WITH_PROMO, removeResult = NEW_CART }: FetchMockOptions = {}) {
  return vi.fn(async (input: string | URL, init?: RequestInit) => {
    const url = input.toString()
    const method = init?.method ?? 'GET'

    if (url === '/api/region') {
      return { ok: true, json: async () => ({ regionId: 'reg_zar' }) }
    }
    if (url === `${MEDUSA_BASE}/store/carts` && method === 'POST') {
      return { ok: true, json: async () => ({ cart: NEW_CART }) }
    }
    if (url === `${MEDUSA_BASE}/store/carts/${NEW_CART.id}/promotions`) {
      if (method === 'DELETE') {
        return { ok: true, json: async () => ({ cart: removeResult }) }
      }
      return { ok: true, json: async () => ({ cart: applyResult }) }
    }
    throw new Error(`unexpected fetch call: ${method} ${url}`)
  })
}

describe('cart-context promotions', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_MEDUSA_URL = MEDUSA_BASE
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = 'pk_test_123'
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.NEXT_PUBLIC_MEDUSA_URL
    delete process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  })

  it('applies a valid promo code and reflects it on the cart', async () => {
    const fetchMock = makeFetchMock({ applyResult: CART_WITH_PROMO })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(
      <CartProvider>
        <TestHarness />
      </CartProvider>,
    )

    await user.click(screen.getByText('apply'))

    await waitFor(() => {
      expect(screen.getByTestId('promo-codes').textContent).toBe('SAVE10')
    })
    expect(screen.getByTestId('error').textContent).toBe('')
  })

  it('sends promo_codes in the POST body to the promotions endpoint', async () => {
    const fetchMock = makeFetchMock({ applyResult: CART_WITH_PROMO })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(
      <CartProvider>
        <TestHarness />
      </CartProvider>,
    )

    await user.click(screen.getByText('apply'))
    await waitFor(() => {
      expect(screen.getByTestId('promo-codes').textContent).toBe('SAVE10')
    })

    const promoCall = fetchMock.mock.calls.find(
      ([url]) => url.toString() === `${MEDUSA_BASE}/store/carts/${NEW_CART.id}/promotions`,
    )
    expect(promoCall).toBeDefined()
    const [, init] = promoCall as [string, RequestInit]
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ promo_codes: ['SAVE10'] })
  })

  it('throws "That voucher code is not valid" when Medusa answers 200 without the code applied', async () => {
    // Medusa's documented behaviour for an unknown/inactive code: 200 OK, but
    // the code is silently absent from cart.promotions.
    const fetchMock = makeFetchMock({ applyResult: CART_WITHOUT_PROMO })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(
      <CartProvider>
        <TestHarness />
      </CartProvider>,
    )

    await user.click(screen.getByText('apply'))

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('That voucher code is not valid')
    })
    // Even on the invalid-code path the cart from the response is still applied.
    expect(screen.getByTestId('promo-codes').textContent).toBe('')
  })

  it('removes a promo code via DELETE with the same body shape and updates the cart', async () => {
    const fetchMock = makeFetchMock({ applyResult: CART_WITH_PROMO, removeResult: NEW_CART })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(
      <CartProvider>
        <TestHarness />
      </CartProvider>,
    )

    await user.click(screen.getByText('apply'))
    await waitFor(() => {
      expect(screen.getByTestId('promo-codes').textContent).toBe('SAVE10')
    })

    await user.click(screen.getByText('remove'))
    await waitFor(() => {
      expect(screen.getByTestId('promo-codes').textContent).toBe('')
    })

    const deleteCall = fetchMock.mock.calls.find(
      ([, init]) => (init as RequestInit | undefined)?.method === 'DELETE',
    )
    expect(deleteCall).toBeDefined()
    const [deleteUrl, deleteInit] = deleteCall as [string, RequestInit]
    expect(deleteUrl).toBe(`${MEDUSA_BASE}/store/carts/${NEW_CART.id}/promotions`)
    expect(JSON.parse(deleteInit.body as string)).toEqual({ promo_codes: ['SAVE10'] })
  })
})

// Not covered here: the provider's localStorage bootstrap path (restoring an
// existing cart id on mount) and fetchRegionId's own fallback chain are
// exercised indirectly (the happy path goes through fetchRegionId -> /api/region),
// but the region-mismatch eviction branch and the direct-Medusa-regions fallback
// are better covered as their own focused unit tests against fetchCart/fetchRegionId
// in isolation, since driving them through the full provider adds bootstrap-order
// brittleness without adding confidence in the two behaviours this file targets.
