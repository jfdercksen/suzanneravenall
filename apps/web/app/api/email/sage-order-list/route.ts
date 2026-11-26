import { NextResponse, type NextRequest } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { sageOrderListSchema, sendSageOrderListEmail } from '@/lib/email/sage-order-list'
import { logError } from '@/lib/log'

/**
 * POST /api/email/sage-order-list - internal. Medusa's sage-order-list job
 * (AUTOMATION_SAGE_ORDER_LIST=code) posts the previous working day's orders;
 * this sends the bookkeeper's mail with a CSV attachment. Needs the
 * x-webhook-secret header (INTERNAL_WEBHOOK_SECRET or N8N_WEBHOOK_SECRET).
 *
 * 200 { emailId }, 401 bad secret, 400 bad body, 500 when Brevo refuses.
 */

export const dynamic = 'force-dynamic'

function secretsMatch(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}

export async function POST(request: NextRequest) {
  const secrets = [process.env.INTERNAL_WEBHOOK_SECRET, process.env.N8N_WEBHOOK_SECRET].filter(
    (s): s is string => Boolean(s),
  )
  if (secrets.length === 0) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  const incoming = request.headers.get('x-webhook-secret') ?? ''
  if (!secrets.some((s) => secretsMatch(incoming, s))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = sageOrderListSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const emailId = await sendSageOrderListEmail(parsed.data)
    return NextResponse.json({ emailId })
  } catch (err: unknown) {
    logError('[sage-order-list] Failed to send email', err, { window: parsed.data.windowLabel })
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
