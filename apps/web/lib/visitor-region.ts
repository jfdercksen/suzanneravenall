// Which store region (and so which currency) a visitor gets. One rule, used by
// the middleware (first guess), /api/region (the cart), the shop page and the
// product page, so the card, the product page and the cart always agree.
// Design: DECISIONS.md D021.
//
// The currency follows the visitor's location, with no choice offered
// (Johan, 21 Oct: South Africa = ZAR, everywhere else = USD). Precedence:
//   1. Cloudflare's CF-IPCountry, only with TRUST_CF_IPCOUNTRY=true (cutover)
//   2. the country of the visitor's IP address (lib/geoip.ts, DB-IP Lite on
//      the box; the caller passes it in, because the edge middleware cannot
//      read the database)
//   3. only when the location is unknown: the sr_currency cookie (an earlier
//      guess), else Accept-Language (a ZA region tag or a South African
//      language = ZAR, anything else = USD), else ZAR, the home currency
//
// MEDUSA_USD_REGION_ENABLED is the master switch: 'false' puts everyone on ZAR.
// Without NEXT_PUBLIC_MEDUSA_REGION_USD_ID there is no USD region to use, so
// that also means ZAR.

export type Currency = 'zar' | 'usd'

export const CURRENCY_COOKIE = 'sr_currency'
/** Set while the currency is the middleware's guess, cleared by a choice. */
export const CURRENCY_AUTO_COOKIE = 'sr_currency_auto'
export const CURRENCY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

// A visitor can send any header they like, so a geo header is trusted only
// once a proxy that sets it sits in front: TRUST_CF_IPCOUNTRY=true when
// Cloudflare proxies the site (and nginx then takes the client IP from
// CF-Connecting-IP, D021). Until then the IP lookup (lib/geoip.ts) decides.
const GEO_HEADER = 'CF-IPCountry'

// Official South African languages other than English. Language alone is
// enough for these: an af or zu speaker is almost always in South Africa.
const SA_LANGUAGES = new Set(['af', 'zu', 'xh', 'st', 'tn', 'ts', 'ss', 've', 'nr', 'nso'])

interface HeaderReader {
  get(name: string): string | null
}

type Env = Record<string, string | undefined>

export function visitorCountry(headers: HeaderReader, env: Env = process.env): string {
  if (env.TRUST_CF_IPCOUNTRY !== 'true') return ''
  const value = headers.get(GEO_HEADER)?.trim().toUpperCase()
  // Cloudflare sends XX for anonymised/unknown IPs, T1 for Tor.
  return value && value !== 'XX' && value !== 'T1' ? value : ''
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
export function detectCurrency(headers: HeaderReader, env: Env = process.env): Currency {
  const country = visitorCountry(headers, env)
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

/** ZAR for South Africa, USD for any other known country, null when unknown. */
export function currencyForCountry(country: string | null | undefined): Currency | null {
  const c = country?.trim().toUpperCase()
  if (!c) return null
  return c === 'ZA' ? 'zar' : 'usd'
}

/** The country the visitor is in: a geo header, else their IP's country. */
export function visitorLocation(headers: HeaderReader, ipCountryCode?: string | null, env: Env = process.env): string {
  return visitorCountry(headers, env) || (ipCountryCode?.trim().toUpperCase() ?? '')
}

/** The currency this visitor sees and pays in. */
export function visitorCurrency(
  headers: HeaderReader,
  cookieValue: string | null | undefined,
  env: Env = process.env,
  ipCountryCode?: string | null,
): Currency {
  if (!usdEnabled(env)) return 'zar'
  return (
    currencyForCountry(visitorLocation(headers, ipCountryCode, env)) ??
    parseCurrency(cookieValue) ??
    detectCurrency(headers, env)
  )
}

export function regionIdFor(currency: Currency, env: Env = process.env): string {
  const zarId = env.NEXT_PUBLIC_MEDUSA_REGION_ID ?? ''
  const usdId = env.NEXT_PUBLIC_MEDUSA_REGION_USD_ID ?? ''
  return currency === 'usd' && usdEnabled(env) ? usdId : zarId
}
