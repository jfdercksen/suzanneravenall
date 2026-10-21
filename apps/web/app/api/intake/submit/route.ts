import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { submitIntake, TOKEN_RE } from '@/lib/intake/service'
import { logError } from '@/lib/log'

/**
 * POST /api/intake/submit - public, from the /intake/<token> page. The token
 * is the credential (32 random bytes, only in the client's mail). Saves the
 * answers once, closes the form and mails it to the team (H-12).
 *
 * 200 { status: 'completed' }; 400 bad JSON; 404 unknown token; 409 already
 * sent; 410 link expired; 413 too large; 422 { errors } per question; 503 the
 * form or the database cannot be read right now.
 */

export const dynamic = 'force-dynamic'

/** Far above a full form (40 questions at their length caps is about 130 KB). */
const MAX_BODY_BYTES = 256_000

const answerSchema = z.object({
  value: z.union([z.string(), z.array(z.string()).max(100)]).optional(),
  detail: z.string().optional(),
})

const bodySchema = z.object({
  token: z.string().regex(TOKEN_RE),
  acknowledged: z.boolean().optional(),
  answers: z.record(z.string().max(100), answerSchema),
})

const STATUS_CODE = { not_found: 404, already_completed: 409, expired: 410, unavailable: 503 } as const

export async function POST(request: NextRequest) {
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_BODY_BYTES) return NextResponse.json({ error: 'Form too large' }, { status: 413 })
  const raw = await request.text()
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) return NextResponse.json({ error: 'Form too large' }, { status: 413 })

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  try {
    const result = await submitIntake(parsed.data.token, {
      acknowledged: parsed.data.acknowledged,
      answers: parsed.data.answers,
    })
    if (result.status === 'completed') return NextResponse.json({ status: 'completed' })
    if (result.status === 'invalid') return NextResponse.json({ status: 'invalid', errors: result.errors }, { status: 422 })
    return NextResponse.json({ status: result.status }, { status: STATUS_CODE[result.status] })
  } catch (err) {
    logError('[intake] submit failed', err)
    return NextResponse.json({ status: 'unavailable' }, { status: 503 })
  }
}
