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
