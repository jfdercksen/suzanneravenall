import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'

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

const N8N_BASE_URL = (process.env.N8N_WEBHOOK_URL ?? 'http://n8n:5678').replace(/\/$/, '')

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.CALCOM_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[calcom webhook] CALCOM_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const rawBody = await request.text()

  // Cal.com signature header: "sha256=<hex>"
  const signatureHeader = request.headers.get('X-Cal-Signature-256')
  if (!signatureHeader) {
    console.error('[calcom webhook] Missing X-Cal-Signature-256 header')
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

  // Only forward booking creation events — ignore cancellations, reschedules, etc.
  if (triggerEvent === 'BOOKING_CREATED') {
    void fetch(`${N8N_BASE_URL}/webhook/calcom-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rawBody,
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[calcom webhook] n8n forward failed: ${message}`)
    })
  }

  // Return 200 immediately — never block Cal.com
  return NextResponse.json({ ok: true })
}
