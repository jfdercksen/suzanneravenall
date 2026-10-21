import { describe, it, expect, vi, beforeEach } from 'vitest'

// The DB-IP file is a MaxMind-format database; the reader is stubbed with a
// small table so the test needs no download.
const table: Record<string, string> = { '41.13.1.1': 'ZA', '8.8.8.8': 'US', '2c0f:f4c0::1': 'ZA' }
let fileExists = true
vi.mock('fs', () => {
  const fsMock = {
    readFileSync: () => Buffer.from(''),
    statSync: () => {
      if (!fileExists) throw new Error('ENOENT')
      return { mtimeMs: 1 }
    },
  }
  return { ...fsMock, default: fsMock }
})
vi.mock('maxmind', () => ({
  Reader: class {
    get(ip: string) {
      const cc = table[ip]
      return cc ? { country: { iso_code: cc } } : null
    }
  },
}))

import { clientIp, ipCountry, resetGeoipForTests } from './geoip'

const h = (entries: Record<string, string>) => new Headers(entries)

describe('clientIp', () => {
  it('uses X-Real-IP from our nginx', () => {
    expect(clientIp(h({ 'x-real-ip': '8.8.8.8', 'x-forwarded-for': '41.13.1.1, 8.8.8.8' }))).toBe('8.8.8.8')
  })

  it('falls back to the last X-Forwarded-For entry, which our proxy appended (the first can be forged)', () => {
    expect(clientIp(h({ 'x-forwarded-for': '41.13.1.1, 8.8.8.8' }))).toBe('8.8.8.8')
  })

  it('is empty without either header', () => {
    expect(clientIp(h({}))).toBe('')
  })
})

describe('ipCountry', () => {
  beforeEach(() => {
    fileExists = true
    resetGeoipForTests()
  })

  it.each([
    ['41.13.1.1', 'ZA'],
    ['2c0f:f4c0::1', 'ZA'],
    ['8.8.8.8', 'US'],
    ['10.0.0.5', ''],
  ])('%s -> %s', (ip, cc) => {
    expect(ipCountry(h({ 'x-real-ip': ip }))).toBe(cc)
  })

  it('is unknown when the database is missing (local dev), so the browser signals decide', () => {
    fileExists = false
    expect(ipCountry(h({ 'x-real-ip': '8.8.8.8' }))).toBe('')
  })
})
