import { createHash } from 'crypto'
import { describe, it, expect } from 'vitest'
import { payfastSignature, pfEncode } from './payfast-signature'

const md5 = (s: string) => createHash('md5').update(s).digest('hex')

describe('payfastSignature', () => {
  it('keeps the fields in the order given, not sorted', () => {
    const params = { merchant_id: '10000100', merchant_key: '46f0cd694581a', amount: '165.00', item_name: 'Breakthrough Trilogy' }
    expect(payfastSignature(params, 'pass phrase')).toBe(
      md5('merchant_id=10000100&merchant_key=46f0cd694581a&amount=165.00&item_name=Breakthrough+Trilogy&passphrase=pass+phrase')
    )
  })

  it('skips empty values and leaves out the passphrase when none is set', () => {
    expect(payfastSignature({ a: '1', b: '', c: 'x y' }, '')).toBe(md5('a=1&c=x+y'))
  })

  it('encodes like PHP urlencode', () => {
    expect(pfEncode("it's (a) test!*~")).toBe('it%27s+%28a%29+test%21%2A%7E')
    expect(pfEncode('a+b@c.com')).toBe('a%2Bb%40c.com')
  })

  it('includes empty fields when asked, as the ITN signature does', () => {
    expect(payfastSignature({ a: '1', b: '', c: 'x' }, 'p', { includeEmpty: true })).toBe(md5('a=1&b=&c=x&passphrase=p'))
  })
})
