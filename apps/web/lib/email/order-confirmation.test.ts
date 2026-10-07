import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted runs before module hoisting so the variable is available inside
// the vi.mock factory (which itself is hoisted to the top of the file).
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('./send', () => ({
  sendEmail: mockSend,
}))

vi.mock('../../emails/OrderConfirmation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../emails/OrderConfirmation')>()),
  default: () => null,
}))

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

  it('attaches the invoice PDF and says so instead of linking', async () => {
    mockSend.mockResolvedValue('email_id_009')
    const pdf = Buffer.from('%PDF-1.4')

    await sendOrderConfirmationEmail({
      order: baseOrder,
      invoiceUrl: 'https://db.example.test/sign/order_42.pdf?token=x',
      invoicePdf: pdf,
    })

    const callArg = mockSend.mock.calls[0]![0] as {
      text: string
      attachments: Array<{ filename: string; content: Buffer }>
      react: { props: Record<string, unknown> }
    }
    expect(callArg.attachments).toEqual([{ filename: 'invoice-42.pdf', content: pdf }])
    expect(callArg.text).toContain('Your invoice is attached to this email as a PDF (invoice-42.pdf).')
    expect(callArg.text).toContain('Keep it for your records.')
    // The signed link expires after 7 days, so it is not offered next to the attachment.
    expect(callArg.text).not.toContain('Download:')
    expect(callArg.react.props.invoiceUrl).toBeNull()
    expect(callArg.react.props.invoiceAttachmentName).toBe('invoice-42.pdf')
  })

  it('says how long the fallback link lasts when the PDF is not attached', async () => {
    mockSend.mockResolvedValue('email_id_010')

    await sendOrderConfirmationEmail({ order: baseOrder, invoiceUrl: 'https://x.test/i.pdf', invoicePdf: null })

    const callArg = mockSend.mock.calls[0]![0] as { text: string; attachments?: unknown }
    expect(callArg.attachments).toBeUndefined()
    expect(callArg.text).toContain('This download link works for 7 days. Save a copy of the PDF for your records.')
    expect(callArg.text).not.toContain('Keep this invoice for your records.')
  })

  it('offers a copy on request when there is neither a PDF nor a link', async () => {
    mockSend.mockResolvedValue('email_id_011')

    await sendOrderConfirmationEmail({ order: baseOrder, invoiceUrl: null })

    const callArg = mockSend.mock.calls[0]![0] as { text: string }
    expect(callArg.text).toContain('If you need a copy of your invoice, reply to this email and we will send it to you.')
    expect(callArg.text).not.toMatch(/\u2014/)
  })

  it('plain text gives course-access steps, not the portal or a booking, for a course order', async () => {
    mockSend.mockResolvedValue('email_id_course')
    await sendOrderConfirmationEmail({ order: { ...baseOrder, productType: 'self-paced' }, invoiceUrl: null })
    const text = (mockSend.mock.calls.at(-1)![0] as { text: string }).text
    expect(text).toContain('course access email from Ravenall Institute')
    expect(text).not.toContain('member portal account')
    expect(text).not.toContain('BOOK YOUR SESSION')
  })
})
