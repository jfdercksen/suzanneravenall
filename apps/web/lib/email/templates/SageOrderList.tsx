import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import {
  NO_CODE_TEXT,
  SAGE_LIST_FOOTER,
  SAGE_LIST_INSTRUCTION,
  money,
  sageOrderListSubject,
  type SageOrderListData,
} from '../sage-order-list'

/**
 * The bookkeeper's daily order list: one block per order with the SR number to
 * type in the Sage invoice reference field, then any refunds made that day.
 * An empty day is a short "No orders" mail, so a missing mail means a fault.
 * Monochrome brand, no hue. Staff only: customer details inside.
 */

const INK = '#0A0A0A'
const MUTED = '#696969'
const SAND = '#F6F6F7'
const BORDER = '#E5E5E5'

const cell = { color: INK, fontSize: '13px', lineHeight: '1.5', padding: '4px 8px 4px 0', verticalAlign: 'top' as const }
const head = { ...cell, color: MUTED, fontSize: '12px', borderBottom: `1px solid ${BORDER}` }

export default function SageOrderList({ data }: { data: SageOrderListData }) {
  const empty = data.orders.length === 0 && data.refunds.length === 0
  return (
    <Html lang="en">
      <Head />
      <Preview>{empty ? `No orders on ${data.windowLabel}.` : sageOrderListSubject(data)}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '680px', margin: '0 auto', padding: '24px' }}>
          {empty ? (
            <Text style={{ color: INK, fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' }}>
              No orders on {data.windowLabel}.
            </Text>
          ) : (
            <>
              <Heading as="h1" style={{ color: INK, fontSize: '22px', fontWeight: '400', margin: '0 0 8px' }}>
                Orders for Sage: {data.windowLabel}
              </Heading>
              <Text style={{ color: INK, fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px' }}>
                {SAGE_LIST_INSTRUCTION}
              </Text>
              {data.orders.length === 0 ? (
                <Text style={{ color: INK, fontSize: '14px', margin: '0 0 16px' }}>No orders on {data.windowLabel}.</Text>
              ) : null}
              {data.orders.map((o) => (
                <Section key={o.reference} style={{ backgroundColor: SAND, borderRadius: '4px', padding: '14px 16px', marginBottom: '16px' }}>
                  <Text style={{ color: INK, fontSize: '16px', fontWeight: '700', margin: '0 0 2px' }}>
                    {o.reference} <span style={{ color: MUTED, fontWeight: '400', fontSize: '13px' }}>{o.createdAtLabel}</span>
                  </Text>
                  <Text style={{ color: INK, fontSize: '13px', lineHeight: '1.5', margin: '0 0 2px' }}>
                    {o.customerName} ({o.customerEmail})
                  </Text>
                  {o.company ? (
                    <Text style={{ color: INK, fontSize: '13px', lineHeight: '1.5', margin: '0 0 2px' }}>
                      {o.company}
                      {o.vatNumber ? `, VAT ${o.vatNumber}` : ''}
                      {o.registrationNumber ? `, Reg ${o.registrationNumber}` : ''}
                    </Text>
                  ) : null}
                  {o.billingAddress ? (
                    <Text style={{ color: MUTED, fontSize: '12px', lineHeight: '1.5', margin: '0 0 8px' }}>{o.billingAddress}</Text>
                  ) : null}
                  <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th align="left" style={head}>Sage code</th>
                        <th align="left" style={head}>Item</th>
                        <th align="right" style={head}>Qty</th>
                        <th align="right" style={head}>Unit</th>
                        <th align="right" style={head}>Line</th>
                      </tr>
                    </thead>
                    <tbody>
                      {o.items.map((i, idx) => (
                        <tr key={idx}>
                          <td style={{ ...cell, fontWeight: i.sageItemCode ? '400' : '700' }}>{i.sageItemCode ?? NO_CODE_TEXT}</td>
                          <td style={cell}>{i.variantTitle ? `${i.productTitle} - ${i.variantTitle}` : i.productTitle}</td>
                          <td align="right" style={cell}>{i.quantity}</td>
                          <td align="right" style={cell}>{money(i.unitAmount, o.currency)}</td>
                          <td align="right" style={cell}>{money(i.lineTotal, o.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {o.discountTotal > 0 || o.voucherCodes.length > 0 ? (
                    <Text style={{ color: INK, fontSize: '13px', margin: '8px 0 0' }}>
                      Discount: {money(o.discountTotal, o.currency)}
                      {o.voucherCodes.length > 0 ? ` (voucher ${o.voucherCodes.join(', ')})` : ''}
                    </Text>
                  ) : null}
                  <Text style={{ color: INK, fontSize: '14px', fontWeight: '700', margin: '6px 0 0' }}>
                    Total: {money(o.total, o.currency)}
                  </Text>
                  <Text style={{ color: MUTED, fontSize: '12px', margin: '2px 0 0' }}>
                    Payment: {o.paymentMethod}
                    {o.paymentReference ? `, ref ${o.paymentReference}` : ''}
                  </Text>
                </Section>
              ))}
              {data.refunds.length > 0 ? (
                <Section style={{ marginBottom: '16px' }}>
                  <Text style={{ color: INK, fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px', borderBottom: `1px solid ${BORDER}`, paddingBottom: '6px' }}>
                    Refunds
                  </Text>
                  {data.refunds.map((r, idx) => (
                    <Text key={idx} style={{ color: INK, fontSize: '13px', lineHeight: '1.5', margin: '0 0 4px' }}>
                      {r.reference}, {r.refundedAtLabel}, {money(r.amount, r.currency)}
                      {r.note ? `, ${r.note}` : ''}
                    </Text>
                  ))}
                </Section>
              ) : null}
            </>
          )}
          <Hr style={{ borderColor: BORDER, margin: '24px 0 12px' }} />
          <Text style={{ color: MUTED, fontSize: '12px', lineHeight: '1.5', margin: 0 }}>{SAGE_LIST_FOOTER}</Text>
        </Container>
      </Body>
    </Html>
  )
}
