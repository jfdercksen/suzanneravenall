import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('./send', () => ({
  sendEmail: mockSend,
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
    // Send functions now sign an unsubscribe link per recipient
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', 'test-unsubscribe-secret')
  })

  it('returns the emailId string on success', async () => {
    mockSend.mockResolvedValue('email_id_020')

    const id = await sendCartAbandonmentEmail3(baseData)

    expect(id).toBe('email_id_020')
  })

  it('always uses the fixed subject line', async () => {
    mockSend.mockResolvedValue('email_id_021')

    await sendCartAbandonmentEmail3(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Last chance to secure your place',
        to: ['shopper@example.com'],
      }),
    )
  })

  it('propagates a provider error', async () => {
    mockSend.mockRejectedValue(new Error(`Brevo error: ${'domain not verified'}`))

    await expect(sendCartAbandonmentEmail3(baseData)).rejects.toThrow(
      'Brevo error: domain not verified',
    )
  })


  it('propagates a transport failure', async () => {
    mockSend.mockRejectedValue(new Error('upstream 503'))

    await expect(sendCartAbandonmentEmail3(baseData)).rejects.toThrow('upstream 503')
  })

  it('sends to the correct email address', async () => {
    mockSend.mockResolvedValue('email_id_022')

    await sendCartAbandonmentEmail3({ ...baseData, email: 'third@example.com' })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['third@example.com'] }),
    )
  })
})
