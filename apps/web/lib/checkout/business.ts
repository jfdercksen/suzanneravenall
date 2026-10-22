/**
 * Business checkout (Shayna, 22 Oct 2026): a buyer may buy as a company and
 * have the company, its VAT number and registration number on the invoice.
 *
 * Where it is stored: the company name on the cart's billing address
 * (`company`, a Medusa address field) and all four values in cart metadata.
 * Medusa copies both onto the order when the cart completes, so the PayFast,
 * PayPal and voucher (/api/checkout/free) paths all carry it without any
 * change to those routes. The Medusa side reads the same keys in
 * packages/integrations/src/business.ts (Vtiger); keep the two in step.
 */

export const BUSINESS_META_KEYS = {
  companyName: 'business_company_name',
  vatNumber: 'business_vat_number',
  registrationNumber: 'business_registration_number',
  address: 'business_address',
} as const

export interface BusinessDetails {
  companyName: string
  vatNumber: string
  registrationNumber: string
  address: string
}

export interface BusinessErrors {
  companyName?: string
  vatNumber?: string
  registrationNumber?: string
  address?: string
}

export const EMPTY_BUSINESS: BusinessDetails = {
  companyName: '',
  vatNumber: '',
  registrationNumber: '',
  address: '',
}

const MAX = { companyName: 120, vatNumber: 20, registrationNumber: 30, address: 300 }

/** Spaces, dots, dashes and slashes are how people type these numbers; none is part of it. */
export function compactNumber(value: string): string {
  return value.replace(/[\s.\-/]/g, '').toUpperCase()
}

/**
 * A South African VAT number is 10 digits starting with 4. A buyer outside
 * South Africa has their own country's format, so for them only the shape is
 * checked (letters and digits, 4 to 20).
 */
export function vatNumberError(value: string, country: 'ZA' | 'INTL'): string | undefined {
  const v = compactNumber(value)
  if (!v) return undefined
  if (country === 'ZA') {
    return /^4\d{9}$/.test(v) ? undefined : 'A South African VAT number is 10 digits and starts with 4'
  }
  return /^[A-Z0-9]{4,20}$/.test(v) ? undefined : 'Please enter a valid VAT number'
}

export function validateBusiness(form: BusinessDetails, country: 'ZA' | 'INTL'): BusinessErrors {
  const errors: BusinessErrors = {}
  const name = form.companyName.trim()
  if (!name) errors.companyName = 'Company name is required'
  else if (name.length > MAX.companyName) errors.companyName = 'Company name is too long'
  const vat = vatNumberError(form.vatNumber, country)
  if (vat) errors.vatNumber = vat
  if (form.registrationNumber.trim().length > MAX.registrationNumber) {
    errors.registrationNumber = 'Registration number is too long'
  }
  if (form.address.trim().length > MAX.address) errors.address = 'Address is too long'
  return errors
}

/** Trimmed copy for storage: VAT number without spaces, registration number as typed. */
export function normaliseBusiness(form: BusinessDetails): BusinessDetails {
  return {
    companyName: form.companyName.trim(),
    vatNumber: compactNumber(form.vatNumber),
    registrationNumber: form.registrationNumber.trim().replace(/\s+/g, ' '),
    address: form.address.trim().replace(/\r\n/g, '\n'),
  }
}

/**
 * The cart metadata for these details. With null (a personal checkout, or the
 * toggle switched off again) every key is written empty, so details typed and
 * then withdrawn never reach the order: Medusa merges cart metadata and an
 * empty value deletes the key (and reads as absent below).
 */
export function businessMetadata(details: BusinessDetails | null): Record<string, string> {
  const d = details ? normaliseBusiness(details) : EMPTY_BUSINESS
  return {
    [BUSINESS_META_KEYS.companyName]: d.companyName,
    [BUSINESS_META_KEYS.vatNumber]: d.vatNumber,
    [BUSINESS_META_KEYS.registrationNumber]: d.registrationNumber,
    [BUSINESS_META_KEYS.address]: d.address,
  }
}

export interface OrderBusiness {
  companyName: string
  vatNumber: string | null
  registrationNumber: string | null
  address: string | null
}

// The store API takes any metadata, so the caps are applied again on read:
// an oversized value must not break the invoice layout.
function str(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim().slice(0, max) : null
}

function addressLines(v: unknown): string | null {
  const a = str(v, MAX.address)
  return a ? a.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 6).join('\n') || null : null
}

/**
 * The business details on an order (or cart), or null for a personal purchase.
 * The company name falls back to the billing address `company` field, which
 * the checkout fills too.
 */
export function readOrderBusiness(order: {
  metadata?: Record<string, unknown> | null
  billing_address?: { company?: string | null } | null
}): OrderBusiness | null {
  const meta = order.metadata ?? {}
  const companyName =
    str(meta[BUSINESS_META_KEYS.companyName], MAX.companyName) ?? str(order.billing_address?.company, MAX.companyName)
  if (!companyName) return null
  return {
    companyName,
    vatNumber: str(meta[BUSINESS_META_KEYS.vatNumber], MAX.vatNumber),
    registrationNumber: str(meta[BUSINESS_META_KEYS.registrationNumber], MAX.registrationNumber),
    address: addressLines(meta[BUSINESS_META_KEYS.address]),
  }
}
