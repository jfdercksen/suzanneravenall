import { describe, it, expect } from 'vitest'
import { parseSrInvoiceReference, srInvoiceReference } from './sage-reference'

describe('srInvoiceReference', () => {
  it('pads the order number to five digits, as on the customer PDF', () => {
    expect(srInvoiceReference(512)).toBe('SR-00512')
  })
  it('keeps longer order numbers whole', () => {
    expect(srInvoiceReference(123456)).toBe('SR-123456')
  })
  it('accepts a numeric string', () => {
    expect(srInvoiceReference(' 42 ')).toBe('SR-00042')
  })
  it('refuses zero, negatives, fractions and text', () => {
    for (const bad of [0, -1, 1.5, 'abc', '']) expect(() => srInvoiceReference(bad)).toThrow()
  })
})

describe('parseSrInvoiceReference', () => {
  it('reads the order number back', () => {
    expect(parseSrInvoiceReference('SR-00512')).toBe(512)
  })
  it('tolerates case and spaces around a hand-typed reference', () => {
    expect(parseSrInvoiceReference(' sr-00512 ')).toBe(512)
  })
  it('returns null for anything else', () => {
    for (const bad of ['ORDER-512', 'SR-512', 'SR-00512x', '', null, undefined]) expect(parseSrInvoiceReference(bad)).toBeNull()
  })
})
