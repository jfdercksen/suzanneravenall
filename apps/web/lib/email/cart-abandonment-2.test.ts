import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}))

vi.mock('./templates/CartAbandonment2', () => ({ default: () => null }))

import { sendCartAbandonmentEmail2 } from './cart-abandonment-2'
import type { CartEmailData } from './types'

const baseData: CartEmailData = {
  cartId: 'cart_def456',
  email: 'shopper@example.com',
  firstName: 'Bob',
  items: [
    { id: 'item_2', title: 'Clarity Intensive', quantity: 1, unit_price: 4500 },
  ],
  total: 4500,
  currency: 'ZAR',
  cartUrl: 'https://suzanneravenall.com/checkout?cart=cart_def456',
}

describe('sendCartAbandonmentEmail2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Send functions now sign an unsubscribe link per recipient
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', 'test-unsubscribe-secret')
  })

  it('returns the emailId string on success', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_id_010' }, error: null })

    const id = await sendCartAbandonmentEmail2(baseData)

    expect(id).toBe('email_id_010')
  })

  it('always uses the fixed subject line', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_id_011' }, error: null })

    await sendCartAbandonmentEmail2(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Your transformation is one step away',
        to: ['shopper@example.com'],
      }),
    )
  })

  it('throws when Resend returns an error object', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'invalid api key' } })

    await expect(sendCartAbandonmentEmail2(baseData)).rejects.toThrow(
      'Resend error: invalid api key',
    )
  })

  it('throws when Resend returns null result and no error', async () => {
    mockSend.mockResolvedValue({ data: null, error: null })

    await expect(sendCartAbandonmentEmail2(baseData)).rejects.toThrow('Resend returned no result')
  })

  it('throws when the Resend SDK itself rejects', async () => {
    mockSend.mockRejectedValue(new Error('connection timeout'))

    await expect(sendCartAbandonmentEmail2(baseData)).rejects.toThrow('connection timeout')
  })

  it('sends to the correct email address', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_id_012' }, error: null })

    await sendCartAbandonmentEmail2({ ...baseData, email: 'another@example.com' })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['another@example.com'] }),
    )
  })
})
