import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const country = request.headers.get('CF-IPCountry') ?? ''
  const zarId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID ?? ''
  const usdId = process.env.NEXT_PUBLIC_MEDUSA_REGION_USD_ID ?? ''
  // South Africa gets ZAR; every other country gets USD (falls back to ZAR if USD not configured)
  const regionId = country === 'ZA' ? zarId : (usdId || zarId)
  return NextResponse.json({ regionId })
}
