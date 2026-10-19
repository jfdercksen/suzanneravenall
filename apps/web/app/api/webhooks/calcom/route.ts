import { after, NextResponse, type NextRequest } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { logError } from '@/lib/log'
import { runCalcomBookingSync } from '@/lib/integrations/calcom-booking'

// Cal.com sends X-Cal-Signature-256: sha256=<hex> (HMAC-SHA256 of raw body)
// Docs: https://cal.com/docs/core-features/webhooks

const CalcomPayloadSchema = z.object({
  triggerEvent: z.string(),
  payload: z
    .object({
      uid: z.string().optional(),
      title: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      attendees: z
        .array(
          z.object({
            email: z.string().email(),
            name: z.string().optional(),
          })
        )
        .optional(),
      bookerEmail: z.string().email().optional(),
      bookerName: z.string().optional(),
    })
    .passthrough()
    .optional(),
})

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.CALCOM_WEBHOOK_SECRET
  if (!webhookSecret) {
    logError('[calcom webhook] CALCOM_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const rawBody = await request.text()

  // Cal.com signature header: "sha256=<hex>"
  const signatureHeader = request.headers.get('X-Cal-Signature-256')
  if (!signatureHeader) {
    logError('[calcom webhook] Missing X-Cal-Signature-256 header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  const signatureHex = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice(7)
    : signatureHeader

  // Compare raw digest bytes (32 bytes) — not hex strings — to avoid edge cases
  // with malformed hex input silently producing zero-length buffers
  const expectedBuf = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest()

  let signaturesMatch = false
  try {
    const sigBuf = Buffer.from(signatureHex, 'hex')
    if (sigBuf.length === expectedBuf.length) {
      signaturesMatch = crypto.timingSafeEqual(sigBuf, expectedBuf)
    }
  } catch {
    signaturesMatch = false
  }

  if (!signaturesMatch) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let rawPayload: unknown
  try {
    rawPayload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CalcomPayloadSchema.safeParse(rawPayload)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { triggerEvent } = parsed.data

  // Only booking creation reaches Vtiger; cancellations, reschedules etc. are
  // acknowledged and ignored. The sync runs after the response is sent, so
  // Cal.com never waits on the CRM (it retries slow webhooks).
  if (triggerEvent === 'BOOKING_CREATED') {
    after(() => runCalcomBookingSync(rawPayload).then(() => undefined))
  }

  // Return 200 immediately — never block Cal.com
  return NextResponse.json({ ok: true })
}
