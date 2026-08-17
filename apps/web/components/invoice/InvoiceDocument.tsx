import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import {
  companyPhysicalAddress,
  companyRegistrationNumber,
  companyVatNumber,
} from '../../lib/email/company'

export interface InvoiceLineItem {
  id: string
  title: string
  variant_title?: string
  quantity: number
  unit_price: number
}

export interface InvoiceOrder {
  id: string
  display_id: number
  created_at: string
  currency_code: string
  customer?: {
    first_name?: string
    last_name?: string
    email: string
  }
  billing_address?: {
    address_1?: string
    city?: string
    country_code?: string
  }
  items: InvoiceLineItem[]
  subtotal: number
  tax_total: number
  total: number
  payment_method?: string
  payment_reference?: string
  sage_invoice_number?: string
}

const NAVY = '#012B43'
const BLUE = '#1719F4'
const LIGHT_GRAY = '#F5F7FA'
const MEDIUM_GRAY = '#64748B'
const DARK = '#1E293B'
const GREEN = '#16A34A'
const BORDER = '#E2E8F0'

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: DARK,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: NAVY,
  },
  logoArea: { flexDirection: 'column' },
  logoText: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
  },
  logoInstitute: {
    fontSize: 8,
    color: MEDIUM_GRAY,
    marginTop: 2,
  },
  logoEmail: {
    fontSize: 8,
    color: MEDIUM_GRAY,
    marginTop: 8,
  },
  invoiceMeta: { flexDirection: 'column', alignItems: 'flex-end' },
  taxInvoiceLabel: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  metaLabel: {
    width: 80,
    textAlign: 'right',
    color: MEDIUM_GRAY,
    paddingRight: 8,
    fontSize: 8,
  },
  metaValue: {
    fontFamily: 'Helvetica-Bold',
    width: 90,
    textAlign: 'right',
    fontSize: 8,
  },
  // ── Parties ───────────────────────────────────────────────
  partiesRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  partyBox: {
    flex: 1,
    padding: 12,
    backgroundColor: LIGHT_GRAY,
  },
  partyBoxRight: { marginLeft: 12 },
  partyLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: BLUE,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginBottom: 2,
  },
  partyLine: { marginBottom: 1, lineHeight: 1.4 },
  partyMuted: { color: MEDIUM_GRAY, fontSize: 8, marginBottom: 1 },
  // ── Line Items Table ──────────────────────────────────────
  table: { marginBottom: 16 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowAlt: { backgroundColor: LIGHT_GRAY },
  cell: { fontSize: 9 },
  colDesc: { flex: 3 },
  colVariant: { flex: 2 },
  colQty: { width: 28, textAlign: 'center' },
  colUnit: { width: 65, textAlign: 'right' },
  colVat: { width: 58, textAlign: 'right' },
  colTotal: { width: 65, textAlign: 'right' },
  // ── Totals ────────────────────────────────────────────────
  totalsOuter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  totalsBox: { width: 230 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  totalLabel: { color: MEDIUM_GRAY },
  totalVal: { fontFamily: 'Helvetica-Bold' },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 8,
    backgroundColor: NAVY,
    marginTop: 4,
  },
  totalLabelFinal: {
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  totalValFinal: {
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  // ── Payment ───────────────────────────────────────────────
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: LIGHT_GRAY,
    borderLeftWidth: 3,
    borderLeftColor: GREEN,
    marginBottom: 20,
  },
  paymentInfo: { flexDirection: 'column' },
  paymentSectionLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: MEDIUM_GRAY,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  paymentMethod: {
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 1,
  },
  paymentRef: { color: MEDIUM_GRAY, fontSize: 8 },
  paidBadge: {
    backgroundColor: GREEN,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  paidText: {
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    letterSpacing: 2,
  },
  // ── Footer ────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: MEDIUM_GRAY },
})

function zarFormat(cents: number): string {
  const amount = (cents / 100).toFixed(2)
  const dotIndex = amount.indexOf('.')
  const integer = dotIndex >= 0 ? amount.slice(0, dotIndex) : amount
  const decimal = dotIndex >= 0 ? amount.slice(dotIndex + 1) : '00'
  const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `R ${formatted}.${decimal}`
}

function dateFormat(iso: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const d = new Date(iso)
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

interface Props {
  order: InvoiceOrder
}

export default function InvoiceDocument({ order }: Props) {
  // VAT-aware rendering. Ravenall Institute is not VAT registered, so by
  // default companyVatNumber() is null and this renders a plain INVOICE:
  // no VAT column, no VAT breakdown, a single TOTAL. Setting the
  // COMPANY_VAT_NUMBER env var switches to the full SA tax-invoice layout.
  const vatNumber = companyVatNumber()
  const vatRegistered = vatNumber !== null

  const invoiceNumber = order.sage_invoice_number
    ?? `SR-${String(order.display_id).padStart(5, '0')}`

  const invoiceDate = dateFormat(order.created_at)

  const customerName = [order.customer?.first_name, order.customer?.last_name]
    .filter(Boolean)
    .join(' ') || 'Customer'

  const countryDisplay = order.billing_address?.country_code?.toUpperCase() ?? ''

  return (
    <Document
      title={`${vatRegistered ? 'Tax Invoice' : 'Invoice'} ${invoiceNumber}`}
      author="Ravenall Institute"
      creator="suzanneravenall.com"
    >
      <Page size="A4" style={s.page}>

        {/* ── Header ─────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.logoArea}>
            {/* TODO: Replace with Image component once Suzanne provides PNG logo */}
            <Text style={s.logoText}>Dr Suzanne Ravenall</Text>
            <Text style={s.logoInstitute}>Ravenall Institute</Text>
            <Text style={s.logoEmail}>sravenall@suzanneravenall.com</Text>
          </View>
          <View style={s.invoiceMeta}>
            <Text style={s.taxInvoiceLabel}>{vatRegistered ? 'TAX INVOICE' : 'INVOICE'}</Text>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Invoice #</Text>
              <Text style={s.metaValue}>{invoiceNumber}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Invoice Date</Text>
              <Text style={s.metaValue}>{invoiceDate}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Due Date</Text>
              <Text style={s.metaValue}>{invoiceDate}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Currency</Text>
              <Text style={s.metaValue}>{order.currency_code.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* ── Parties ────────────────────────────────────────── */}
        <View style={s.partiesRow}>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>FROM</Text>
            <Text style={s.partyName}>Ravenall Institute</Text>
            <Text style={s.partyLine}>{companyPhysicalAddress()}</Text>
            <Text style={s.partyMuted}>Reg No: {companyRegistrationNumber()}</Text>
            {vatRegistered ? (
              <Text style={s.partyMuted}>VAT Reg: {vatNumber}</Text>
            ) : null}
            <Text style={s.partyMuted}>sravenall@suzanneravenall.com</Text>
          </View>
          <View style={[s.partyBox, s.partyBoxRight]}>
            <Text style={s.partyLabel}>BILL TO</Text>
            <Text style={s.partyName}>{customerName}</Text>
            {order.customer?.email ? (
              <Text style={s.partyLine}>{order.customer.email}</Text>
            ) : null}
            {order.billing_address?.address_1 ? (
              <Text style={s.partyLine}>{order.billing_address.address_1}</Text>
            ) : null}
            {order.billing_address?.city ? (
              <Text style={s.partyLine}>{order.billing_address.city}</Text>
            ) : null}
            {countryDisplay ? (
              <Text style={s.partyLine}>{countryDisplay}</Text>
            ) : null}
          </View>
        </View>

        {/* ── Line Items ─────────────────────────────────────── */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, s.colDesc]}>DESCRIPTION</Text>
            <Text style={[s.tableHeaderCell, s.colVariant]}>VARIANT</Text>
            <Text style={[s.tableHeaderCell, s.colQty]}>QTY</Text>
            <Text style={[s.tableHeaderCell, s.colUnit]}>UNIT PRICE</Text>
            {vatRegistered ? (
              <Text style={[s.tableHeaderCell, s.colVat]}>VAT 15%</Text>
            ) : null}
            <Text style={[s.tableHeaderCell, s.colTotal]}>TOTAL</Text>
          </View>
          {order.items.map((item, idx) => {
            const lineTotal = item.unit_price * item.quantity
            // Tax-inclusive pricing (standard for SA): extract VAT portion from line total.
            // Compute per-unit ex-VAT directly from unit_price to avoid rounding accumulation.
            // Only relevant in tax-invoice mode; the plain invoice shows the price as-is.
            const unitExclVat = Math.round(item.unit_price * 100 / 115)
            const vatPortion = lineTotal - unitExclVat * item.quantity
            return (
              <View
                key={item.id}
                style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}
              >
                <Text style={[s.cell, s.colDesc]}>{item.title}</Text>
                <Text style={[s.cell, s.colVariant]}>{item.variant_title ?? '—'}</Text>
                <Text style={[s.cell, s.colQty]}>{item.quantity}</Text>
                <Text style={[s.cell, s.colUnit]}>
                  {zarFormat(vatRegistered ? unitExclVat : item.unit_price)}
                </Text>
                {vatRegistered ? (
                  <Text style={[s.cell, s.colVat]}>{zarFormat(vatPortion)}</Text>
                ) : null}
                <Text style={[s.cell, s.colTotal]}>{zarFormat(lineTotal)}</Text>
              </View>
            )
          })}
        </View>

        {/* ── Totals ─────────────────────────────────────────── */}
        <View style={s.totalsOuter}>
          <View style={s.totalsBox}>
            {vatRegistered ? (
              <>
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Subtotal (excl VAT)</Text>
                  <Text style={s.totalVal}>{zarFormat(order.subtotal)}</Text>
                </View>
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>VAT (15%)</Text>
                  <Text style={s.totalVal}>{zarFormat(order.tax_total)}</Text>
                </View>
                <View style={s.totalRowFinal}>
                  <Text style={s.totalLabelFinal}>TOTAL (incl VAT)</Text>
                  <Text style={s.totalValFinal}>{zarFormat(order.total)}</Text>
                </View>
              </>
            ) : (
              // Not VAT registered: a single TOTAL row, no VAT breakdown.
              // order.tax_total is deliberately ignored here. If tax_total > 0
              // while the company is not VAT registered, that is a data
              // inconsistency (Medusa region tax config charging tax the
              // company may not collect) - it must never surface as a VAT
              // line on a document from a non-registered vendor. Flag the
              // Medusa tax rate config instead of rendering it.
              <View style={s.totalRowFinal}>
                <Text style={s.totalLabelFinal}>TOTAL</Text>
                <Text style={s.totalValFinal}>{zarFormat(order.total)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Payment ────────────────────────────────────────── */}
        <View style={s.paymentRow}>
          <View style={s.paymentInfo}>
            <Text style={s.paymentSectionLabel}>PAYMENT DETAILS</Text>
            <Text style={s.paymentMethod}>
              {order.payment_method ?? 'Online Payment'}
            </Text>
            {order.payment_reference ? (
              <Text style={s.paymentRef}>Reference: {order.payment_reference}</Text>
            ) : null}
          </View>
          <View style={s.paidBadge}>
            <Text style={s.paidText}>PAID</Text>
          </View>
        </View>

        {/* ── Footer ─────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            This is a computer-generated invoice and requires no signature.
          </Text>
          <Text style={s.footerText}>Powered by Ai Dynamic Advisory</Text>
        </View>

      </Page>
    </Document>
  )
}
