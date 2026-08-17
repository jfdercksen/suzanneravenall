import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import type { ReactElement, ReactNode } from 'react'
import InvoiceDocument, { type InvoiceOrder } from './InvoiceDocument'

/**
 * VAT-aware invoice rendering tests.
 *
 * Ravenall Institute is NOT VAT registered, so the default (COMPANY_VAT_NUMBER
 * unset) must produce a plain INVOICE: no VAT column, no VAT breakdown rows,
 * no "TAX INVOICE" title, and the company registration number instead of a
 * VAT registration line. Setting COMPANY_VAT_NUMBER switches the document to
 * the full SA tax-invoice layout.
 *
 * We assert against the React element tree returned by the component (react-pdf
 * primitives are plain elements) rather than rendering an actual PDF - fast,
 * and exact about which strings appear.
 */

// Flatten the element tree to text. Immediate children of one element are
// concatenated (so "Reg No: " + value stays one string); separate elements are
// newline-separated so unrelated strings can never join into a false match.
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (typeof node === 'object' && 'props' in node) {
    const el = node as ReactElement<{ children?: ReactNode }>
    return `${textOf(el.props.children)}\n`
  }
  return ''
}

const order: InvoiceOrder = {
  id: 'order_1',
  display_id: 42,
  created_at: '2026-08-04T09:00:00.000Z',
  currency_code: 'zar',
  customer: { first_name: 'Alice', last_name: 'Smith', email: 'alice@example.com' },
  billing_address: { address_1: '1 Test Road', city: 'Johannesburg', country_code: 'za' },
  items: [
    { id: 'i1', title: 'Inner Circle Coaching', variant_title: 'Self Study', quantity: 1, unit_price: 250000 },
  ],
  subtotal: 250000,
  tax_total: 0,
  total: 250000,
  payment_method: 'PayFast',
  payment_reference: 'pf_123',
}

function renderText(o: InvoiceOrder): { title: string; text: string } {
  const el = InvoiceDocument({ order: o }) as ReactElement<{ title?: string; children?: ReactNode }>
  return { title: el.props.title ?? '', text: textOf(el) }
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('InvoiceDocument - VAT off (default: not VAT registered)', () => {
  beforeEach(() => {
    vi.stubEnv('COMPANY_VAT_NUMBER', '')
  })

  it('renders a plain INVOICE, not a TAX INVOICE', () => {
    const { title, text } = renderText(order)
    expect(title).toBe('Invoice SR-00042')
    expect(text).toContain('INVOICE')
    expect(text).not.toContain('TAX INVOICE')
  })

  it('shows the company registration number and no VAT registration line', () => {
    const { text } = renderText(order)
    expect(text).toContain('Reg No: 2012/180720/07')
    expect(text).not.toContain('VAT Reg')
  })

  it('renders no VAT column, no VAT rows, and a single TOTAL', () => {
    const { text } = renderText(order)
    expect(text).not.toContain('VAT')
    expect(text).not.toContain('Subtotal')
    expect(text).toContain('TOTAL')
    expect(text).toContain('R 2,500.00')
  })

  it('shows the tax-inclusive unit price unchanged (no 15/115 extraction)', () => {
    const { text } = renderText(order)
    // 250000 cents as-is, not the ex-VAT 217391
    expect(text).toContain('R 2,500.00')
    expect(text).not.toContain('R 2,173.91')
  })

  it('still renders nothing VAT-ish when order.tax_total > 0 (data inconsistency)', () => {
    // If Medusa's region tax config charged tax while the company is not VAT
    // registered, the document must not surface it as a VAT line.
    const { text } = renderText({ ...order, subtotal: 217391, tax_total: 32609 })
    expect(text).not.toContain('VAT')
    expect(text).toContain('TOTAL')
    expect(text).toContain('R 2,500.00')
  })
})

describe('InvoiceDocument - VAT on (COMPANY_VAT_NUMBER set)', () => {
  beforeEach(() => {
    vi.stubEnv('COMPANY_VAT_NUMBER', '4123456789')
  })

  it('renders the full SA tax-invoice layout', () => {
    const { title, text } = renderText({ ...order, subtotal: 217391, tax_total: 32609 })
    expect(title).toBe('Tax Invoice SR-00042')
    expect(text).toContain('TAX INVOICE')
    expect(text).toContain('VAT Reg: 4123456789')
    expect(text).toContain('VAT 15%')
    expect(text).toContain('Subtotal (excl VAT)')
    expect(text).toContain('VAT (15%)')
    expect(text).toContain('TOTAL (incl VAT)')
  })

  it('keeps the registration number line alongside the VAT number', () => {
    const { text } = renderText(order)
    expect(text).toContain('Reg No: 2012/180720/07')
  })

  it('extracts the ex-VAT unit price from tax-inclusive pricing', () => {
    const { text } = renderText({ ...order, subtotal: 217391, tax_total: 32609 })
    // 250000 * 100/115 = 217391 cents
    expect(text).toContain('R 2,173.91')
  })
})
