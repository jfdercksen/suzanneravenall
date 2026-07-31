import { describe, it, expect } from 'vitest'
import { scrubTokenParam, scrubSentryEvent } from './sentry-scrub'

describe('scrubTokenParam', () => {
  it('redacts a token query param on an absolute URL', () => {
    const result = scrubTokenParam('https://suzanneravenall.com/explore/foo/quiz?token=supersecret123')
    expect(result).toContain('token=%5Bredacted%5D')
    expect(result).not.toContain('supersecret123')
  })

  it('leaves URLs without a token param unchanged', () => {
    const result = scrubTokenParam('https://suzanneravenall.com/explore/foo')
    expect(result).toBe('https://suzanneravenall.com/explore/foo')
  })

  it('preserves other query params alongside a redacted token', () => {
    const result = scrubTokenParam('https://suzanneravenall.com/explore/foo/quiz?utm_source=x&token=abc123')
    expect(result).toContain('utm_source=x')
    expect(result).not.toContain('abc123')
  })

  it('falls back to a regex strip for non-parseable/relative URLs', () => {
    const result = scrubTokenParam('/explore/foo/quiz?token=abc123')
    expect(result).toBe('/explore/foo/quiz?token=[redacted]')
  })
})

describe('scrubSentryEvent', () => {
  it('scrubs the top-level request URL', () => {
    const event = { request: { url: 'https://suzanneravenall.com/explore/foo/quiz?token=abc123' } }
    const result = scrubSentryEvent(event)
    expect(result.request!.url).not.toContain('abc123')
  })

  it('scrubs breadcrumb URLs', () => {
    const event = {
      breadcrumbs: [
        { data: { url: 'https://suzanneravenall.com/explore/foo/quiz?token=abc123' } },
        { data: { url: 'https://suzanneravenall.com/about' } },
      ],
    }
    const result = scrubSentryEvent(event)
    // The event literal above has exactly 2 breadcrumb entries, each with a data.url — safe to assert non-null
    expect(result.breadcrumbs![0]!.data!.url).not.toContain('abc123')
    expect(result.breadcrumbs![1]!.data!.url).toBe('https://suzanneravenall.com/about')
  })

  it('handles an event with no request or breadcrumbs', () => {
    const event = {}
    expect(() => scrubSentryEvent(event)).not.toThrow()
  })
})
