import { NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'

/**
 * The internal intake routes are called by Medusa only, with x-webhook-secret
 * = INTERNAL_WEBHOOK_SECRET or N8N_WEBHOOK_SECRET (whichever the container
 * has), like /api/email/course-access. A missing secret is a server error,
 * never an open door.
 */

function secretsMatch(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}

/** null when the caller may proceed, else the response to return. */
export function rejectUnlessInternal(request: Request): NextResponse | null {
  const secrets = [process.env.INTERNAL_WEBHOOK_SECRET, process.env.N8N_WEBHOOK_SECRET].filter(
    (s): s is string => Boolean(s),
  )
  if (secrets.length === 0) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  const incoming = request.headers.get('x-webhook-secret') ?? ''
  if (!secrets.some((s) => secretsMatch(incoming, s))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return null
}
