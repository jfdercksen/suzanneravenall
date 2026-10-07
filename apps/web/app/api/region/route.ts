import { type NextRequest, NextResponse } from 'next/server'
import { visitorCountry, visitorWantsUsd } from '@/lib/visitor-region'

// ZAR unless we positively know the visitor is outside South Africa and USD is
// switched on. The rule and its history live in lib/visitor-region.ts.
export async function GET(request: NextRequest) {
  const zarId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID ?? ''
  const usdId = process.env.NEXT_PUBLIC_MEDUSA_REGION_USD_ID ?? ''

  const country = visitorCountry(request.headers)
  const regionId = visitorWantsUsd(request.headers) && usdId ? usdId : zarId

  return NextResponse.json({ regionId, country: country || null })
}
