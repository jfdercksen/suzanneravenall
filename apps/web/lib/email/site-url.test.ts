import { afterEach, describe, expect, it, vi } from 'vitest'
import { siteUrl, DEFAULT_SITE_URL } from './site-url'

describe('siteUrl (site check M14)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses NEXT_PUBLIC_SITE_URL when set, without a trailing slash', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://staging.example.test/')
    expect(siteUrl()).toBe('https://staging.example.test')
  })

  it('falls back to the real domain when the variable is set but empty', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    expect(siteUrl()).toBe(DEFAULT_SITE_URL)
  })

  it('falls back to the real domain when the variable is only whitespace', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '   ')
    expect(siteUrl()).toBe(DEFAULT_SITE_URL)
  })
})
