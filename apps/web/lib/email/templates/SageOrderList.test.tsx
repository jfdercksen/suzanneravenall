import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { render } from '@react-email/components'
import SageOrderList from './SageOrderList'
import type { SageOrderListData } from '../sage-order-list'

const base: SageOrderListData = {
  to: ['c@example.com'],
  cc: [],
  windowLabel: 'Mon 23 Nov 2026',
  fromDate: '2026-11-23',
  toDate: '2026-11-23',
  orders: [
    {
      reference: 'SR-00042',
      createdAt: '2026-11-23T12:03:00.000Z',
      createdAtLabel: '2026-11-23 14:03',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      company: 'Acme',
      vatNumber: '4123456789',
      registrationNumber: null,
      billingAddress: '1 Main Rd',
      items: [{ productTitle: 'Course', variantTitle: null, quantity: 1, unitAmount: 100, lineTotal: 100, sageItemCode: null }],
      currency: 'ZAR',
      discountTotal: 10,
      voucherCodes: ['SPRING10'],
      total: 90,
      paymentMethod: 'PayFast',
      paymentReference: 'PF1',
    },
  ],
  incomplete: false,
  refunds: [{ reference: 'SR-00007', refundedAt: '2026-11-23T09:00:00.000Z', refundedAtLabel: '2026-11-23 11:00', amount: 5, currency: 'ZAR', note: null }],
}

describe('SageOrderList template', () => {
  it('renders the order, no-code marker, voucher, refunds and footer', async () => {
    const html = await render(createElement(SageOrderList, { data: base }))
    for (const s of ['SR-00042', 'no code, check', 'SPRING10', 'ZAR 90.00', 'Refunds', 'SR-00007', 'keep it within the team', 'VAT 4123456789']) {
      expect(html).toContain(s)
    }
    expect(html).toContain('Type the SR number in the Sage invoice reference field')
    expect(html).not.toContain('—')
  })

  it('renders a short mail on an empty day', async () => {
    const html = await render(createElement(SageOrderList, { data: { ...base, orders: [], refunds: [] } }))
    expect(html).toContain('No orders on Mon 23 Nov 2026.')
    expect(html).not.toContain('Type the SR number')
  })

  it('shows the incomplete notice when the list was cut', async () => {
    const html = await render(createElement(SageOrderList, { data: { ...base, incomplete: true } }))
    expect(html).toContain('This list is incomplete')
  })
})
