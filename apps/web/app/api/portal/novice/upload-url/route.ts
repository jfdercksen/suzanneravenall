import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  ALLOWED_FILE_TYPES,
  canUpload,
  ensureBucket,
  MAX_FILE_BYTES,
  MAX_FILES,
  MAX_STORED_OBJECTS,
  nameMatchesType,
  NOVICE_BUCKET,
  storagePathFor,
  storedObjectCount,
} from '@/lib/novice/applications'
import { memberContext } from '@/lib/novice/member-request'
import { logError } from '@/lib/log'

/**
 * POST /api/portal/novice/upload-url: a one-time signed upload for one file
 * of the member's own Novice application. The browser sends the file straight
 * to Storage with it (so a long recording never passes through the web
 * server), then registers it at /api/portal/novice/files.
 */
const bodySchema = z.object({
  applicationId: z.string().uuid(),
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
  if (!parsed.success || !nameMatchesType(parsed.data.name, parsed.data.type)) {
    return NextResponse.json({ error: 'This file type or size cannot be uploaded' }, { status: 422 })
  }

  try {
    const ctx = await memberContext(parsed.data.applicationId)
    if (!ctx.ok) return ctx.response
    if (!canUpload(ctx.app)) return NextResponse.json({ error: 'Your application is with your team' }, { status: 409 })
    if (ctx.app.files.length >= MAX_FILES) return NextResponse.json({ error: 'Too many files' }, { status: 409 })

    await ensureBucket(ctx.admin)
    // Uploads that were never registered count too, so the folder cannot be filled endlessly.
    const stored = await storedObjectCount(ctx.admin, ctx.app.id)
    if (stored === null || stored >= MAX_STORED_OBJECTS) return NextResponse.json({ error: 'Too many files' }, { status: 409 })
    const path = storagePathFor(ctx.app.id, parsed.data.name)
    const { data, error } = await ctx.admin.storage.from(NOVICE_BUCKET).createSignedUploadUrl(path)
    if (error || !data) throw new Error(`signed upload: ${error?.message ?? 'no data'}`)
    return NextResponse.json({ path: data.path, token: data.token })
  } catch (err) {
    logError('[portal/novice/upload-url] failed', err)
    return NextResponse.json({ error: 'Upload is not available right now' }, { status: 500 })
  }
}
