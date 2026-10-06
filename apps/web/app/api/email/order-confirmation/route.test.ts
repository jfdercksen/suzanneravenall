import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const h = vi.hoisted(() => ({
  send: vi.fn(),
  download: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}))

vi.mock('@/lib/email/order-confirmation', () => ({ sendOrderConfirmationEmail: h.send }))
vi.mock('@/lib/invoices/storage', () => ({ downloadInvoicePdf: h.download }))
vi.mock('@/lib/log', () => ({ logError: h.logError, logWarn: h.logWarn }))

import { POST } from './route'

const SECRET = 'test-secret'
const INVOICE_URL = 'https://db.example.test/storage/v1/object/sign/invoices/order_1.pdf?token=abc'

const medusaOrder = {
  id: 'order_1',
  display_id: 42,
  created_at: '2026-10-06T08:00:00.000Z',
  currency_code: 'zar',
  customer: { first_name: 'Alice', email: 'alice@example.com' },
  items: [{ id: 'i1', title: 'Inner Circle Coaching', quantity: 1, unit_price: 9900 }],
  subtotal: 9900,
  tax_total: 0,
  total: 9900,
}

function makeRequest(body: unknown, secret = SECRET) {
  return new Request('http://localhost/api/email/order-confirmation', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-webhook-secret': secret },
    body: JSON.stringify(body),
  })
}

describe('POST /api/email/order-confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('N8N_WEBHOOK_SECRET', SECRET)
    vi.stubEnv('MEDUSA_API_TOKEN', 'sk_test')
    vi.stubEnv('MEDUSA_BACKEND_URL', 'http://medusa.test')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ order: medusaOrder }), { status: 200 }))
    )
    h.send.mockResolvedValue('msg-1')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('rejects a wrong webhook secret', async () => {
    const res = await POST(makeRequest({ orderId: 'order_1' }, 'nope') as never)
    expect(res.status).toBe(401)
    expect(h.send).not.toHaveBeenCalled()
  })

  it('attaches the stored invoice PDF when it is available', async () => {
    const pdf = Buffer.from('%PDF-1.4')
    h.download.mockResolvedValue({ pdf })

    const res = await POST(makeRequest({ orderId: 'order_1', invoiceUrl: INVOICE_URL }) as never)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ emailId: 'msg-1' })
    expect(h.download).toHaveBeenCalledWith('order_1')
    const arg = h.send.mock.calls[0]![0]
    expect(arg.invoicePdf).toBe(pdf)
    expect(arg.invoiceUrl).toBe(INVOICE_URL)
    expect(arg.order).toMatchObject({ displayId: 42, email: 'alice@example.com', firstName: 'Alice' })
    expect(h.logWarn).not.toHaveBeenCalled()
  })

  it('falls back to the link and logs it when the PDF is not ready', async () => {
    h.download.mockResolvedValue({ pdf: null, reason: 'Object not found' })

    const res = await POST(makeRequest({ orderId: 'order_1', invoiceUrl: INVOICE_URL }) as never)

    expect(res.status).toBe(200)
    const arg = h.send.mock.calls[0]![0]
    expect(arg.invoicePdf).toBeNull()
    expect(arg.invoiceUrl).toBe(INVOICE_URL)
    expect(h.logWarn).toHaveBeenCalledWith(
      expect.stringContaining('invoice PDF not attached for order_1: Object not found; sending the download link instead'),
      undefined,
      { orderId: 'order_1', hasInvoiceUrl: true }
    )
  })

  it('still sends the email when there is neither a PDF nor a link', async () => {
    h.download.mockResolvedValue({ pdf: null, reason: 'Object not found' })

    const res = await POST(makeRequest({ orderId: 'order_1' }) as never)

    expect(res.status).toBe(200)
    const arg = h.send.mock.calls[0]![0]
    expect(arg.invoicePdf).toBeNull()
    expect(arg.invoiceUrl).toBeNull()
    expect(h.logWarn.mock.calls[0]![0]).toContain('no invoice link either')
  })

  it('returns 500 when the send fails', async () => {
    h.download.mockResolvedValue({ pdf: Buffer.from('%PDF') })
    h.send.mockRejectedValue(new Error('Brevo error: bad attachment'))

    const res = await POST(makeRequest({ orderId: 'order_1' }) as never)

    expect(res.status).toBe(500)
    expect(h.logError).toHaveBeenCalled()
  })
})
