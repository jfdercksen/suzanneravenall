import { describe, it, expect } from 'vitest'
import { isForSale, notForSaleMessage, saleStatusOf, SALE_STATUSES } from './saleStatus'

describe('saleStatusOf', () => {
  it('reads the three statuses from variant metadata', () => {
    for (const status of SALE_STATUSES) expect(saleStatusOf({ sale_status: status })).toBe(status)
  })

  it('treats no metadata, an empty value and unknown values as on sale', () => {
    expect(saleStatusOf(null)).toBeNull()
    expect(saleStatusOf(undefined)).toBeNull()
    expect(saleStatusOf({})).toBeNull()
    // Medusa removes a metadata key when it is set to '' (the restore path).
    expect(saleStatusOf({ sale_status: '' })).toBeNull()
    expect(saleStatusOf({ sale_status: 'RETIRED' })).toBeNull()
    expect(saleStatusOf({ sale_status: 1 })).toBeNull()
  })

  it('keeps the other metadata keys out of it', () => {
    expect(isForSale({ thinkific_course_id: '1892729' })).toBe(true)
    expect(isForSale({ thinkific_course_id: '1892729', sale_status: 'retired' })).toBe(false)
  })
})

describe('notForSaleMessage', () => {
  it('names the item and never promises a date', () => {
    for (const status of SALE_STATUSES) {
      const message = notForSaleMessage(status, 'The Inner Sanctuary')
      expect(message).toContain('The Inner Sanctuary')
      expect(message).not.toMatch(/\d{4}|soon|next week|next month/i)
      expect(message).not.toContain('\u2014')
    }
  })
})
