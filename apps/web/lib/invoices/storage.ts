import { getServiceRoleClient } from '@/lib/quiz/subscriber'

/**
 * Reads a stored invoice PDF back out of the private Supabase "invoices"
 * bucket, written by POST /api/invoices/generate as `<orderId>.pdf`.
 *
 * Used by the order confirmation email to attach the PDF, because the signed
 * link that route returns expires after 7 days and there is no portal page
 * that lists invoices.
 *
 * Never throws: a missing file, a missing Supabase config or a storage error
 * all come back as { pdf: null, reason } so the caller can fall back to the
 * link and log why.
 */

export const INVOICES_BUCKET = 'invoices'

const ORDER_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/

export type InvoicePdfResult = { pdf: Buffer; reason?: undefined } | { pdf: null; reason: string }

export function invoicePath(orderId: string): string {
  return `${orderId}.pdf`
}

export async function downloadInvoicePdf(orderId: string): Promise<InvoicePdfResult> {
  if (!ORDER_ID_RE.test(orderId)) return { pdf: null, reason: 'invalid order id' }

  const supabase = getServiceRoleClient()
  if (!supabase) return { pdf: null, reason: 'Supabase service role is not configured' }

  try {
    const { data, error } = await supabase.storage.from(INVOICES_BUCKET).download(invoicePath(orderId))
    if (error || !data) {
      return { pdf: null, reason: error?.message || 'invoice file not found' }
    }
    const pdf = Buffer.from(await data.arrayBuffer())
    if (pdf.length === 0) return { pdf: null, reason: 'invoice file is empty' }
    return { pdf }
  } catch (err) {
    return { pdf: null, reason: err instanceof Error ? err.message : String(err) }
  }
}
