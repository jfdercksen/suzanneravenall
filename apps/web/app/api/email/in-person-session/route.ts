import { NextResponse, type NextRequest } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { z } from 'zod'
import { sendInPersonSessionNotice } from '@/lib/email/in-person-session'
import { logError } from '@/lib/log'

/**
 * POST /api/email/in-person-session - internal. Medusa's order-placed
 * subscriber calls it when an order holds an in-person session: those are
 * never self-booked, so the team gets who bought what and contacts the client
 * to agree the day. Needs the x-webhook-secret header (INTERNAL_WEBHOOK_SECRET
 * or N8N_WEBHOOK_SECRET). Recipient: IN_PERSON_NOTIFY_EMAIL, else
 * CONTACT_NOTIFY_EMAIL, else support@ravenallinstitute.com.
 *
 * 200 { emailId }, 401 bad secret, 400 bad body, 500 config error or Brevo refused.
 */

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  orderId: z.string().max(100).optional(),
  displayId: z.number().int().nonnegative().nullable().optional(),
  reference: z.string().min(1).max(40),
  customerName: z.string().max(300).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(60).nullable().optional(),
  orderDate: z.string().max(40).nullable().optional(),
  lines: z
    .array(
      z.object({
        product: z.string().max(300),
        variant: z.string().max(300).nullable().optional(),
        quantity: z.number().int().min(1).max(1000),
      })
    )
    .min(1)
    .max(50),
})

function secretsMatch(a: string, b: string): boolean {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest())
}

export async function POST(request: NextRequest) {
  const secrets = [process.env.INTERNAL_WEBHOOK_SECRET, process.env.N8N_WEBHOOK_SECRET].filter((s): s is string => Boolean(s))
  if (secrets.length === 0) {
    logError('[email/in-person-session] no webhook secret is set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  const incoming = request.headers.get('x-webhook-secret') ?? ''
  if (!incoming || !secrets.some((s) => secretsMatch(incoming, s))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const d = parsed.data

  try {
    const emailId = await sendInPersonSessionNotice({
      reference: d.reference,
      displayId: d.displayId ?? null,
      customerName: d.customerName?.trim() || null,
      email: d.email ?? null,
      phone: d.phone?.trim() || null,
      orderDate: d.orderDate ?? null,
      lines: d.lines.map((l) => ({ product: l.product, variant: l.variant ?? null, quantity: l.quantity })),
    })
    return NextResponse.json({ emailId })
  } catch (err: unknown) {
    logError('[email/in-person-session] Failed to send notice', err, { orderId: d.orderId })
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
