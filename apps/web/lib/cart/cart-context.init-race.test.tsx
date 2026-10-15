import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'

import { CartProvider, useCart, type Cart } from './cart-context'

const MEDUSA_BASE = 'http://medusa-test:9000'
const CART_ID_KEY = 'medusa_cart_id'
const STORED_ID = 'cart_01JSTOREDSTOREDSTORED0000'
const NEW_ID = 'cart_01JNEWNEWNEWNEWNEWNEW0000'

function makeCart(id: string, extra: Partial<Cart> = {}): Cart {
  return {
    id,
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
    ...extra,
  }
}

let addNow: (() => Promise<void>) | null = null

function Probe() {
  const { cart, isLoading, addItem } = useCart()
  addNow = () => addItem('variant_1', 1)
  return (
    <div data-testid="cart">
      {isLoading ? 'loading' : (cart?.id ?? 'none')}:{cart?.items.length ?? 0}
    </div>
  )
}

/**
 * Medusa stub where the GET of the stored cart resolves only when the test
 * releases it: the window an Add to Cart one second after load lands in.
 */
function stubSlowMedusa(stored: Cart | null) {
  let releaseStored: () => void = () => {}
  const storedReady = new Promise<void>((resolve) => {
    releaseStored = resolve
  })
  const lineItemPosts: string[] = []
  let created = 0
  const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
    const url = input.toString()
    if (url === '/api/region') return { ok: true, json: async () => ({ regionId: 'reg_zar' }) }
    if (url === `${MEDUSA_BASE}/store/carts` && init?.method === 'POST') {
      created += 1
      return { ok: true, json: async () => ({ cart: makeCart(NEW_ID) }) }
    }
    const lineItems = url.match(/\/store\/carts\/([^/]+)\/line-items$/)
    if (lineItems) {
      const id = lineItems[1] ?? ''
      lineItemPosts.push(id)
      return {
        ok: true,
        json: async () => ({
          cart: makeCart(id, {
            items: [
              {
                id: 'item_1',
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
          }),
        }),
      }
    }
    if (url === `${MEDUSA_BASE}/store/carts/${STORED_ID}`) {
      await storedReady
      return stored
        ? { ok: true, status: 200, json: async () => ({ cart: stored }) }
        : { ok: false, status: 404, json: async () => ({}) }
    }
    throw new Error(`unexpected fetch call: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return { release: () => releaseStored(), lineItemPosts, createdCount: () => created }
}

describe('cart-context: Add to Cart before the stored cart has loaded (KI066)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_MEDUSA_URL = MEDUSA_BASE
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = 'pk_test_123'
    localStorage.clear()
    window.history.replaceState({}, '', '/shop/some-product')
    addNow = null
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.NEXT_PUBLIC_MEDUSA_URL
    delete process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  })

  it('adds to the stored cart instead of creating a second one', async () => {
    localStorage.setItem(CART_ID_KEY, STORED_ID)
    const medusa = stubSlowMedusa(makeCart(STORED_ID))
    render(
      <CartProvider>
        <Probe />
      </CartProvider>
    )
    expect(screen.getByTestId('cart')).toHaveTextContent('loading')

    let addDone: Promise<void> = Promise.resolve()
    await act(async () => {
      addDone = addNow!()
      // Let the add start while the stored-cart GET is still pending.
      await Promise.resolve()
    })
    expect(medusa.lineItemPosts).toEqual([])
    expect(medusa.createdCount()).toBe(0)

    await act(async () => {
      medusa.release()
      await addDone
    })

    expect(medusa.createdCount()).toBe(0)
    expect(medusa.lineItemPosts).toEqual([STORED_ID])
    await waitFor(() => expect(screen.getByTestId('cart')).toHaveTextContent(`${STORED_ID}:1`))
    expect(localStorage.getItem(CART_ID_KEY)).toBe(STORED_ID)
  })

  it('still adds when init fails because storage throws (review note)', async () => {
    const medusa = stubSlowMedusa(null)
    medusa.release()
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })
    render(
      <CartProvider>
        <Probe />
      </CartProvider>
    )
    await waitFor(() => expect(screen.getByTestId('cart')).toHaveTextContent('none:0'))
    getItem.mockRestore()

    await act(async () => {
      await addNow!()
    })
    expect(medusa.createdCount()).toBe(1)
    expect(medusa.lineItemPosts).toEqual([NEW_ID])
  })

  it('keeps the new cart when the stored one turns out to be an order already', async () => {
    localStorage.setItem(CART_ID_KEY, STORED_ID)
    const medusa = stubSlowMedusa(makeCart(STORED_ID, { completed_at: '2026-10-15T10:00:00Z' }))
    render(
      <CartProvider>
        <Probe />
      </CartProvider>
    )

    let addDone: Promise<void> = Promise.resolve()
    await act(async () => {
      addDone = addNow!()
      await Promise.resolve()
    })
    await act(async () => {
      medusa.release()
      await addDone
    })

    expect(medusa.createdCount()).toBe(1)
    expect(medusa.lineItemPosts).toEqual([NEW_ID])
    await waitFor(() => expect(screen.getByTestId('cart')).toHaveTextContent(`${NEW_ID}:1`))
    // The old code removed the key here, so a reload lost the item.
    expect(localStorage.getItem(CART_ID_KEY)).toBe(NEW_ID)
  })
})
