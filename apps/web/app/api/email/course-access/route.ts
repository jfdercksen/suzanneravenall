import { NextResponse, type NextRequest } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { z } from 'zod'
import { sendCourseAccessEmail } from '@/lib/email/course-access'
import { logError } from '@/lib/log'

/**
 * POST /api/email/course-access - internal. Medusa's Thinkific automation
 * calls it once the buyer is enrolled (AUTOMATION_THINKIFIC=code). Needs the
 * x-webhook-secret header: INTERNAL_WEBHOOK_SECRET or N8N_WEBHOOK_SECRET,
 * whichever the caller has (the medusa container sends the first one set).
 *
 * 200 { emailId } on success, 401 on a bad secret, 422 on a bad body, 500 when
 * Brevo refuses (Medusa retries those).
 */

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(200),
  courses: z.array(z.string().min(1).max(300)).min(1).max(50),
  orderId: z.string().max(100).optional(),
  displayId: z.union([z.string(), z.number()]).nullable().optional(),
})

function secretsMatch(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}

export async function POST(request: NextRequest) {
  const secrets = [process.env.INTERNAL_WEBHOOK_SECRET, process.env.N8N_WEBHOOK_SECRET].filter(
    (s): s is string => Boolean(s)
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

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 422 })
  }

  try {
    const emailId = await sendCourseAccessEmail({
      email: parsed.data.email,
      firstName: parsed.data.firstName,
      courses: parsed.data.courses,
    })
    return NextResponse.json({ emailId })
  } catch (err: unknown) {
    logError('[course-access] Failed to send email', err, { orderId: parsed.data.orderId })
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
