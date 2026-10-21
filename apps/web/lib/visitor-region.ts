// Which store region (and so which currency) a visitor gets. One rule, used by
// the middleware (first guess), /api/region (the cart), the shop page and the
// product page, so the card, the product page and the cart always agree.
// Design: DECISIONS.md D021.
//
// Precedence:
//   1. the sr_currency cookie: the visitor's own choice (switcher) or the
//      middleware's earlier guess
//   2. a geo header, if the stack ever gains one. NONE is present today: DNS
//      sits at Xneelo, no Cloudflare proxy, and the VPS nginx has no geoip
//      module (KI034)
//   3. Accept-Language: a ZA region tag or a South African language = ZAR,
//      anything else = USD
//   4. nothing to go on (crawlers, curl) = ZAR, the home currency
//
// MEDUSA_USD_REGION_ENABLED is the master switch: 'false' puts everyone on ZAR.
// Without NEXT_PUBLIC_MEDUSA_REGION_USD_ID there is no USD region to use, so
// that also means ZAR.

export type Currency = 'zar' | 'usd'

export const CURRENCY_COOKIE = 'sr_currency'
/** Set while the currency is the middleware's guess, cleared by a choice. */
export const CURRENCY_AUTO_COOKIE = 'sr_currency_auto'
export const CURRENCY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

const GEO_HEADERS = [
  'CF-IPCountry', // Cloudflare, if it is ever put in front
  'X-Vercel-IP-Country',
  'X-Geo-Country', // generic, if nginx gains geoip2 later
]

// Official South African languages other than English. Language alone is
// enough for these: an af or zu speaker is almost always in South Africa.
const SA_LANGUAGES = new Set(['af', 'zu', 'xh', 'st', 'tn', 'ts', 'ss', 've', 'nr', 'nso'])

interface HeaderReader {
  get(name: string): string | null
}

type Env = Record<string, string | undefined>

export function visitorCountry(headers: HeaderReader): string {
  for (const header of GEO_HEADERS) {
    const value = headers.get(header)?.trim().toUpperCase()
    // Cloudflare sends XX for anonymised/unknown IPs, T1 for Tor.
    if (value && value !== 'XX' && value !== 'T1') return value
  }
  return ''
}

/** ZAR for a South African browser language, USD for any other, ZAR when absent. */
export function currencyFromAcceptLanguage(value: string | null | undefined): Currency {
  const tags = (value ?? '')
    .split(',')
    .map((part) => part.split(';')[0]?.trim().toLowerCase() ?? '')
    .filter((tag) => tag !== '' && tag !== '*')
  if (tags.length === 0) return 'zar'
  const southAfrican = tags.some((tag) => {
    const [language, ...rest] = tag.split(/[-_]/)
    return rest.includes('za') || SA_LANGUAGES.has(language ?? '')
  })
  return southAfrican ? 'zar' : 'usd'
}

/** The guess from the request alone, ignoring any cookie and the master switch. */
export function detectCurrency(headers: HeaderReader): Currency {
  const country = visitorCountry(headers)
  if (country) return country === 'ZA' ? 'zar' : 'usd'
  return currencyFromAcceptLanguage(headers.get('Accept-Language'))
}

export function parseCurrency(value: string | null | undefined): Currency | null {
  const v = value?.trim().toLowerCase()
  return v === 'zar' || v === 'usd' ? v : null
}

/** USD can be offered: switched on and a USD region is configured. */
export function usdEnabled(env: Env = process.env): boolean {
  return env.MEDUSA_USD_REGION_ENABLED !== 'false' && Boolean(env.NEXT_PUBLIC_MEDUSA_REGION_USD_ID)
}

/** The currency this visitor sees and pays in. */
export function visitorCurrency(
  headers: HeaderReader,
  cookieValue: string | null | undefined,
  env: Env = process.env,
): Currency {
  if (!usdEnabled(env)) return 'zar'
  return parseCurrency(cookieValue) ?? detectCurrency(headers)
}

export function regionIdFor(currency: Currency, env: Env = process.env): string {
  const zarId = env.NEXT_PUBLIC_MEDUSA_REGION_ID ?? ''
  const usdId = env.NEXT_PUBLIC_MEDUSA_REGION_USD_ID ?? ''
  return currency === 'usd' && usdEnabled(env) ? usdId : zarId
}
