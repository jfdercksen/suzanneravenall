import { NextResponse } from 'next/server'
import { z } from 'zod'
import { membershipProgrammeName } from '@suzanne/integrations'
import { decideApplication, isApplicationId, levelOf, logEvent, staffApplication } from '@/lib/novice/applications'
import { formatRenewalDate, sendMembershipWelcomeEmail } from '@/lib/email/membership-welcome'
import { sendNoviceChangesRequestedEmail } from '@/lib/email/novice'
import { siteUrl } from '@/lib/email/site-url'
import { getServiceRoleClient } from '@/lib/quiz/subscriber'
import { currentStaffAccess } from '@/lib/staff/current'
import { logError } from '@/lib/log'

/**
 * POST /api/staff/novice/<id>/decision (form post from /staff/novice/<id>):
 * the team approves a sent Novice application or asks for more. Staff role
 * only. A cross-site form cannot post here: the Origin must be this site.
 * Answers with a redirect back to the application page and a result code.
 */
const formSchema = z.object({
  decision: z.enum(['approve', 'changes']),
  note: z.string().max(4000).default(''),
})

// The public site address, not request.url: behind nginx Next sees its own
// bind address (http://0.0.0.0:3000), and the browser was sent there after
// Approve (KI139, 24 Nov 2026).
function back(id: string, done: string): NextResponse {
  return NextResponse.redirect(`${siteUrl()}/staff/novice/${id}?done=${done}`, 303)
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false
  const allowed = new Set([new URL(request.url).origin, siteUrl()])
  return allowed.has(origin)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isApplicationId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const access = await currentStaffAccess()
  if (access.status !== 'allowed') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form' }, { status: 400 })
  }
  const parsed = formSchema.safeParse({ decision: form.get('decision'), note: form.get('note') ?? '' })
  if (!parsed.success) return NextResponse.json({ error: 'Invalid form' }, { status: 422 })

  const admin = getServiceRoleClient()
  if (!admin) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })

  try {
    const app = await staffApplication(admin, id)
    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const result = await decideApplication(admin, app, parsed.data.decision, parsed.data.note, access.viewer.email)
    if (!result.ok) {
      if (result.reason === 'activation' || result.reason === 'write') logError(`[staff/novice] decision failed: ${result.detail ?? result.reason}`, undefined, { id })
      return back(id, result.reason === 'write' || result.reason === 'unknown-level' ? 'error' : result.reason)
    }

    await logEvent(admin, {
      application_id: id,
      actor_type: 'staff',
      actor_id: access.viewer.id,
      actor_email: access.viewer.email,
      action: result.status,
      detail: parsed.data.note.trim() || null,
    })

    const level = levelOf(app)
    try {
      if (result.status === 'approved' && level) {
        await sendMembershipWelcomeEmail({
          email: app.email,
          firstName: app.first_name,
          levelTitle: level.title,
          programmeName: membershipProgrammeName(level),
          renewalDate: formatRenewalDate(result.endDate),
          siteUrl: siteUrl(),
        })
      } else if (result.status === 'changes_requested') {
        await sendNoviceChangesRequestedEmail({ email: app.email, firstName: app.first_name, sku: app.sku, note: parsed.data.note.trim() })
      }
    } catch (err) {
      // The decision stands; the member also sees it in the portal.
      logError('[staff/novice] member email failed', err, { id })
    }
    return back(id, result.status)
  } catch (err) {
    logError('[staff/novice] decision error', err, { id })
    return back(id, 'error')
  }
}
