import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { rejectUnlessInternal } from '@/lib/intake/internal-auth'
import { cancelIntakesForOrder } from '@/lib/intake/service'
import { IntakeStoreError } from '@/lib/intake/store'
import { logError } from '@/lib/log'

/**
 * POST /api/intake/cancel - internal, from Medusa's order-canceled-intake
 * subscriber. Closes the order's open intake forms so no more reminders go
 * (H-12). Completed forms are kept. Idempotent.
 *
 * 200 { closed }; 401 bad secret; 422 bad body; 503 table missing; 500 otherwise.
 */

export const dynamic = 'force-dynamic'

const bodySchema = z.object({ orderId: z.string().min(1).max(100) })

export async function POST(request: NextRequest) {
  const rejected = rejectUnlessInternal(request)
  if (rejected) return rejected

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request body' }, { status: 422 })

  try {
    return NextResponse.json({ closed: await cancelIntakesForOrder(parsed.data.orderId) })
  } catch (err) {
    logError('[intake] cancel failed', err, { orderId: parsed.data.orderId })
    const missing = err instanceof IntakeStoreError && err.missingTable
    return NextResponse.json({ error: missing ? 'Intake table missing' : 'Cancel failed' }, { status: missing ? 503 : 500 })
  }
}
