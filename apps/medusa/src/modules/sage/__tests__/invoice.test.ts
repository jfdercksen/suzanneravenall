import { describe, it, expect } from 'vitest'
import { buildSageInvoice, centsToRand, buildSageOrderSnapshot, invoiceTotalCents, sastDate, type SageOrderSnapshot } from '../invoice'
import { SageConfigError } from '../errors'
import { LINE_TYPE_ACCOUNT, LINE_TYPE_ITEM } from '../types'

const order = (over: Partial<SageOrderSnapshot> = {}): SageOrderSnapshot => ({
  id: 'order_1',
  displayId: 412,
  currencyCode: 'ZAR',
  total: 1500,
  createdAt: '2026-11-26T10:00:00.000Z',
  email: 'ann@example.com',
  customerName: 'Ann Lee',
  items: [{ title: 'Course', productTitle: 'Rapid Course', variantTitle: 'Self paced', quantity: 1, unitPrice: 1500, sageItemCode: 'RC-1' }],
  ...over,
})

const base = { customerId: 40, taxTypeId: 4, incomeAccountId: 300 }

describe('buildSageInvoice', () => {
  it('builds an item line in rand, inclusive, with the SR- reference', () => {
    const { body, warnings } = buildSageInvoice({ ...base, order: order(), itemIds: { 'RC-1': 31 } })
    expect(body).toMatchObject({ CustomerId: 40, Inclusive: true, Reference: 'SR-00412', Date: '2026-11-26', DueDate: '2026-11-26' })
    expect(body.Lines).toEqual([
      {
        SelectionId: 31, LineType: LINE_TYPE_ITEM, TaxTypeId: 4, Description: 'Rapid Course - Self paced',
        Quantity: 1, UnitPriceInclusive: 1500, DiscountPercentage: 0,
      },
    ])
    expect(warnings).toEqual([])
  })

  it('falls back to the income account with a warning when the variant has no code', () => {
    const { body, warnings } = buildSageInvoice({ ...base, order: order({ items: [{ ...order().items[0], sageItemCode: null }] }), itemIds: {} })
    expect(body.Lines[0]).toMatchObject({ SelectionId: 300, LineType: LINE_TYPE_ACCOUNT })
    expect(warnings[0]).toMatch(/no sage_item_code/)
  })

  it('falls back with a warning when Sage does not know the code', () => {
    const { body, warnings } = buildSageInvoice({ ...base, order: order(), itemIds: { 'RC-1': null } })
    expect(body.Lines[0]).toMatchObject({ SelectionId: 300, LineType: LINE_TYPE_ACCOUNT })
    expect(warnings[0]).toMatch(/"RC-1" is not known in Sage/)
  })

  it('refuses without a tax type, never picking 15%', () => {
    expect(() => buildSageInvoice({ ...base, taxTypeId: null, order: order(), itemIds: { 'RC-1': 31 } })).toThrow(SageConfigError)
  })

  it('refuses an account line without SAGE_INCOME_ACCOUNT_ID, but item lines need none', () => {
    expect(() => buildSageInvoice({ ...base, incomeAccountId: null, order: order(), itemIds: { 'RC-1': null } })).toThrow(/SAGE_INCOME_ACCOUNT_ID/)
    expect(() => buildSageInvoice({ ...base, incomeAccountId: null, order: order(), itemIds: { 'RC-1': 31 } })).not.toThrow()
  })

  it('a voucher becomes a negative line so the invoice total equals the order total', () => {
    const o = order({
      total: 2150.5,
      items: [
        { ...order().items[0], quantity: 2, unitPrice: 1299.99 },
        { title: 'Workbook', productTitle: 'Workbook', variantTitle: null, quantity: 1, unitPrice: 350.5, sageItemCode: 'WB' },
      ],
    })
    const { body } = buildSageInvoice({ ...base, order: o, itemIds: { 'RC-1': 31, WB: 32 } })
    expect(body.Lines).toHaveLength(3)
    expect(body.Lines[2]).toMatchObject({ Description: 'Discount', Quantity: 1, UnitPriceInclusive: -799.98 })
    expect(invoiceTotalCents(body)).toBe(215050)
  })

  it('a fee above the item lines becomes an Other charges line; equal totals add no line', () => {
    const fee = buildSageInvoice({ ...base, order: order({ total: 1550 }), itemIds: { 'RC-1': 31 } })
    expect(fee.body.Lines[1]).toMatchObject({ Description: 'Other charges', UnitPriceInclusive: 50 })
    expect(invoiceTotalCents(fee.body)).toBe(155000)
    expect(buildSageInvoice({ ...base, order: order(), itemIds: { 'RC-1': 31 } }).body.Lines).toHaveLength(1)
  })

  it('floating point prices still add up to the cent', () => {
    const o = order({ total: 0.3, items: [{ ...order().items[0], quantity: 3, unitPrice: 0.1 }] })
    expect(invoiceTotalCents(buildSageInvoice({ ...base, order: o, itemIds: { 'RC-1': 1 } }).body)).toBe(30)
  })

  it('dates the invoice in SAST: 23:30 UTC is already tomorrow in Johannesburg', () => {
    expect(sastDate('2026-11-26T23:30:00Z')).toBe('2026-11-27')
    expect(sastDate('2026-11-26T21:59:00Z')).toBe('2026-11-26')
  })

  it('needs an order number and items', () => {
    expect(() => buildSageInvoice({ ...base, order: order({ displayId: null }), itemIds: {} })).toThrow(/order number/)
    expect(() => buildSageInvoice({ ...base, order: order({ items: [] }), itemIds: {} })).toThrow(/no items/)
  })
})

describe('centsToRand', () => {
  it('converts once and rounds to 2 decimals', () => {
    expect(centsToRand(249000)).toBe(2490)
    expect(centsToRand({ numeric: 249050 })).toBe(2490.5)
    expect(centsToRand(23000)).toBe(230)
    expect(centsToRand(10.4)).toBe(0.1)
    expect(centsToRand(null)).toBe(0)
  })
  it('a snapshot from cents gives UnitPriceInclusive 2490.00 and a voucher order adds up in rand', () => {
    const snap = buildSageOrderSnapshot({
      id: 'o', display_id: 5, currency_code: 'zar', total: 199000, created_at: '2026-11-26T08:00:00Z', email: 'a@b.co',
      items: [{ title: 'RR 90', quantity: 1, unit_price: 249000, variant: { title: 'Default', metadata: { sage_item_code: 'RR' }, product: { title: 'RR' } } }],
    })
    expect(snap.total).toBe(1990)
    const { body } = buildSageInvoice({ ...base, order: snap, itemIds: { RR: 9 } })
    expect(body.Lines[0].UnitPriceInclusive).toBe(2490)
    expect(body.Lines[1]).toMatchObject({ Description: 'Discount', UnitPriceInclusive: -500 })
    expect(invoiceTotalCents(body)).toBe(199000)
  })
})

describe('buildSageOrderSnapshot', () => {
  it('converts cents to rand once (BigNumber-aware) and reads the item code from the variant metadata', () => {
    const snap = buildSageOrderSnapshot({
      id: 'order_9',
      display_id: 7,
      currency_code: 'zar',
      total: { numeric: 150000, value: '150000' },
      created_at: '2026-11-26T08:00:00.000Z',
      email: 'Guest@Example.com',
      customer: { email: null, first_name: null, last_name: null },
      billing_address: { first_name: 'Gus', last_name: 'Guest' },
      items: [
        {
          title: 'Course',
          quantity: 2,
          unit_price: { numeric: 75000 },
          variant: { title: 'Default', metadata: { sage_item_code: ' RC-1 ' }, product: { title: 'Rapid Course' } },
        },
        { title: 'Loose item', quantity: 1, unit_price: 0, variant: null },
      ],
    })
    expect(snap).toMatchObject({ id: 'order_9', displayId: 7, currencyCode: 'ZAR', total: 1500, email: 'guest@example.com', customerName: 'Gus Guest' })
    expect(snap.items[0]).toMatchObject({ quantity: 2, unitPrice: 750, sageItemCode: 'RC-1', productTitle: 'Rapid Course' })
    expect(snap.items[1].sageItemCode).toBeNull()
  })
})
