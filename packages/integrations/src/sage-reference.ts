/**
 * The invoice reference that ties one shop order to one Sage invoice
 * (Sage plan, 26 Nov 2026). It is the number on the customer's own PDF invoice
 * (apps/web/components/invoice/InvoiceDocument.tsx: `SR-` plus the order number,
 * five digits). Carla types it in the Sage invoice reference field when she
 * invoices by hand; the automatic Sage link looks it up and skips the order
 * when it is already there, so an order is never invoiced twice.
 */
export const SAGE_REFERENCE_PREFIX = 'SR-'

export function srInvoiceReference(displayId: number | string): string {
  const n = typeof displayId === 'number' ? displayId : Number(String(displayId).trim())
  if (!Number.isInteger(n) || n <= 0) throw new Error(`Not an order number: ${String(displayId)}`)
  return `${SAGE_REFERENCE_PREFIX}${String(n).padStart(5, '0')}`
}

/** The order number in an SR- reference, or null when the text is not one. */
export function parseSrInvoiceReference(reference: string | null | undefined): number | null {
  const m = /^SR-(\d{5,})$/.exec((reference ?? '').trim().toUpperCase())
  return m ? Number(m[1]) : null
}
