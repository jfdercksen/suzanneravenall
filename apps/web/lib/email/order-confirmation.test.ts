import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted runs before module hoisting so the variable is available inside
// the vi.mock factory (which itself is hoisted to the top of the file).
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
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
    mockSend.mockResolvedValue({ data: { id: 'email_id_001' }, error: null })

    const id = await sendOrderConfirmationEmail({ order: baseOrder, invoiceUrl: null })

    expect(id).toBe('email_id_001')
  })

  it('subject line uses order display number', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_id_002' }, error: null })

    await sendOrderConfirmationEmail({ order: baseOrder, invoiceUrl: null })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Your transformation begins — Order #42',
      }),
    )
  })

  it('sends to the correct email address from order.email', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_id_003' }, error: null })

    await sendOrderConfirmationEmail({
      order: { ...baseOrder, email: 'other@example.com' },
      invoiceUrl: null,
    })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['other@example.com'] }),
    )
  })

  it('throws when Resend returns an error object', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'rate limited' } })

    await expect(
      sendOrderConfirmationEmail({ order: baseOrder, invoiceUrl: null }),
    ).rejects.toThrow('Resend error: rate limited')
  })

  it('throws when Resend returns null result and no error', async () => {
    mockSend.mockResolvedValue({ data: null, error: null })

    await expect(
      sendOrderConfirmationEmail({ order: baseOrder, invoiceUrl: null }),
    ).rejects.toThrow('Resend returned no result')
  })

  it('throws when Resend SDK rejects entirely', async () => {
    mockSend.mockRejectedValue(new Error('network failure'))

    await expect(
      sendOrderConfirmationEmail({ order: baseOrder, invoiceUrl: null }),
    ).rejects.toThrow('network failure')
  })

  it('passes the text field to resend.emails.send containing the order number', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_id_004' }, error: null })

    await sendOrderConfirmationEmail({ order: baseOrder, invoiceUrl: null })

    const callArg = mockSend.mock.calls[0][0] as Record<string, unknown>
    expect(callArg).toHaveProperty('text')
    expect(typeof callArg.text).toBe('string')
    expect(callArg.text as string).toContain('#42')
  })

  it('includes invoiceUrl in plain text when invoiceUrl is provided', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_id_005' }, error: null })
    const invoiceUrl = 'https://cdn.suzanneravenall.com/invoices/order_42.pdf'

    await sendOrderConfirmationEmail({ order: baseOrder, invoiceUrl })

    const callArg = mockSend.mock.calls[0][0] as Record<string, unknown>
    expect(callArg.text as string).toContain(invoiceUrl)
  })

  it('does not include invoice URL section in plain text when invoiceUrl is null', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_id_006' }, error: null })

    await sendOrderConfirmationEmail({ order: baseOrder, invoiceUrl: null })

    const callArg = mockSend.mock.calls[0][0] as Record<string, unknown>
    expect(callArg.text as string).not.toContain('YOUR TAX INVOICE')
    expect(callArg.text as string).not.toContain('Download:')
  })

  it('uses firstName in plain text when provided', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_id_007' }, error: null })

    await sendOrderConfirmationEmail({ order: { ...baseOrder, firstName: 'Alice' }, invoiceUrl: null })

    const callArg = mockSend.mock.calls[0][0] as Record<string, unknown>
    expect(callArg.text as string).toContain('Dear Alice,')
  })

  it('falls back to "valued customer" in plain text when firstName is null', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_id_008' }, error: null })

    await sendOrderConfirmationEmail({ order: { ...baseOrder, firstName: null }, invoiceUrl: null })

    const callArg = mockSend.mock.calls[0][0] as Record<string, unknown>
    expect(callArg.text as string).toContain('Dear valued customer,')
  })
})
