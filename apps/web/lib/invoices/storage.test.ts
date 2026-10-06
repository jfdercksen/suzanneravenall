import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  client: null as unknown,
  download: vi.fn(),
  from: vi.fn(),
}))

vi.mock('@/lib/quiz/subscriber', () => ({ getServiceRoleClient: () => h.client }))

import { downloadInvoicePdf, invoicePath } from './storage'

function blob(text: string) {
  return { arrayBuffer: async () => new TextEncoder().encode(text).buffer }
}

describe('downloadInvoicePdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.from.mockReturnValue({ download: h.download })
    h.client = { storage: { from: h.from } }
  })

  it('reads <orderId>.pdf from the invoices bucket', async () => {
    h.download.mockResolvedValue({ data: blob('%PDF-1.4'), error: null })

    const result = await downloadInvoicePdf('order_01ABC')

    expect(h.from).toHaveBeenCalledWith('invoices')
    expect(h.download).toHaveBeenCalledWith('order_01ABC.pdf')
    expect(result.pdf?.toString()).toBe('%PDF-1.4')
    expect(invoicePath('order_1')).toBe('order_1.pdf')
  })

  it('returns a reason when the file is not there yet', async () => {
    h.download.mockResolvedValue({ data: null, error: { message: 'Object not found' } })

    const result = await downloadInvoicePdf('order_1')

    expect(result).toEqual({ pdf: null, reason: 'Object not found' })
  })

  it('returns a reason for an empty file', async () => {
    h.download.mockResolvedValue({ data: blob(''), error: null })

    expect(await downloadInvoicePdf('order_1')).toEqual({ pdf: null, reason: 'invoice file is empty' })
  })

  it('returns a reason when Supabase is not configured', async () => {
    h.client = null

    const result = await downloadInvoicePdf('order_1')

    expect(result.pdf).toBeNull()
    expect(result.reason).toMatch(/not configured/)
  })

  it('never throws on a storage exception', async () => {
    h.download.mockRejectedValue(new Error('ECONNRESET'))

    expect(await downloadInvoicePdf('order_1')).toEqual({ pdf: null, reason: 'ECONNRESET' })
  })

  it('refuses an order id that is not a plain id (no path tricks)', async () => {
    const result = await downloadInvoicePdf('../secrets')

    expect(result).toEqual({ pdf: null, reason: 'invalid order id' })
    expect(h.download).not.toHaveBeenCalled()
  })
})
