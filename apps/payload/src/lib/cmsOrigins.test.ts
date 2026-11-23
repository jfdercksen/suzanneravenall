import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { dirname, join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { describe, expect, it } from 'vitest'
import { cmsOrigins } from './cmsOrigins'

/**
 * KI135 (23 Nov 2026): the CMS admin on the review box bounced to its login
 * page after every successful login. These tests run Payload's own cookie
 * check (payload/dist/auth/extractJWT.js, 3.83) against the csrf list Payload
 * ends up with, so they prove the cause and the fix without a database.
 */

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const payloadDist = dirname(require.resolve('payload'))
type Extract = (args: { headers: Headers; payload: unknown }) => string | null
const { extractJWT } = (await import(pathToFileURL(join(payloadDist, 'auth', 'extractJWT.js')).href)) as { extractJWT: Extract }

const REVIEW = 'http://169.239.180.49/cms'
const PRODUCTION = 'https://suzanneravenall.com/cms'
const TOKEN = 'header.payload.signature'

/** What Payload's sanitize step does: our csrf list, then serverURL pushed on (sanitize.js). */
function payloadWith(csrf: string[], serverURL: string) {
  return { config: { csrf: [...csrf, serverURL], cookiePrefix: 'payload', auth: { jwtOrder: ['JWT', 'Bearer', 'cookie'] } } }
}

function request(extra: Record<string, string>): Headers {
  return new Headers({ Cookie: `payload-token=${TOKEN}`, ...extra })
}

const todayConfig = (serverURL: string) => payloadWith([], serverURL) // payload.config.ts set no csrf
const fixedConfig = (serverURL: string) => payloadWith(cmsOrigins({ PAYLOAD_URL: serverURL }), serverURL)

describe('cmsOrigins', () => {
  it('turns the CMS addresses into bare origins, once each', () => {
    expect(cmsOrigins({ PAYLOAD_URL: REVIEW, PAYLOAD_PUBLIC_SERVER_URL: 'http://169.239.180.49/cms/' })).toEqual(['http://169.239.180.49'])
    expect(cmsOrigins({ PAYLOAD_URL: PRODUCTION })).toEqual(['https://suzanneravenall.com'])
  })

  it('leaves out empty and malformed values', () => {
    expect(cmsOrigins({ PAYLOAD_URL: '', PAYLOAD_PUBLIC_SERVER_URL: 'not a url' })).toEqual([])
    expect(cmsOrigins({})).toEqual([])
  })
})

describe("Payload's cookie check with the CMS csrf list (KI135)", () => {
  it('TODAY: refuses the login cookie on the review box, because the list holds the /cms path and Origin never does', () => {
    expect(extractJWT({ headers: request({ Origin: 'http://169.239.180.49' }), payload: todayConfig(REVIEW) })).toBeNull()
  })

  it('TODAY: refuses it on production over https too, for any request that carries an Origin (saves, server actions)', () => {
    expect(extractJWT({ headers: request({ Origin: 'https://suzanneravenall.com' }), payload: todayConfig(PRODUCTION) })).toBeNull()
  })

  it('FIXED: accepts the cookie from the CMS own origin on the review box and on production', () => {
    expect(extractJWT({ headers: request({ Origin: 'http://169.239.180.49' }), payload: fixedConfig(REVIEW) })).toBe(TOKEN)
    expect(extractJWT({ headers: request({ Origin: 'https://suzanneravenall.com' }), payload: fixedConfig(PRODUCTION) })).toBe(TOKEN)
  })

  it('FIXED: still refuses another site (production is not weakened)', () => {
    expect(extractJWT({ headers: request({ Origin: 'https://evil.example' }), payload: fixedConfig(PRODUCTION) })).toBeNull()
    expect(extractJWT({ headers: request({ Origin: 'http://169.239.180.49' }), payload: fixedConfig(PRODUCTION) })).toBeNull()
  })

  it('on production over https a page load is accepted by Sec-Fetch-Site, which browsers send there', () => {
    expect(extractJWT({ headers: request({ 'Sec-Fetch-Site': 'same-origin' }), payload: fixedConfig(PRODUCTION) })).toBe(TOKEN)
  })

  it('on plain http no list helps a page load (no Origin, no Sec-Fetch-Site): that is why the review box nginx adds the Origin', () => {
    expect(extractJWT({ headers: request({}), payload: fixedConfig(REVIEW) })).toBeNull()
    // What the review box nginx forwards for the same page load:
    expect(extractJWT({ headers: request({ Origin: 'http://169.239.180.49' }), payload: fixedConfig(REVIEW) })).toBe(TOKEN)
  })
})

describe('nginx: the missing Origin is supplied on the review box only', () => {
  const confDir = join(here, '..', '..', '..', '..', 'infra', 'nginx', 'conf.d')
  const review = readFileSync(join(confDir, 'ip-testing.conf'), 'utf8')
  const production = readFileSync(join(confDir, 'suzanneravenall.conf.disabled'), 'utf8')

  it('maps an empty Origin to the server own origin and keeps a real one', () => {
    expect(review).toMatch(/map \$http_origin \$cms_request_origin \{\s*""\s+"\$scheme:\/\/\$host";\s*default \$http_origin;\s*\}/)
  })

  it('sets it in the /cms location of the plain-http review server, and not in the https production config', () => {
    const cmsBlock = review.slice(review.indexOf('location /cms {'), review.indexOf('}', review.indexOf('location /cms {')))
    expect(cmsBlock).toContain('proxy_set_header Origin $cms_request_origin;')
    expect(production).not.toContain('cms_request_origin')
  })
})
