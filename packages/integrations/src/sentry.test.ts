// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { parseSentryDsn, sendSentryEvent } from './sentry'

const quiet = () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })
const DSN = 'https://abc123@o1.ingest.sentry.io/4507'

describe('parseSentryDsn', () => {
  it('builds the envelope endpoint from a hosted DSN', () => {
    expect(parseSentryDsn(DSN)).toEqual({
      endpoint: 'https://o1.ingest.sentry.io/api/4507/envelope/',
      publicKey: 'abc123',
      dsn: DSN,
    })
  })

  it('keeps a self-hosted path prefix', () => {
    expect(parseSentryDsn('https://k@sentry.example.com/prefix/9')?.endpoint).toBe('https://sentry.example.com/prefix/api/9/envelope/')
  })

  it('returns null for empty or malformed DSNs', () => {
    expect(parseSentryDsn(undefined)).toBeNull()
    expect(parseSentryDsn('')).toBeNull()
    expect(parseSentryDsn('not a url')).toBeNull()
    expect(parseSentryDsn('https://o1.ingest.sentry.io/4507')).toBeNull()
    expect(parseSentryDsn('https://k@o1.ingest.sentry.io/')).toBeNull()
  })
})

describe('sendSentryEvent', () => {
  it('posts one envelope with the event and masks emails', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }))
    const outcome = await sendSentryEvent(
      { message: 'Stuck payment for buyer@example.com', level: 'error', tags: { automation: 'payment_reconcile' }, extra: { note: 'mail buyer@example.com', amount: 2000 } },
      { env: { SENTRY_DSN: DSN, SENTRY_ENVIRONMENT: 'review' }, fetchImpl, logger: quiet(), now: () => new Date('2026-10-22T10:00:00Z') },
    )
    expect(outcome).toBe('sent')
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://o1.ingest.sentry.io/api/4507/envelope/')
    expect(new Headers(init.headers).get('X-Sentry-Auth')).toContain('sentry_key=abc123')
    const [header, item, payload] = String(init.body).split('\n').map((l) => JSON.parse(l) as Record<string, unknown>)
    expect(header.dsn).toBe(DSN)
    expect(item).toEqual({ type: 'event' })
    expect(payload.level).toBe('error')
    expect(payload.environment).toBe('review')
    expect(payload.tags).toEqual({ automation: 'payment_reconcile' })
    expect(String(init.body)).not.toContain('buyer@example.com')
    expect((payload.extra as Record<string, unknown>).amount).toBe(2000)
  })

  it('does nothing without a DSN', async () => {
    const fetchImpl = vi.fn()
    expect(await sendSentryEvent({ message: 'm', level: 'error' }, { env: {}, fetchImpl, logger: quiet() })).toBe('no-dsn')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('logs instead of sending in a dry run', async () => {
    const fetchImpl = vi.fn()
    const outcome = await sendSentryEvent({ message: 'm', level: 'error' }, { env: { SENTRY_DSN: DSN, AUTOMATION_DRY_RUN: 'true' }, fetchImpl, logger: quiet() })
    expect(outcome).toBe('dry-run')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('never throws on a refused or failed send', async () => {
    const refused = vi.fn(async () => new Response('no', { status: 429 }))
    expect(await sendSentryEvent({ message: 'm', level: 'error' }, { env: { SENTRY_DSN: DSN }, fetchImpl: refused, logger: quiet() })).toBe('failed')
    const broken = vi.fn(async () => {
      throw new Error('network down')
    })
    expect(await sendSentryEvent({ message: 'm', level: 'error' }, { env: { SENTRY_DSN: DSN }, fetchImpl: broken, logger: quiet() })).toBe('failed')
  })
})
