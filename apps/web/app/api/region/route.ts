import { type NextRequest, NextResponse } from 'next/server'

// Geo headers, in priority order. NONE of these are present in the current
// stack: DNS sits at Xneelo (ns1.host-h.net), there is no Cloudflare proxy in
// front, and the VPS nginx is built without the geoip module. So `country` is
// empty for every real visitor — which is exactly how the whole catalogue
// became un-buyable: the old code read "not ZA" from that empty string and put
// every visitor, South Africans included, into the USD region, where only 84 of
// 207 variants have a price. Medusa's add-to-cart workflow then 500s with
// "Cannot read properties of undefined (reading 'calculated_amount')".
//
// The rule is now: ZAR unless we POSITIVELY know otherwise. Unknown resolves to
// ZAR, which is priced for all 207 variants and is the right default for a
// South African business.
const GEO_HEADERS = [
  'CF-IPCountry', // Cloudflare, if it is ever put in front
  'X-Vercel-IP-Country',
  'X-Geo-Country', // generic, if nginx gains geoip2 later
]

export async function GET(request: NextRequest) {
  const zarId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID ?? ''
  const usdId = process.env.NEXT_PUBLIC_MEDUSA_REGION_USD_ID ?? ''

  // USD stays off until the remaining 123 variants carry a USD price (KI034).
  // Without this gate, simply putting Cloudflare in front of the site would
  // silently re-break add-to-cart for most of the catalogue.
  const usdEnabled = process.env.MEDUSA_USD_REGION_ENABLED === 'true'

  let country = ''
  for (const header of GEO_HEADERS) {
    const value = request.headers.get(header)?.trim().toUpperCase()
    // Cloudflare sends XX for anonymised/unknown IPs, T1 for Tor.
    if (value && value !== 'XX' && value !== 'T1') {
      country = value
      break
    }
  }

  const wantsUsd = usdEnabled && country !== '' && country !== 'ZA'
  const regionId = wantsUsd && usdId ? usdId : zarId

  return NextResponse.json({ regionId, country: country || null })
}
