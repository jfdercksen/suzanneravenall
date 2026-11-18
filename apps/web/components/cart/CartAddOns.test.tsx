import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const addItem = vi.fn(async () => {})
const cartState: { cart: { currency_code: string; items: Array<Record<string, unknown>> } | null } = { cart: null }
vi.mock('@/lib/cart', () => ({
  useCart: () => ({ cart: cartState.cart, addItem }),
  formatPrice: (cents: number, code: string) => `${code.toUpperCase()} ${cents / 100}`,
}))
vi.mock('framer-motion', () => ({
  motion: {
    section: ({ children, initial, animate, transition, ...props }: Record<string, unknown> & { children?: React.ReactNode }) =>
      React.createElement('section', props, children),
  },
}))

import { useCart } from '@/lib/cart'
import { CartAddOns } from './CartAddOns'
import { useCartProductFacts } from './useCartProductFacts'

/** The cart page reads the facts and hands them to the offer; so does this. */
function OnCartPage() {
  const { cart } = useCart()
  const facts = useCartProductFacts(cart?.items as Array<{ product_handle?: string | null }> | undefined)
  return <CartAddOns facts={facts} />
}

const priced = (handle: string, title: string, variant: string, zar: number) => ({
  handle,
  title,
  metadata: null,
  categories: [],
  variants: [{ id: `${handle}_v`, title: variant, metadata: null, prices: [{ currency_code: 'zar', amount: zar }] }],
})

const storeProducts = [
  {
    handle: 'transformation-coaching-60-mins',
    title: 'Transformation Coaching',
    metadata: null,
    categories: [{ handle: 'transformation-coaching' }],
    variants: [
      { id: 'tc_60', title: '60 min', metadata: null, prices: [] },
      { id: 'tc_p8', title: 'Package of 08', metadata: null, prices: [] },
    ],
  },
  {
    handle: 'akashic-navigator-level-1-live-via-zoom',
    title: 'Akashic Navigator Level 1',
    metadata: null,
    categories: [{ handle: 'akashic-live' }],
    variants: [
      { id: 'an1_live', title: 'Live via Zoom', metadata: null, prices: [] },
      { id: 'an1_self', title: 'Self Study', metadata: null, prices: [] },
    ],
  },
  {
    handle: 'akashic-navigator-level-2-live-via-zoom',
    title: 'Akashic Navigator Level 2',
    metadata: null,
    categories: [{ handle: 'akashic-live' }],
    variants: [
      { id: 'an2_live', title: 'Live via Zoom', metadata: null, prices: [] },
      { id: 'an2_self', title: 'Self Study', metadata: null, prices: [] },
    ],
  },
  priced('bonus-lifetime-access-self-study-online', 'Bonus Lifetime Access', 'Per programme level', 206000),
  priced('email-support', 'Email Support', 'Per month', 20000),
  priced('coaching-support-package', 'Coaching Support Package', 'Per session', 166000),
  priced('vip-package', 'VIP Package', 'Per month', 150000),
  priced('ravenall-institute-certification-observation-fee', 'Ravenall Institute Certification Observation Fee', 'Once-off', 280000),
]

const item = (handle: string, title: string, variant: string) => ({
  id: `line_${handle}`,
  title,
  product_handle: handle,
  variant_title: variant,
  subtitle: variant,
  quantity: 1,
})

beforeEach(() => {
  addItem.mockClear()
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ products: storeProducts }) })),
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('CartAddOns (Johan, 17 Nov)', () => {
  it('offers the coaching add-ons for a coaching package and adds nothing until the buyer clicks', async () => {
    cartState.cart = { currency_code: 'zar', items: [item('transformation-coaching-60-mins', 'Transformation Coaching', 'Package of 08')] }
    render(<OnCartPage />)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Goes with your order' })).toBeInTheDocument())
    expect(screen.getByText('Email Support')).toBeInTheDocument()
    expect(screen.getByText('Coaching Support Package')).toBeInTheDocument()
    expect(screen.getByText('VIP Package')).toBeInTheDocument()
    expect(screen.queryByText('Bonus Lifetime Access')).not.toBeInTheDocument()
    expect(screen.queryByText(/Observation Fee/)).not.toBeInTheDocument()
    expect(addItem).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Add VIP Package to your cart' }))
    expect(addItem).toHaveBeenCalledTimes(1)
    expect(addItem).toHaveBeenCalledWith('vip-package_v', 1)
  })

  it('does not offer an add-on that is already in the cart', async () => {
    cartState.cart = {
      currency_code: 'zar',
      items: [
        item('transformation-coaching-60-mins', 'Transformation Coaching', '60 min'),
        item('email-support', 'Email Support', 'Per month'),
      ],
    }
    render(<OnCartPage />)
    await waitFor(() => expect(screen.getByText('Coaching Support Package')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Add Email Support to your cart' })).not.toBeInTheDocument()
    expect(screen.queryByText('VIP Package')).not.toBeInTheDocument()
  })

  it('offers Lifetime Access again for a second programme level and adds the same variant, which Medusa merges into the line', async () => {
    cartState.cart = {
      currency_code: 'zar',
      items: [
        item('akashic-navigator-level-1-live-via-zoom', 'Akashic Navigator Level 1', 'Self Study'),
        item('akashic-navigator-level-2-live-via-zoom', 'Akashic Navigator Level 2', 'Live via Zoom'),
        item('bonus-lifetime-access-self-study-online', 'Bonus Lifetime Access', 'Per programme level'),
      ],
    }
    render(<OnCartPage />)
    await waitFor(() => expect(screen.getByText('Bonus Lifetime Access')).toBeInTheDocument())
    expect(screen.getByText(/Goes with Akashic Navigator Level 1, Akashic Navigator Level 2/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add Bonus Lifetime Access to your cart' }))
    expect(addItem).toHaveBeenCalledWith('bonus-lifetime-access-self-study-online_v', 1)
  })

  it('stops offering Lifetime Access once there is one per programme level', async () => {
    cartState.cart = {
      currency_code: 'zar',
      items: [
        item('akashic-navigator-level-1-live-via-zoom', 'Akashic Navigator Level 1', 'Self Study'),
        { ...item('bonus-lifetime-access-self-study-online', 'Bonus Lifetime Access', 'Per programme level'), quantity: 1 },
      ],
    }
    const { container } = render(<OnCartPage />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    await new Promise((r) => setTimeout(r, 0))
    expect(container).toBeEmptyDOMElement()
  })

  it('shows nothing when nothing in the cart has an add-on, or the store cannot be read', async () => {
    cartState.cart = { currency_code: 'zar', items: [item('the-latest-book-by-suzanne', 'The Latest Book', 'Pre-order')] }
    const { container, unmount } = render(<OnCartPage />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
    unmount()

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })))
    cartState.cart = { currency_code: 'zar', items: [item('transformation-coaching-60-mins', 'Transformation Coaching', '60 min')] }
    const second = render(<OnCartPage />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(second.container).toBeEmptyDOMElement()
  })
})
