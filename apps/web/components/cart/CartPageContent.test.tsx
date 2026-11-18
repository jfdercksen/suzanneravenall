import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CartPageContent from './CartPageContent'

const cartState: { cart: unknown; isLoading: boolean } = { cart: null, isLoading: true }
const updateItem = vi.fn()

vi.mock('@/lib/cart', () => ({
  useCart: () => ({ droppedOnSwitch: [], ...cartState, updateItem, removeItem: vi.fn(), addItem: vi.fn() }),
  formatPrice: (n: number) => `R${(n / 100).toFixed(2)}`,
}))
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}))
vi.mock('framer-motion', () => {
  const strip = (tag: string) =>
    function MotionStub({
      children,
      initial,
      animate,
      transition,
      variants,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) {
      return React.createElement(tag, props, children)
    }
  return { motion: { div: strip('div'), ul: strip('ul'), li: strip('li'), section: strip('section') } }
})

describe('CartPageContent loading state (KI064)', () => {
  it('shows the page title and a loading line while the cart is being fetched', () => {
    cartState.isLoading = true
    render(<CartPageContent />)
    expect(screen.getByRole('heading', { level: 1, name: 'Your Cart' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Loading your cart...')
    expect(screen.queryByText(/your cart is empty/i)).not.toBeInTheDocument()
  })

  it('renders the same loading state in the server HTML', async () => {
    cartState.isLoading = true
    const { renderToString } = await import('react-dom/server')
    const html = renderToString(<CartPageContent />)
    expect(html).toContain('Your Cart')
    expect(html).toContain('Loading your cart...')
  })

  it('shows the empty state once loading has finished with no cart', () => {
    cartState.isLoading = false
    cartState.cart = null
    render(<CartPageContent />)
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('Bonus Lifetime Access quantity, one per programme level (Johan, 18 Nov)', () => {
  const programme = (n: number) => ({
    handle: `akashic-navigator-level-${n}-live-via-zoom`,
    title: `Akashic Navigator Level ${n}`,
    metadata: null,
    categories: [{ handle: 'akashic-live' }],
    variants: [
      { id: `an${n}_live`, title: 'Live via Zoom', metadata: null, prices: [] },
      { id: `an${n}_self`, title: 'Self Study', metadata: null, prices: [] },
    ],
  })
  const line = (id: string, handle: string, title: string, variant: string, quantity = 1) => ({
    id,
    title,
    product_handle: handle,
    variant_title: variant,
    subtitle: variant,
    quantity,
    unit_price: 206000,
    subtotal: 206000 * quantity,
    thumbnail: null,
  })
  const cartWith = (items: unknown[]) => ({
    id: 'cart_1',
    currency_code: 'zar',
    items,
    subtotal: 0,
    discount_total: 0,
    shipping_total: 0,
    tax_total: 0,
    total: 0,
    promotions: [],
  })
  const lifetime = (quantity: number) =>
    line('li_life', 'bonus-lifetime-access-self-study-online', 'Bonus Lifetime Access', 'Per programme level', quantity)

  afterEach(() => {
    vi.unstubAllGlobals()
    updateItem.mockClear()
  })

  function stubStore(products: unknown[]) {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ products }) })))
  }

  it('lets the buyer raise it up to one per qualifying programme, and no further', async () => {
    stubStore([programme(1), programme(2)])
    cartState.isLoading = false
    cartState.cart = cartWith([
      line('li_1', 'akashic-navigator-level-1-live-via-zoom', 'Akashic Navigator Level 1', 'Self Study'),
      line('li_2', 'akashic-navigator-level-2-live-via-zoom', 'Akashic Navigator Level 2', 'Live via Zoom'),
      lifetime(1),
    ])
    const { unmount } = render(<CartPageContent />)
    const increase = await screen.findByRole('button', { name: 'Increase quantity' })
    await waitFor(() => expect(increase).toBeEnabled())
    await userEvent.click(increase)
    expect(updateItem).toHaveBeenCalledWith('li_life', 2)
    unmount()

    cartState.cart = cartWith([
      line('li_1', 'akashic-navigator-level-1-live-via-zoom', 'Akashic Navigator Level 1', 'Self Study'),
      line('li_2', 'akashic-navigator-level-2-live-via-zoom', 'Akashic Navigator Level 2', 'Live via Zoom'),
      lifetime(2),
    ])
    render(<CartPageContent />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(await screen.findByRole('button', { name: 'Increase quantity' })).toBeDisabled()
    expect(screen.queryByText(/you may want to lower this/)).not.toBeInTheDocument()
  })

  it('keeps one per order for Lifetime Access when no programme in the cart sells self-study', async () => {
    stubStore([])
    cartState.isLoading = false
    cartState.cart = cartWith([lifetime(1)])
    render(<CartPageContent />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(screen.getByText('Qty 1')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Increase quantity' })).not.toBeInTheDocument()
  })

  it('shows a quantity above the cap with a note, and leaves the cart as it is', async () => {
    stubStore([programme(1)])
    cartState.isLoading = false
    cartState.cart = cartWith([
      line('li_1', 'akashic-navigator-level-1-live-via-zoom', 'Akashic Navigator Level 1', 'Self Study'),
      lifetime(2),
    ])
    render(<CartPageContent />)
    expect(await screen.findByText(/you may want to lower this to 1/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeEnabled()
    expect(updateItem).not.toHaveBeenCalled()
  })
})
