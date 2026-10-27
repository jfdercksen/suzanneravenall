import type { NextRequest } from 'next/server'
import { handleBookingCredit } from '@/lib/staff/booking-credit'

// The button on /staff/booking/<token> (D024); see lib/staff/booking-credit.ts.
export async function POST(request: NextRequest) {
  return handleBookingCredit(request)
}
