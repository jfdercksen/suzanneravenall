/**
 * Company identity values shown in email footers and on the PDF invoice.
 *
 * Confirmed real values (public company identity, safe as hardcoded defaults):
 *   - Physical address: 8 Oxmoor Street, Kyalami Estates, Gauteng, South Africa
 *   - Company registration number: 2012/180720/07
 *
 * Env vars (VPS: infra/.env, local: .env.local) may override the defaults:
 *   COMPANY_PHYSICAL_ADDRESS - full physical business address (POPIA requires
 *     it in every marketing email footer; also shown on the invoice)
 *   COMPANY_REGISTRATION_NUMBER - CIPC company registration number, shown on
 *     the invoice
 *   COMPANY_VAT_NUMBER - SARS VAT registration number. Ravenall Institute is
 *     NOT VAT registered, so this is unset by default and companyVatNumber()
 *     returns null; the invoice then renders as a plain (non-tax) invoice with
 *     no VAT amounts. Setting a value switches the invoice to full SA
 *     tax-invoice mode.
 *
 * All values are read at call time (not module load) so tests can stub env.
 */

export const COMPANY_NAME = 'Ravenall Institute'

export function companyPhysicalAddress(): string {
  return (
    process.env.COMPANY_PHYSICAL_ADDRESS?.trim() ||
    '8 Oxmoor Street, Kyalami Estates, Gauteng, South Africa'
  )
}

export function companyRegistrationNumber(): string {
  return process.env.COMPANY_REGISTRATION_NUMBER?.trim() || '2012/180720/07'
}

/**
 * SARS VAT registration number, or null when the company is not VAT
 * registered (the current, default state). Callers must treat null as
 * "render a plain invoice - no VAT lines, no tax-invoice wording".
 */
export function companyVatNumber(): string | null {
  return process.env.COMPANY_VAT_NUMBER?.trim() || null
}
