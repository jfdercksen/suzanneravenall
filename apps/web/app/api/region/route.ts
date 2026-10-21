import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  CURRENCY_AUTO_COOKIE,
  CURRENCY_COOKIE,
  CURRENCY_COOKIE_MAX_AGE,
  regionIdFor,
  usdEnabled,
  visitorCountry,
  visitorCurrency,
} from '@/lib/visitor-region'

// The visitor's currency and the Medusa region that goes with it. The rule
// and its history live in lib/visitor-region.ts; the design is D021.
export async function GET(request: NextRequest) {
  const currency = visitorCurrency(request.headers, request.cookies.get(CURRENCY_COOKIE)?.value)
  const country = visitorCountry(request.headers)
  return NextResponse.json({
    regionId: regionIdFor(currency),
    currency,
    country: country || null,
    usdEnabled: usdEnabled(),
    // True while the currency is still a guess: no cookie yet, or the one the
    // middleware wrote. The client may then correct it once (time zone).
    auto: !request.cookies.get(CURRENCY_COOKIE) || request.cookies.get(CURRENCY_AUTO_COOKIE)?.value === '1',
  })
}

const bodySchema = z.object({ currency: z.enum(['zar', 'usd']) })

// The visitor's choice (the switcher, or a cart-recovery link opening a cart
// in the other currency). Sets the cookie the server-rendered prices read.
export async function POST(request: NextRequest) {
  let currency: z.infer<typeof bodySchema>['currency']
  try {
    currency = bodySchema.parse(await request.json()).currency
  } catch {
    return NextResponse.json({ error: 'currency must be zar or usd' }, { status: 400 })
  }
  // With USD off there is only one currency to choose.
  const effective = usdEnabled() ? currency : 'zar'
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
