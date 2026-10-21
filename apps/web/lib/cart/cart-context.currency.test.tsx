import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'

import { CartProvider, useCart, type Cart } from './cart-context'

// D021: the cart follows the visitor's currency; a switch moves it.

const MEDUSA_BASE = 'http://medusa-test:9000'
const CART_ID_KEY = 'medusa_cart_id'
const OLD = 'cart_01JOLDOLDOLDOLDOLDOLD0000'
const NEW = 'cart_01JNEWNEWNEWNEWNEWNEW0000'

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

const item = (variant: string, title: string) => ({
  id: `li_${variant}`,
  title,
  subtitle: null,
  thumbnail: null,
  quantity: 1,
  unit_price: 100,
  subtotal: 100,
  total: 100,
  product_handle: null,
  variant_id: variant,
})

let switchTo: ((c: 'zar' | 'usd') => Promise<void>) | null = null

function Probe() {
  const { cart, isLoading, currency, usdEnabled, setCurrency, droppedOnSwitch } = useCart()
  switchTo = setCurrency
  return (
    <div>
      <div data-testid="cart">{isLoading ? 'loading' : `${cart?.id ?? 'none'}:${cart?.region_id ?? ''}:${cart?.items.length ?? 0}`}</div>
      <div data-testid="currency">{`${currency ?? 'null'}:${usdEnabled}`}</div>
      <div data-testid="dropped">{droppedOnSwitch.join('|')}</div>
    </div>
  )
}

interface StubOptions {
  region?: { regionId: string; currency: string; usdEnabled: boolean; auto: boolean }
  stored?: Cart
  regionUpdateOk?: boolean
  pricedInUsd?: string[]
}

function stub({
  region = { regionId: 'reg_zar', currency: 'zar', usdEnabled: true, auto: false },
  stored,
  regionUpdateOk = true,
  pricedInUsd = [],
}: StubOptions) {
  let fresh = makeCart(NEW, { region_id: 'reg_usd', currency_code: 'usd' })
  const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
    const url = input.toString()
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {}
    if (url === '/api/region' && init?.method === 'POST') {
      const c = String(body.currency)
      return { ok: true, json: async () => ({ regionId: c === 'usd' ? 'reg_usd' : 'reg_zar', currency: c }) }
    }
    if (url === '/api/region') return { ok: true, json: async () => region }
    if (url === `${MEDUSA_BASE}/store/carts` && init?.method === 'POST') {
      fresh = makeCart(NEW, { region_id: String(body.region_id), currency_code: body.region_id === 'reg_usd' ? 'usd' : 'zar' })
      return { ok: true, json: async () => ({ cart: fresh }) }
    }
    if (url === `${MEDUSA_BASE}/store/carts/${NEW}/line-items`) {
      const v = String(body.variant_id)
      if (!pricedInUsd.includes(v)) return { ok: false, status: 400, json: async () => ({}) }
      fresh = { ...fresh, items: [...fresh.items, item(v, v)] }
      return { ok: true, json: async () => ({ cart: fresh }) }
    }
    if (stored && url.startsWith(`${MEDUSA_BASE}/store/carts/${stored.id}/line-items/`) && init?.method === 'DELETE') {
      return { ok: true, json: async () => ({}) }
    }
    if (stored && url === `${MEDUSA_BASE}/store/carts/${stored.id}` && init?.method === 'POST' && body.region_id) {
      if (!regionUpdateOk) return { ok: false, status: 400, json: async () => ({}) }
      const moved = { ...stored, region_id: String(body.region_id), currency_code: body.region_id === 'reg_usd' ? 'usd' : 'zar' }
      return { ok: true, json: async () => ({ cart: moved }) }
    }
    if (stored && url === `${MEDUSA_BASE}/store/carts/${stored.id}`) {
      return { ok: true, status: 200, json: async () => ({ cart: stored }) }
    }
    throw new Error(`unexpected fetch call: ${init?.method ?? 'GET'} ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('cart-context currency (D021)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_MEDUSA_URL = MEDUSA_BASE
    localStorage.clear()
    window.history.replaceState({}, '', '/shop')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    delete process.env.NEXT_PUBLIC_MEDUSA_URL
  })

  it('exposes the visitor currency and the master switch from /api/region', async () => {
    stub({ region: { regionId: 'reg_usd', currency: 'usd', usdEnabled: true, auto: false } })
    render(<CartProvider><Probe /></CartProvider>)
    await waitFor(() => expect(screen.getByTestId('currency').textContent).toBe('usd:true'))
  })

  it('a switch re-assigns the cart to the new region and refreshes the page', async () => {
    const stored = makeCart(OLD, { items: [item('v1', 'Program Live')] })
    stub({ stored })
    localStorage.setItem(CART_ID_KEY, OLD)
    const refresh = vi.fn()
    render(<CartProvider onCurrencyChange={refresh}><Probe /></CartProvider>)
    await waitFor(() => expect(screen.getByTestId('cart').textContent).toBe(`${OLD}:reg_zar:1`))

    await act(async () => {
      await switchTo?.('usd')
    })
    expect(screen.getByTestId('cart').textContent).toBe(`${OLD}:reg_usd:1`)
    expect(screen.getByTestId('currency').textContent).toBe('usd:true')
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('when a line has no USD price, rebuilds the cart from the priced lines and names the rest', async () => {
    const stored = makeCart(OLD, { items: [item('v1', 'Program Live'), item('v2', 'Breakthrough Trilogy')] })
    const fetchMock = stub({ stored, regionUpdateOk: false, pricedInUsd: ['v1'] })
    localStorage.setItem(CART_ID_KEY, OLD)
    render(<CartProvider><Probe /></CartProvider>)
    await waitFor(() => expect(screen.getByTestId('cart').textContent).toBe(`${OLD}:reg_zar:2`))

    await act(async () => {
      await switchTo?.('usd')
    })
    expect(screen.getByTestId('cart').textContent).toBe(`${NEW}:reg_usd:1`)
    expect(screen.getByTestId('dropped').textContent).toBe('Breakthrough Trilogy')
    expect(localStorage.getItem(CART_ID_KEY)).toBe(NEW)
    // The old cart is emptied so no reminder mails its rand prices.
    const deletes = fetchMock.mock.calls.filter(([, i]) => i?.method === 'DELETE').map(([u]) => String(u))
    expect(deletes).toEqual([
      `${MEDUSA_BASE}/store/carts/${OLD}/line-items/li_v1`,
      `${MEDUSA_BASE}/store/carts/${OLD}/line-items/li_v2`,
    ])
  })

  it('runs switches one at a time and holds an Add to Cart until the switch is done', async () => {
    const stored = makeCart(OLD, { items: [item('v1', 'Program Live')] })
    const fetchMock = stub({ stored })
    localStorage.setItem(CART_ID_KEY, OLD)
    render(<CartProvider><Probe /></CartProvider>)
    await waitFor(() => expect(screen.getByTestId('cart').textContent).toBe(`${OLD}:reg_zar:1`))

    await act(async () => {
      await Promise.all([switchTo?.('usd'), switchTo?.('zar')])
    })
    const regionPosts = fetchMock.mock.calls
      .filter(([u, i]) => String(u) === `${MEDUSA_BASE}/store/carts/${OLD}` && i?.method === 'POST')
      .map(([, i]) => (JSON.parse(String(i?.body)) as { region_id: string }).region_id)
    expect(regionPosts).toEqual(['reg_usd', 'reg_zar'])
  })

  it('moves a stored cart from another region on load instead of discarding it', async () => {
    const stored = makeCart(OLD, { items: [item('v1', 'Program Live')] })
    stub({ stored, region: { regionId: 'reg_usd', currency: 'usd', usdEnabled: true, auto: false } })
    localStorage.setItem(CART_ID_KEY, OLD)
    render(<CartProvider><Probe /></CartProvider>)
    await waitFor(() => expect(screen.getByTestId('cart').textContent).toBe(`${OLD}:reg_usd:1`))
  })

  it('moves a first-visit USD guess to ZAR for a browser on South African time', async () => {
    const fetchMock = stub({ region: { regionId: 'reg_usd', currency: 'usd', usdEnabled: true, auto: true } })
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      timeZone: 'Africa/Johannesburg',
    } as Intl.ResolvedDateTimeFormatOptions)
    const refresh = vi.fn()
    render(<CartProvider onCurrencyChange={refresh}><Probe /></CartProvider>)
    await waitFor(() => expect(screen.getByTestId('currency').textContent).toBe('zar:true'))
    expect(fetchMock.mock.calls.some(([u, i]) => u === '/api/region' && i?.method === 'POST')).toBe(true)
    expect(refresh).toHaveBeenCalled()
  })

  it('never overrides a currency the visitor chose', async () => {
    stub({ region: { regionId: 'reg_usd', currency: 'usd', usdEnabled: true, auto: false } })
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      timeZone: 'Africa/Johannesburg',
    } as Intl.ResolvedDateTimeFormatOptions)
    render(<CartProvider><Probe /></CartProvider>)
    await waitFor(() => expect(screen.getByTestId('currency').textContent).toBe('usd:true'))
  })
})
