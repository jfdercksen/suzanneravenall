import { describe, it, expect } from 'vitest'
import { buildGaInitScript, isUsableGaId, sanitiseAnalyticsUrl } from './analytics'

describe('isUsableGaId', () => {
  it('accepts a real-looking GA4 measurement ID', () => {
    expect(isUsableGaId('G-AB12CD34EF')).toBe(true)
  })

  it.each(['', undefined, null, 'G-XXXXXXXXXX', 'G-XXXX', 'G-0000000000', 'UA-12345-1', 'G-abc123', "G-1'); alert(1); ('"])(
    'rejects missing, placeholder or malformed ID %s',
    (id) => {
      expect(isUsableGaId(id)).toBe(false)
    }
  )
})

const CASES: Array<[string, string]> = [
  // Quiz pages: the whole query string goes, token or not.
  ['https://suzanneravenall.com/explore/leadership/quiz?token=secret123', 'https://suzanneravenall.com/explore/leadership/quiz'],
  ['https://suzanneravenall.com/explore/leadership/quiz?utm_source=mail&token=secret123', 'https://suzanneravenall.com/explore/leadership/quiz'],
  ['https://suzanneravenall.com/explore/leadership/quiz/?ref=x#top', 'https://suzanneravenall.com/explore/leadership/quiz/'],
  // Any other page carrying a token param.
  ['https://suzanneravenall.com/portal?foo=1&token=abc', 'https://suzanneravenall.com/portal'],
  ['/explore/leadership/quiz?token=abc', '/explore/leadership/quiz'],
  // Ordinary pages keep their query (campaign tags etc.).
  ['https://suzanneravenall.com/shop?utm_source=fb', 'https://suzanneravenall.com/shop?utm_source=fb'],
  ['https://suzanneravenall.com/explore/leadership?utm_source=fb', 'https://suzanneravenall.com/explore/leadership?utm_source=fb'],
  ['https://suzanneravenall.com/explore/leadership/quiz', 'https://suzanneravenall.com/explore/leadership/quiz'],
  ['https://suzanneravenall.com/', 'https://suzanneravenall.com/'],
]

describe('sanitiseAnalyticsUrl', () => {
  it.each(CASES)('%s -> %s', (input, expected) => {
    expect(sanitiseAnalyticsUrl(input)).toBe(expected)
  })
})

// Runs the generated inline script against a fake window/document and returns
// what it pushed onto dataLayer.
function runInitScript(gaId: string, href: string, referrer = ''): unknown[][] {
  const script = buildGaInitScript(gaId)
  const fakeWindow: { dataLayer?: unknown[]; location: { href: string } } = { location: { href } }
  const fakeDocument = { referrer }
  new Function('window', 'document', 'dataLayer', `var dataLayer; ${script.replace('window.dataLayer = window.dataLayer || [];', 'window.dataLayer = window.dataLayer || []; dataLayer = window.dataLayer;')}`)(
    fakeWindow,
    fakeDocument,
    undefined
  )
  return (fakeWindow.dataLayer ?? []).map((args) => Array.from(args as ArrayLike<unknown>))
}

describe('buildGaInitScript', () => {
  it('returns an empty script for a placeholder ID so no hits are sent', () => {
    expect(buildGaInitScript('G-XXXXXXXXXX')).toBe('')
    expect(buildGaInitScript('')).toBe('')
  })

  it('never puts the quiz token into page_location or page_referrer', () => {
    const pushed = runInitScript(
      'G-AB12CD34EF',
      'https://suzanneravenall.com/explore/leadership/quiz?token=secret123',
      'https://suzanneravenall.com/explore/health-energy/quiz?token=other456'
    )
    const config = pushed.find((args) => args[0] === 'config')
    expect(config).toEqual([
      'config',
      'G-AB12CD34EF',
      {
        page_location: 'https://suzanneravenall.com/explore/leadership/quiz',
        page_referrer: 'https://suzanneravenall.com/explore/health-energy/quiz',
      },
    ])
    expect(JSON.stringify(pushed)).not.toMatch(/secret123|other456/)
  })

  it('leaves page_location to GA on ordinary pages', () => {
    const pushed = runInitScript('G-AB12CD34EF', 'https://suzanneravenall.com/shop?utm_source=fb')
    expect(pushed.find((args) => args[0] === 'config')).toEqual(['config', 'G-AB12CD34EF', {}])
  })

  it.each(CASES)('inline sanitiser matches sanitiseAnalyticsUrl for %s', (input, expected) => {
    // An absolute href is needed for window.location; relative cases go via the referrer.
    const pushed = runInitScript('G-AB12CD34EF', 'https://suzanneravenall.com/', input)
    const config = pushed.find((args) => args[0] === 'config') as [string, string, Record<string, string>]
    expect(config[2].page_referrer ?? input).toBe(expected)
  })
})
