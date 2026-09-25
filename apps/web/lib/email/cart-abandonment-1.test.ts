import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted runs before module hoisting so the variable is available inside
// the vi.mock factory (which itself is hoisted to the top of the file).
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('./send', () => ({
  sendEmail: mockSend,
}))

vi.mock('./templates/CartAbandonment1', () => ({ default: () => null }))

import { sendCartAbandonmentEmail1 } from './cart-abandonment-1'
import type { CartEmailData } from './types'

const baseData: CartEmailData = {
  cartId: 'cart_abc123',
  email: 'shopper@example.com',
  firstName: 'Alice',
  items: [
    { id: 'item_1', title: 'Inner Circle Coaching', quantity: 1, unit_price: 9900 },
  ],
  total: 9900,
  currency: 'ZAR',
  cartUrl: 'https://suzanneravenall.com/checkout?cart=cart_abc123',
}

describe('sendCartAbandonmentEmail1', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Send functions now sign an unsubscribe link per recipient
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', 'test-unsubscribe-secret')
  })

  it('returns the emailId string on success', async () => {
    mockSend.mockResolvedValue('email_id_001')

    const id = await sendCartAbandonmentEmail1(baseData)

    expect(id).toBe('email_id_001')
  })

  it('includes the first name in the subject when firstName is provided', async () => {
    mockSend.mockResolvedValue('email_id_002')

    await sendCartAbandonmentEmail1(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'You left something behind, Alice',
        to: ['shopper@example.com'],
      }),
    )
  })

  it('uses generic subject when firstName is not provided', async () => {
    mockSend.mockResolvedValue('email_id_003')
    const dataWithoutName: CartEmailData = { ...baseData, firstName: undefined }

    await sendCartAbandonmentEmail1(dataWithoutName)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'You left something behind' }),
    )
  })

  it('propagates a provider error', async () => {
    mockSend.mockRejectedValue(new Error(`Brevo error: ${'rate limited'}`))

    await expect(sendCartAbandonmentEmail1(baseData)).rejects.toThrow('Brevo error: rate limited')
  })


  it('propagates a transport failure', async () => {
    mockSend.mockRejectedValue(new Error('network failure'))

    await expect(sendCartAbandonmentEmail1(baseData)).rejects.toThrow('network failure')
  })

  it('sends to the correct email address', async () => {
    mockSend.mockResolvedValue('email_id_004')

    await sendCartAbandonmentEmail1({ ...baseData, email: 'other@example.com' })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['other@example.com'] }),
    )
  })
})
