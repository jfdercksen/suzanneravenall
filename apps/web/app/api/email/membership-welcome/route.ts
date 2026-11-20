import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { isNoviceLevel, isSellableLevel, membershipBySku, membershipProgrammeName } from '@suzanne/integrations'
import { formatRenewalDate, sendMembershipWelcomeEmail } from '@/lib/email/membership-welcome'
import { siteUrl } from '@/lib/email/site-url'
import { rejectUnlessInternal } from '@/lib/intake/internal-auth'
import { logError } from '@/lib/log'

/**
 * POST /api/email/membership-welcome (Medusa order-placed only): the welcome
 * email when a paid level starts (KI128). Body: the member's email and first
 * name, the level's SKU and the end of the year. A Novice's welcome is sent
 * by the staff approval instead, so a Novice SKU is refused here.
 */
const bodySchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(100).nullable().optional(),
  sku: z.string().regex(/^S0\d{3}$/i),
  renewalDate: z.string().datetime(),
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
  if (!level || !isSellableLevel(level) || isNoviceLevel(level)) {
    return NextResponse.json({ error: 'Not a paid level' }, { status: 422 })
  }

  try {
    const emailId = await sendMembershipWelcomeEmail({
      email: parsed.data.email,
      firstName: parsed.data.firstName ?? null,
      levelTitle: level.title,
      programmeName: membershipProgrammeName(level),
      renewalDate: formatRenewalDate(parsed.data.renewalDate),
      siteUrl: siteUrl(),
    })
    return NextResponse.json({ emailId })
  } catch (err: unknown) {
    logError('[membership-welcome] Failed to send email:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
