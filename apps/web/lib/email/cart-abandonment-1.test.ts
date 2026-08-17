import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted runs before module hoisting so the variable is available inside
// the vi.mock factory (which itself is hoisted to the top of the file).
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
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
    mockSend.mockResolvedValue({ data: { id: 'email_id_001' }, error: null })

    const id = await sendCartAbandonmentEmail1(baseData)

    expect(id).toBe('email_id_001')
  })

  it('includes the first name in the subject when firstName is provided', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_id_002' }, error: null })

    await sendCartAbandonmentEmail1(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'You left something behind, Alice',
        to: ['shopper@example.com'],
      }),
    )
  })

  it('uses generic subject when firstName is not provided', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_id_003' }, error: null })
    const dataWithoutName: CartEmailData = { ...baseData, firstName: undefined }

    await sendCartAbandonmentEmail1(dataWithoutName)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'You left something behind' }),
    )
  })

  it('throws when Resend returns an error object', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'rate limited' } })

    await expect(sendCartAbandonmentEmail1(baseData)).rejects.toThrow('Resend error: rate limited')
  })

  it('throws when Resend returns null result and no error', async () => {
    mockSend.mockResolvedValue({ data: null, error: null })

    await expect(sendCartAbandonmentEmail1(baseData)).rejects.toThrow('Resend returned no result')
  })

  it('throws when the Resend SDK itself rejects', async () => {
    mockSend.mockRejectedValue(new Error('network failure'))

    await expect(sendCartAbandonmentEmail1(baseData)).rejects.toThrow('network failure')
  })

  it('sends to the correct email address', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_id_004' }, error: null })

    await sendCartAbandonmentEmail1({ ...baseData, email: 'other@example.com' })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['other@example.com'] }),
    )
  })
})
