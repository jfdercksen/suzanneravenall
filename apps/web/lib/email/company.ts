/**
 * Company identity values shown in email footers and on the PDF invoice.
 *
 * Confirmed real values (public company identity, safe as hardcoded defaults):
 *   - Address shown in emails and on the invoice: the postal address, the same
 *     one as the site footer (Johan, 6 Oct 2026). The street address (Oxmoor
 *     Street, Kyalami Estates) stays on /contact and the legal pages.
 *   - Company registration number: 2012/180720/07
 *
 * Env vars (VPS: infra/.env, local: .env.local) may override the defaults:
 *   COMPANY_PHYSICAL_ADDRESS - business address for every email footer and the
 *     invoice (leave unset to use the postal address default)
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

/**
 * Public contact details, the same values the site shows on /contact
 * (app/contact/ContactOptions.tsx) and in the footer
 * (components/layout/Footer.tsx). The email address is also the reply-to on
 * customer emails.
 */
export const COMPANY_CONTACT_EMAIL = 'sravenall@suzanneravenall.com'
export const COMPANY_PHONE = '+27 10 597 0841'

export function companyPhysicalAddress(): string {
  return (
    process.env.COMPANY_PHYSICAL_ADDRESS?.trim() ||
    'PO Box 910, Kyalami, 1684, Johannesburg, South Africa'
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
