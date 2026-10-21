import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { isEmailConfigured } from '@/lib/email/send'
import { rejectUnlessInternal } from '@/lib/intake/internal-auth'
import { createIntakesForOrder } from '@/lib/intake/service'
import { IntakeStoreError } from '@/lib/intake/store'
import { logError } from '@/lib/log'

/**
 * POST /api/intake/orders - internal, from Medusa's order-placed-intake
 * subscriber. Creates one intake record per service in the order and sends
 * the first mail with the personal link (H-12). Idempotent per (order, service).
 *
 * 200 { records } done; 401 bad secret; 422 bad body; 503 the table or the
 * mail provider is missing; 500 a mail or Payload failed (Medusa retries).
 */

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  orderId: z.string().min(1).max(100),
  displayId: z.union([z.string(), z.number()]).nullable().optional(),
  // Loose on purpose: Medusa accepted the address, and Brevo checks it again.
  email: z.string().trim().regex(/^[^\s@]+@[^\s@]+$/).max(254),
  firstName: z.string().max(200).nullable().optional(),
  lastName: z.string().max(200).nullable().optional(),
  placedAt: z.string().datetime({ offset: true }).nullable().optional(),
  lines: z
    .array(
      z.object({
        handle: z.string().min(1).max(300),
        title: z.string().max(300),
        session: z.boolean(),
      }),
    )
    .max(100),
})

function orNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

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
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 422 })
  }
  if (!isEmailConfigured()) return NextResponse.json({ error: 'Email is not configured' }, { status: 503 })

  const { orderId, displayId, email, firstName, lastName, placedAt, lines } = parsed.data
  try {
    const result = await createIntakesForOrder({
      orderId,
      displayId: displayId == null ? null : String(displayId),
      email: email.trim(),
      firstName: orNull(firstName),
      lastName: orNull(lastName),
      placedAt: placedAt ? new Date(placedAt) : null,
      lines: lines.map((l) => ({ handle: l.handle.trim(), title: l.title.trim(), session: l.session })),
    })
    if (result.failed > 0) {
      return NextResponse.json({ error: 'An intake mail could not be sent', records: result.records }, { status: 500 })
    }
    return NextResponse.json({ records: result.records })
  } catch (err) {
    logError('[intake] order intake failed', err, { orderId })
    const missing = err instanceof IntakeStoreError && err.missingTable
    return NextResponse.json({ error: missing ? 'Intake table missing' : 'Intake failed' }, { status: missing ? 503 : 500 })
  }
}
