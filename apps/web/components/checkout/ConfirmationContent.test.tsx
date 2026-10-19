import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const clearCart = vi.fn()
let search = ''

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(search),
}))

vi.mock('@/lib/cart', () => ({
  useCart: () => ({ clearCart }),
}))

import ConfirmationContent from './ConfirmationContent'

const CART_ID = 'cart_01JABCDEFGHJKMNPQRSTVWXYZ0'

function stubStatus(status: number, body: unknown) {
  const fetchMock = vi.fn(async (input: string | URL) => {
    const url = input.toString()
    if (url.startsWith('/api/checkout/status')) {
      return { ok: status === 200, status, json: async () => body }
    }
    // /api/checkout/complete needs a signed-in user; a guest gets 401.
    if (url === '/api/checkout/complete') {
      return { ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }) }
    }
    throw new Error(`unexpected fetch call: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('ConfirmationContent', () => {
  beforeEach(() => {
    clearCart.mockReset()
    search = ''
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows "no order" and leaves the cart alone when the URL has no order', async () => {
    const fetchMock = stubStatus(200, { status: 'completed' })
    render(<ConfirmationContent />)

    expect(await screen.findByText('There is no order to show')).toBeInTheDocument()
    expect(screen.queryByText('Payment Received')).not.toBeInTheDocument()
    expect(clearCart).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not confirm a made-up PayFast reference', async () => {
    search = 'm_payment_id=fake'
    stubStatus(404, { status: 'not_found' })
    render(<ConfirmationContent />)

    expect(await screen.findByText('There is no order to show')).toBeInTheDocument()
    expect(clearCart).not.toHaveBeenCalled()
  })

  it('does not trust a free-order number without a confirmable cart', async () => {
    search = 'free=1&order=999'
    stubStatus(200, { status: 'completed' })
    render(<ConfirmationContent />)

    expect(await screen.findByText('There is no order to show')).toBeInTheDocument()
    expect(screen.queryByText(/Order #999/)).not.toBeInTheDocument()
    expect(clearCart).not.toHaveBeenCalled()
  })

  it('confirms a free order Medusa has completed and clears only that cart', async () => {
    search = `free=1&order=42&cartId=${CART_ID}`
    stubStatus(200, { status: 'completed' })
    render(<ConfirmationContent />)

    expect(await screen.findByText('Order Confirmed')).toBeInTheDocument()
    expect(screen.getByText(/Order #42 is confirmed/)).toBeInTheDocument()
    expect(clearCart).toHaveBeenCalledWith(CART_ID)
  })

  it('confirms a PayFast payment once the ITN has completed the cart', async () => {
    search = `gateway=payfast&m_payment_id=${CART_ID}`
    stubStatus(200, { status: 'completed' })
    render(<ConfirmationContent />)

    expect(await screen.findByText('Payment Received')).toBeInTheDocument()
    expect(clearCart).toHaveBeenCalledWith(CART_ID)
  })

  it('shows the order number, not the cart id, once Medusa returns it', async () => {
    search = `gateway=payfast&m_payment_id=${CART_ID}`
    stubStatus(200, { status: 'completed', orderNumber: 70 })
    render(<ConfirmationContent />)

    expect(await screen.findByText(/Order #70 is confirmed/)).toBeInTheDocument()
    expect(screen.getByText('#70')).toBeInTheDocument()
    expect(screen.queryByText(CART_ID)).not.toBeInTheDocument()
  })

  it('lists each line with its variant and gives the next steps for the product type (KI060, KI065)', async () => {
    search = `free=1&order=71&cartId=${CART_ID}`
    stubStatus(200, {
      status: 'completed',
      orderNumber: 71,
      items: [{ title: 'Resonance Repatterning Program 1', variant: 'Live via Zoom', quantity: 1, preorder: false }],
      productType: 'live-course',
    })
    render(<ConfirmationContent />)

    expect(await screen.findByText('Resonance Repatterning Program 1')).toBeInTheDocument()
    expect(screen.getByText(/\(Live via Zoom\)/)).toBeInTheDocument()
    expect(screen.getByText(/course access email.*Zoom details/)).toBeInTheDocument()
    expect(screen.queryByText(/If you bought a session/)).not.toBeInTheDocument()
  })

  it('says a pre-order ships later and promises no date (KI067)', async () => {
    search = `free=1&order=72&cartId=${CART_ID}`
    stubStatus(200, {
      status: 'completed',
      orderNumber: 72,
      items: [{ title: 'The Breakthrough Trilogy', variant: null, quantity: 1, preorder: true }],
      productType: 'other',
    })
    render(<ConfirmationContent />)

    expect(await screen.findByText(/has not been released yet/)).toBeInTheDocument()
    expect(screen.getByText(/ships when the book is released/)).toBeInTheDocument()
  })

  it('falls back to neutral next steps when the lines cannot be read', async () => {
    search = `free=1&order=73&cartId=${CART_ID}`
    stubStatus(200, { status: 'completed', orderNumber: 73 })
    render(<ConfirmationContent />)

    expect(await screen.findByText(/Your confirmation email has the details of your order/)).toBeInTheDocument()
    expect(screen.queryByText('Your order')).not.toBeInTheDocument()
  })

  it('keeps the cart and says so while a PayFast payment is unconfirmed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      search = `gateway=payfast&m_payment_id=${CART_ID}`
      stubStatus(200, { status: 'pending' })
      render(<ConfirmationContent />)

      await vi.advanceTimersByTimeAsync(15_000)
      await waitFor(() => {
        expect(screen.getByText('We are still waiting for your payment')).toBeInTheDocument()
      })
      expect(screen.queryByText('Payment Received')).not.toBeInTheDocument()
      expect(clearCart).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })
})
