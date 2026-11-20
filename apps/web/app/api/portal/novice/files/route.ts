import { NextResponse } from 'next/server'
import { z } from 'zod'
import { addFile, ALLOWED_FILE_TYPES, logEvent, MAX_FILE_BYTES } from '@/lib/novice/applications'
import { memberContext } from '@/lib/novice/member-request'
import { logError } from '@/lib/log'

/** POST /api/portal/novice/files: records a file the member has uploaded (checked in Storage first). */
const bodySchema = z.object({
  applicationId: z.string().uuid(),
  path: z.string().min(1).max(400),
  name: z.string().min(1).max(255),
  size: z.number().int().positive().max(MAX_FILE_BYTES),
  type: z.enum(ALLOWED_FILE_TYPES),
})

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
    const { applicationId: _id, ...file } = parsed.data
    const result = await addFile(ctx.admin, ctx.app, file)
    if (!result.ok) {
      const status = result.reason === 'closed' || result.reason === 'too-many' ? 409 : ['path', 'missing', 'mismatch'].includes(result.reason) ? 422 : 500
      return NextResponse.json({ error: result.reason }, { status })
    }
    await logEvent(ctx.admin, { application_id: ctx.app.id, actor_type: 'member', actor_id: ctx.user.id, actor_email: ctx.user.email, action: 'uploaded', detail: file.name })
    return NextResponse.json({ files: result.files.map(({ name, size, uploaded_at }) => ({ name, size, uploaded_at })) })
  } catch (err) {
    logError('[portal/novice/files] failed', err)
    return NextResponse.json({ error: 'Could not save the file' }, { status: 500 })
  }
}
