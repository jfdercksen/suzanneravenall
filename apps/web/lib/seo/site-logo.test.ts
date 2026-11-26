import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { SITE_LOGO_PATH, siteLogoUrl } from './site-logo'

describe('site logo for the Organization JSON-LD', () => {
  it('points at a file that exists in public/', () => {
    expect(existsSync(join(__dirname, '..', '..', 'public', SITE_LOGO_PATH))).toBe(true)
  })

  it('builds the absolute URL on the live domain by default', () => {
    expect(siteLogoUrl()).toBe('https://suzanneravenall.com/logos/logo-black.svg')
  })

  it('drops a trailing slash on the origin', () => {
    expect(siteLogoUrl('https://example.test/')).toBe('https://example.test/logos/logo-black.svg')
  })
})
