import { describe, it, expect } from 'vitest'
import { resolveSentryDsn } from './sentry-dsn'

describe('resolveSentryDsn', () => {
  it('passes a real DSN through', () => {
    const dsn = 'https://abc123def456@o123456.ingest.sentry.io/7654321'
    expect(resolveSentryDsn(dsn)).toBe(dsn)
  })

  it('accepts a self-hosted DSN and trims whitespace', () => {
    expect(resolveSentryDsn('  https://key@sentry.example.co.za/2 ')).toBe('https://key@sentry.example.co.za/2')
  })

  it.each([
    undefined,
    null,
    '',
    '   ',
    '<DSN from suzanneravenall-web project>',
    'your-sentry-dsn',
    'https://sentry.io/123',
    'https://key@o1.ingest.sentry.io/',
  ])('returns undefined for missing or placeholder DSN %s', (value) => {
    expect(resolveSentryDsn(value)).toBeUndefined()
  })
})
