/**
 * Business checkout details on a Medusa order (Shayna, 22 Oct 2026). The web
 * checkout writes them to cart metadata and the billing address `company`
 * (apps/web/lib/checkout/business.ts); Medusa copies both onto the order.
 * The key names here must match that file.
 */

export const BUSINESS_META_KEYS = {
  companyName: 'business_company_name',
  vatNumber: 'business_vat_number',
  registrationNumber: 'business_registration_number',
} as const

export type OrderBusiness = {
  companyName: string
  vatNumber: string | null
  registrationNumber: string | null
}

// Same caps as the checkout; whitespace and line breaks collapse to one space
// for the one-line Vtiger description.
function str(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const s = v.replace(/\s+/g, ' ').trim().slice(0, max)
  return s === '' ? null : s
}

/** The company the order is billed to, or null for a personal purchase. */
export function orderBusiness(order: {
  metadata?: Record<string, unknown> | null
  billing_address?: { company?: string | null } | null
}): OrderBusiness | null {
  const meta = order.metadata ?? {}
  const companyName = str(meta[BUSINESS_META_KEYS.companyName], 120) ?? str(order.billing_address?.company, 120)
  if (!companyName) return null
  return {
    companyName,
    vatNumber: str(meta[BUSINESS_META_KEYS.vatNumber], 20),
    registrationNumber: str(meta[BUSINESS_META_KEYS.registrationNumber], 30),
  }
}
