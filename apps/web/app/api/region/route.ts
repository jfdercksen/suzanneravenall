import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ipCountry } from '@/lib/geoip'
import {
  CURRENCY_AUTO_COOKIE,
  CURRENCY_COOKIE,
  CURRENCY_COOKIE_MAX_AGE,
  currencyForCountry,
  regionIdFor,
  usdEnabled,
  visitorCurrency,
  visitorLocation,
} from '@/lib/visitor-region'

// The visitor's currency and the Medusa region that goes with it. The rule
// and its history live in lib/visitor-region.ts; the design is D021.
export async function GET(request: NextRequest) {
  const country = visitorLocation(request.headers, ipCountry(request.headers))
  const currency = visitorCurrency(request.headers, request.cookies.get(CURRENCY_COOKIE)?.value, process.env, country)
  return NextResponse.json({
    regionId: regionIdFor(currency),
    currency,
    country: country || null,
    usdEnabled: usdEnabled(),
    // True only while the location is unknown and the currency is still a
    // browser-language guess: the client may then correct it once (time zone).
    auto:
      !country &&
      (!request.cookies.get(CURRENCY_COOKIE) || request.cookies.get(CURRENCY_AUTO_COOKIE)?.value === '1'),
  })
}

const bodySchema = z.object({ currency: z.enum(['zar', 'usd']) })

// Records a currency when the location is unknown: the time-zone correction,
// or a cart-recovery link opening a cart in the other currency. Where the
// location is known it decides and the request cannot change it, so there is
// no way to pick the cheaper currency.
export async function POST(request: NextRequest) {
  let requested: z.infer<typeof bodySchema>['currency']
  try {
    requested = bodySchema.parse(await request.json()).currency
  } catch {
    return NextResponse.json({ error: 'currency must be zar or usd' }, { status: 400 })
  }
  const located = currencyForCountry(visitorLocation(request.headers, ipCountry(request.headers)))
  const effective = !usdEnabled() ? 'zar' : (located ?? requested)
  const res = NextResponse.json({ regionId: regionIdFor(effective), currency: effective })
  res.cookies.set(CURRENCY_COOKIE, effective, {
    path: '/',
    maxAge: CURRENCY_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: request.headers.get('x-forwarded-proto') === 'https' || request.nextUrl.protocol === 'https:',
  })
  res.cookies.delete(CURRENCY_AUTO_COOKIE)
  return res
}
