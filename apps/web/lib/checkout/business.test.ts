import { describe, it, expect } from 'vitest'
import {
  BUSINESS_META_KEYS,
  EMPTY_BUSINESS,
  businessMetadata,
  normaliseBusiness,
  readOrderBusiness,
  validateBusiness,
  vatNumberError,
} from './business'
import { BUSINESS_META_KEYS as MEDUSA_KEYS } from '../../../../packages/integrations/src/business'

const acme = {
  companyName: '  Acme (Pty) Ltd ',
  vatNumber: '4123 456 789',
  registrationNumber: ' 2020/123456/07 ',
  address: ' 1 Main Road\r\nSandton ',
}

describe('vatNumberError', () => {
  it('accepts a South African VAT number typed with spaces or dashes', () => {
    expect(vatNumberError('4123456789', 'ZA')).toBeUndefined()
    expect(vatNumberError('4123 456 789', 'ZA')).toBeUndefined()
    expect(vatNumberError('412-345-6789', 'ZA')).toBeUndefined()
  })

  it('refuses a South African number that is not 10 digits starting with 4', () => {
    const msg = 'A South African VAT number is 10 digits and starts with 4'
    expect(vatNumberError('5123456789', 'ZA')).toBe(msg)
    expect(vatNumberError('412345678', 'ZA')).toBe(msg)
    expect(vatNumberError('41234567890', 'ZA')).toBe(msg)
    expect(vatNumberError('41234567AB', 'ZA')).toBe(msg)
  })

  it('checks only the shape for a buyer outside South Africa', () => {
    expect(vatNumberError('GB123456789', 'INTL')).toBeUndefined()
    expect(vatNumberError('DE 123 456 789', 'INTL')).toBeUndefined()
    expect(vatNumberError('x!', 'INTL')).toBe('Please enter a valid VAT number')
  })

  it('leaves an empty VAT number alone (it is optional)', () => {
    expect(vatNumberError('', 'ZA')).toBeUndefined()
    expect(vatNumberError('   ', 'INTL')).toBeUndefined()
  })
})

describe('validateBusiness', () => {
  it('requires the company name only', () => {
    expect(validateBusiness(EMPTY_BUSINESS, 'ZA')).toEqual({ companyName: 'Company name is required' })
    expect(validateBusiness({ ...EMPTY_BUSINESS, companyName: 'Acme' }, 'ZA')).toEqual({})
  })

  it('reports a bad VAT number next to a good name', () => {
    expect(validateBusiness({ ...EMPTY_BUSINESS, companyName: 'Acme', vatNumber: '123' }, 'ZA')).toEqual({
      vatNumber: 'A South African VAT number is 10 digits and starts with 4',
    })
  })

  it('caps the lengths', () => {
    const errors = validateBusiness(
      { companyName: 'a'.repeat(121), vatNumber: '', registrationNumber: 'r'.repeat(31), address: 'x'.repeat(301) },
      'ZA'
    )
    expect(Object.keys(errors).sort()).toEqual(['address', 'companyName', 'registrationNumber'])
  })
})

describe('businessMetadata', () => {
  it('stores trimmed values, the VAT number without spaces', () => {
    expect(businessMetadata(acme)).toEqual({
      business_company_name: 'Acme (Pty) Ltd',
      business_vat_number: '4123456789',
      business_registration_number: '2020/123456/07',
      business_address: '1 Main Road\nSandton',
    })
  })

  it('writes every key empty for a personal checkout, so withdrawn details are cleared', () => {
    expect(businessMetadata(null)).toEqual({
      business_company_name: '',
      business_vat_number: '',
      business_registration_number: '',
      business_address: '',
    })
  })
})

describe('readOrderBusiness', () => {
  it('reads what the checkout wrote', () => {
    expect(readOrderBusiness({ metadata: businessMetadata(acme) })).toEqual({
      companyName: 'Acme (Pty) Ltd',
      vatNumber: '4123456789',
      registrationNumber: '2020/123456/07',
      address: '1 Main Road\nSandton',
    })
  })

  it('is null for a personal order, including one with the empty keys', () => {
    expect(readOrderBusiness({ metadata: null, billing_address: null })).toBeNull()
    expect(readOrderBusiness({ metadata: businessMetadata(null), billing_address: { company: '' } })).toBeNull()
  })

  it('falls back to the billing address company', () => {
    expect(readOrderBusiness({ metadata: {}, billing_address: { company: 'Beta CC' } })).toEqual({
      companyName: 'Beta CC',
      vatNumber: null,
      registrationNumber: null,
      address: null,
    })
  })

  it('normalises the same way on the second pass', () => {
    expect(normaliseBusiness(normaliseBusiness(acme))).toEqual(normaliseBusiness(acme))
  })
})

describe('key names', () => {
  it('match the Medusa side (Vtiger reads the same metadata)', () => {
    expect(MEDUSA_KEYS.companyName).toBe(BUSINESS_META_KEYS.companyName)
    expect(MEDUSA_KEYS.vatNumber).toBe(BUSINESS_META_KEYS.vatNumber)
    expect(MEDUSA_KEYS.registrationNumber).toBe(BUSINESS_META_KEYS.registrationNumber)
  })
})

describe('readOrderBusiness caps what the store API let through', () => {
  it('cuts oversized values and keeps at most 6 address lines', () => {
    const b = readOrderBusiness({
      metadata: {
        business_company_name: 'C'.repeat(500),
        business_vat_number: '4'.repeat(50),
        business_address: Array.from({ length: 10 }, (_, i) => `line ${i}`).join('\n'),
      },
    })!
    expect(b.companyName).toHaveLength(120)
    expect(b.vatNumber).toHaveLength(20)
    expect(b.address!.split('\n')).toHaveLength(6)
  })
})

