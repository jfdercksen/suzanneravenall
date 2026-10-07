// Which store region (and so which currency) a visitor gets. Shared by
// /api/region (the cart) and the shop page (the "from" price on each card), so
// the card, the product page and the cart always agree.
//
// Geo headers, in priority order. NONE of these are present in the current
// stack: DNS sits at Xneelo (ns1.host-h.net), there is no Cloudflare proxy in
// front, and the VPS nginx is built without the geoip module. So `country` is
// empty for every real visitor. The old code read "not ZA" from that empty
// string and put every visitor, South Africans included, into the USD region,
// where only 84 of 207 variants have a price (add-to-cart 500s); the shop page
// kept that old rule and showed "$555" cards to South Africans (6 Oct).
//
// The rule: ZAR unless we POSITIVELY know otherwise. Unknown resolves to ZAR,
// which is priced for all variants and is the right default for a South
// African business.
const GEO_HEADERS = [
  'CF-IPCountry', // Cloudflare, if it is ever put in front
  'X-Vercel-IP-Country',
  'X-Geo-Country', // generic, if nginx gains geoip2 later
]

interface HeaderReader {
  get(name: string): string | null
}

export function visitorCountry(headers: HeaderReader): string {
  for (const header of GEO_HEADERS) {
    const value = headers.get(header)?.trim().toUpperCase()
    // Cloudflare sends XX for anonymised/unknown IPs, T1 for Tor.
    if (value && value !== 'XX' && value !== 'T1') return value
  }
  return ''
}

/**
 * True only when USD is switched on and the visitor is known to be outside
 * South Africa. USD stays off until the remaining variants carry a USD price
 * (KI034); without this gate, simply putting Cloudflare in front of the site
 * would silently re-break add-to-cart for most of the catalogue.
 */
export function visitorWantsUsd(headers: HeaderReader, env: Record<string, string | undefined> = process.env): boolean {
  const country = visitorCountry(headers)
  return env.MEDUSA_USD_REGION_ENABLED === 'true' && country !== '' && country !== 'ZA'
}
