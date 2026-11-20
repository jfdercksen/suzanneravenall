import { NextResponse } from 'next/server'
import { z } from 'zod'
import { logEvent, submitApplication } from '@/lib/novice/applications'
import { memberContext } from '@/lib/novice/member-request'
import { sendNoviceSubmittedTeamEmail } from '@/lib/email/novice'
import { logError } from '@/lib/log'

/** POST /api/portal/novice/submit: the member sends their application to the team for review. */
const bodySchema = z.object({ applicationId: z.string().uuid() })

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request body' }, { status: 422 })

  try {
    const ctx = await memberContext(parsed.data.applicationId)
    if (!ctx.ok) return ctx.response
    const result = await submitApplication(ctx.admin, ctx.app)
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: result.reason === 'write' ? 500 : 409 })

    await logEvent(ctx.admin, { application_id: ctx.app.id, actor_type: 'member', actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'submitted', detail: `${ctx.app.files.length} file(s)` })
    try {
      await sendNoviceSubmittedTeamEmail({
        id: ctx.app.id,
        memberName: ctx.app.first_name ?? ctx.app.email,
        memberEmail: ctx.app.email,
        sku: ctx.app.sku,
        fileCount: ctx.app.files.length,
      })
    } catch (err) {
      // The application is sent; the team also sees it on /staff/novice.
      logError('[portal/novice/submit] team email failed', err)
    }
    return NextResponse.json({ status: 'submitted' })
  } catch (err) {
    logError('[portal/novice/submit] failed', err)
    return NextResponse.json({ error: 'Could not send your application' }, { status: 500 })
  }
}
