import { NextResponse, type NextRequest } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { z } from 'zod'
import { sendMembershipWelcomeEmail } from '@/lib/email/membership-welcome'
import { tierLabel } from '@/lib/access/tiers'

const bodySchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(100).nullable().optional(),
  tier: z.enum(['free', 'silver', 'gold', 'practitioner']),
})

// Hash both values to equal-length digests before comparing so that the
// timingSafeEqual call cannot leak the length of the expected secret.
function secretsMatch(a: string, b: string): boolean {
  try {
    const hashA = createHash('sha256').update(a).digest()
    const hashB = createHash('sha256').update(b).digest()
    return timingSafeEqual(hashA, hashB)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const incomingSecret = request.headers.get('x-webhook-secret') ?? ''
  if (!secretsMatch(incomingSecret, webhookSecret)) {
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
    return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 422 })
  }

  const { email, firstName, tier } = parsed.data
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://suzanneravenall.com'

  try {
    const emailId = await sendMembershipWelcomeEmail({
      email,
      firstName: firstName ?? null,
      tier,
      tierLabel: tierLabel(tier),
      siteUrl,
    })

    return NextResponse.json({ emailId })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[membership-welcome] Failed to send email:', message)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
