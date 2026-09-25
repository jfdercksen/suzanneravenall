import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted runs before module hoisting so the variable is available inside
// the vi.mock factory (which itself is hoisted to the top of the file).
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('./send', () => ({
  sendEmail: mockSend,
}))

vi.mock('../../emails/OrderConfirmation', () => ({ default: () => null }))

import { sendOrderConfirmationEmail } from './order-confirmation'
import type { OrderEmailData } from './types'

const baseOrder: OrderEmailData = {
  id: 'order_abc123',
  displayId: 42,
  createdAt: '2026-01-15T10:00:00.000Z',
  currency: 'ZAR',
  firstName: 'Alice',
  email: 'alice@example.com',
  items: [
    {
      id: 'item_1',
      title: 'Inner Circle Coaching',
      variantTitle: '6 Month',
      quantity: 1,
      unitPrice: 250000,
    },
  ],
  subtotal: 250000,
  taxTotal: 32609,
  total: 282609,
}

describe('sendOrderConfirmationEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the emailId string on success', async () => {
    mockSend.mockResolvedValue('email_id_001')

    const id = await sendOrderConfirmationEmail({ order: baseOrder, invoiceUrl: null })

    expect(id).toBe('email_id_001')
  })

  it('subject line uses order display number', async () => {
    mockSend.mockResolvedValue('email_id_002')

    await sendOrderConfirmationEmail({ order: baseOrder, invoiceUrl: null })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Your transformation begins - Order #42',
      }),
    )
  })

  it('sends to the correct email address from order.email', async () => {
    mockSend.mockResolvedValue('email_id_003')

    await sendOrderConfirmationEmail({
      order: { ...baseOrder, email: 'other@example.com' },
      invoiceUrl: null,
    })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['other@example.com'] }),
    )
  })

  it('propagates a provider error', async () => {
    mockSend.mockRejectedValue(new Error(`Brevo error: ${'rate limited'}`))

    await expect(
      sendOrderConfirmationEmail({ order: baseOrder, invoiceUrl: null }),
    ).rejects.toThrow('Brevo error: rate limited')
  })


  it('propagates a transport failure', async () => {
    mockSend.mockRejectedValue(new Error('network failure'))

    await expect(
      sendOrderConfirmationEmail({ order: baseOrder, invoiceUrl: null }),
    ).rejects.toThrow('network failure')
  })

  it('passes a plain-text body containing the order number', async () => {
    mockSend.mockResolvedValue('email_id_004')

    await sendOrderConfirmationEmail({ order: baseOrder, invoiceUrl: null })

    // The `await` above guarantees sendOrderConfirmationEmail called mockSend - calls[0] exists
    const callArg = mockSend.mock.calls[0]![0] as Record<string, unknown>
    expect(callArg).toHaveProperty('text')
    expect(typeof callArg.text).toBe('string')
    expect(callArg.text as string).toContain('#42')
  })

  it('includes invoiceUrl in plain text when invoiceUrl is provided', async () => {
    mockSend.mockResolvedValue('email_id_005')
    const invoiceUrl = 'https://cdn.suzanneravenall.com/invoices/order_42.pdf'

    await sendOrderConfirmationEmail({ order: baseOrder, invoiceUrl })

    // The `await` above guarantees sendOrderConfirmationEmail called mockSend - calls[0] exists
    const callArg = mockSend.mock.calls[0]![0] as Record<string, unknown>
    expect(callArg.text as string).toContain(invoiceUrl)
  })

  it('does not include invoice URL section in plain text when invoiceUrl is null', async () => {
    mockSend.mockResolvedValue('email_id_006')

    await sendOrderConfirmationEmail({ order: baseOrder, invoiceUrl: null })

    // The `await` above guarantees sendOrderConfirmationEmail called mockSend - calls[0] exists
    const callArg = mockSend.mock.calls[0]![0] as Record<string, unknown>
    expect(callArg.text as string).not.toContain('YOUR TAX INVOICE')
    expect(callArg.text as string).not.toContain('Download:')
  })

  it('uses firstName in plain text when provided', async () => {
    mockSend.mockResolvedValue('email_id_007')

    await sendOrderConfirmationEmail({ order: { ...baseOrder, firstName: 'Alice' }, invoiceUrl: null })

    // The `await` above guarantees sendOrderConfirmationEmail called mockSend - calls[0] exists
    const callArg = mockSend.mock.calls[0]![0] as Record<string, unknown>
    expect(callArg.text as string).toContain('Dear Alice,')
  })

  it('falls back to "valued customer" in plain text when firstName is null', async () => {
    mockSend.mockResolvedValue('email_id_008')

    await sendOrderConfirmationEmail({ order: { ...baseOrder, firstName: null }, invoiceUrl: null })

    // The `await` above guarantees sendOrderConfirmationEmail called mockSend - calls[0] exists
    const callArg = mockSend.mock.calls[0]![0] as Record<string, unknown>
    expect(callArg.text as string).toContain('Dear valued customer,')
  })
})
