import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}))

vi.mock('./templates/CartAbandonment3', () => ({ default: () => null }))

import { sendCartAbandonmentEmail3 } from './cart-abandonment-3'
import type { CartEmailData } from './types'

const baseData: CartEmailData = {
  cartId: 'cart_ghi789',
  email: 'shopper@example.com',
  firstName: 'Carol',
  items: [
    { id: 'item_3', title: 'Mindset Mastery', quantity: 2, unit_price: 3200 },
  ],
  total: 6400,
  currency: 'ZAR',
  cartUrl: 'https://suzanneravenall.com/checkout?cart=cart_ghi789',
}

describe('sendCartAbandonmentEmail3', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the emailId string on success', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_id_020' }, error: null })

    const id = await sendCartAbandonmentEmail3(baseData)

    expect(id).toBe('email_id_020')
  })

  it('always uses the fixed subject line', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_id_021' }, error: null })

    await sendCartAbandonmentEmail3(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Last chance to secure your place',
        to: ['shopper@example.com'],
      }),
    )
  })

  it('throws when Resend returns an error object', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'domain not verified' } })

    await expect(sendCartAbandonmentEmail3(baseData)).rejects.toThrow(
      'Resend error: domain not verified',
    )
  })

  it('throws when Resend returns null result and no error', async () => {
    mockSend.mockResolvedValue({ data: null, error: null })

    await expect(sendCartAbandonmentEmail3(baseData)).rejects.toThrow('Resend returned no result')
  })

  it('throws when the Resend SDK itself rejects', async () => {
    mockSend.mockRejectedValue(new Error('upstream 503'))

    await expect(sendCartAbandonmentEmail3(baseData)).rejects.toThrow('upstream 503')
  })

  it('sends to the correct email address', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_id_022' }, error: null })

    await sendCartAbandonmentEmail3({ ...baseData, email: 'third@example.com' })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['third@example.com'] }),
    )
  })
})
