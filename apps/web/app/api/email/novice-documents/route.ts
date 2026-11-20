import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { isNoviceLevel, membershipBySku } from '@suzanne/integrations'
import { sendNoviceDocumentsEmail } from '@/lib/email/novice'
import { rejectUnlessInternal } from '@/lib/intake/internal-auth'
import { logError } from '@/lib/log'

/**
 * POST /api/email/novice-documents (Medusa order-placed only): after a paid
 * Novice order, the list of what the member uploads at /portal/novice
 * (Suzanne, 19 Nov 2026).
 */
const bodySchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(100).nullable().optional(),
  sku: z.string().regex(/^S0\d{3}$/i),
})

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

  const level = membershipBySku(parsed.data.sku)
  if (!level || !isNoviceLevel(level)) return NextResponse.json({ error: 'Not a Novice level' }, { status: 422 })

  try {
    const emailId = await sendNoviceDocumentsEmail({ email: parsed.data.email, firstName: parsed.data.firstName ?? null, sku: level.sku })
    return NextResponse.json({ emailId })
  } catch (err: unknown) {
    logError('[novice-documents] Failed to send email:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
