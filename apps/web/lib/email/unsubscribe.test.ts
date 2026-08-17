import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  buildListUnsubscribeHeaders,
  buildUnsubscribeUrl,
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from './unsubscribe'

const SECRET = 'test-unsubscribe-secret'

describe('unsubscribe tokens', () => {
  beforeEach(() => {
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', SECRET)
  })

  it('round-trips an email through create + verify', () => {
    const token = createUnsubscribeToken('Shopper@Example.com')
    expect(verifyUnsubscribeToken(token)).toBe('shopper@example.com')
  })

  it('rejects a tampered payload', () => {
    const token = createUnsubscribeToken('shopper@example.com')
    const [, sig] = token.split('.')
    const forgedPayload = Buffer.from('attacker@example.com', 'utf8').toString('base64url')
    expect(verifyUnsubscribeToken(`${forgedPayload}.${sig}`)).toBeNull()
  })

  it('rejects a tampered signature', () => {
    const token = createUnsubscribeToken('shopper@example.com')
    const [payload] = token.split('.')
    expect(verifyUnsubscribeToken(`${payload}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`)).toBeNull()
  })

  it('rejects garbage, empty, and missing tokens', () => {
    expect(verifyUnsubscribeToken('not-a-token')).toBeNull()
    expect(verifyUnsubscribeToken('')).toBeNull()
    expect(verifyUnsubscribeToken(null)).toBeNull()
    expect(verifyUnsubscribeToken(undefined)).toBeNull()
    expect(verifyUnsubscribeToken('a.b.c')).toBeNull()
  })

  it('rejects tokens signed with a different secret', () => {
    const token = createUnsubscribeToken('shopper@example.com')
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', 'a-different-secret')
    expect(verifyUnsubscribeToken(token)).toBeNull()
  })

  it('createUnsubscribeToken throws when the secret is not configured', () => {
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', '')
    expect(() => createUnsubscribeToken('shopper@example.com')).toThrow(
      'EMAIL_UNSUBSCRIBE_SECRET is not configured'
    )
  })

  it('verifyUnsubscribeToken returns null (never throws) when the secret is not configured', () => {
    const token = createUnsubscribeToken('shopper@example.com')
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', '')
    expect(verifyUnsubscribeToken(token)).toBeNull()
  })

  it('buildUnsubscribeUrl points at /unsubscribe with the token as query param', () => {
    const url = buildUnsubscribeUrl('shopper@example.com')
    expect(url).toContain('/unsubscribe?token=')
    const token = decodeURIComponent(url.split('token=')[1] ?? '')
    expect(verifyUnsubscribeToken(token)).toBe('shopper@example.com')
  })

  it('buildListUnsubscribeHeaders emits RFC 8058 one-click headers', () => {
    const headers = buildListUnsubscribeHeaders('shopper@example.com')
    expect(headers['List-Unsubscribe']).toMatch(/^<.*\/api\/email\/unsubscribe\?token=.*>$/)
    expect(headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
  })
})
