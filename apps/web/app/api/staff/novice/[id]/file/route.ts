import { NextResponse } from 'next/server'
import { isApplicationId, logEvent, NOVICE_BUCKET, staffApplication } from '@/lib/novice/applications'
import { getServiceRoleClient } from '@/lib/quiz/subscriber'
import { currentStaffAccess } from '@/lib/staff/current'
import { logError } from '@/lib/log'

/**
 * GET /api/staff/novice/<id>/file?i=<n>: opens one file of a Novice
 * application for the team. Staff role only. The opening is logged first; if
 * the log cannot be written the file is not shown. The link it hands out
 * lasts five minutes.
 */
const LINK_SECONDS = 5 * 60

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isApplicationId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const access = await currentStaffAccess()
  if (access.status !== 'allowed') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getServiceRoleClient()
  if (!admin) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })

  const index = Number(new URL(request.url).searchParams.get('i'))
  try {
    const app = await staffApplication(admin, id)
    const file = app && Number.isInteger(index) && index >= 0 ? app.files[index] : undefined
    if (!app || !file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const logged = await logEvent(admin, { application_id: id, actor_type: 'staff', actor_id: access.viewer.id, actor_email: access.viewer.email, action: 'viewed', detail: file.name })
    if (!logged) return NextResponse.json({ error: 'This view could not be logged, so the file is not shown' }, { status: 503 })

    const { data, error } = await admin.storage.from(NOVICE_BUCKET).createSignedUrl(file.path, LINK_SECONDS, { download: file.name })
    if (error || !data?.signedUrl) throw new Error(`signed url: ${error?.message ?? 'none'}`)
    const res = NextResponse.redirect(data.signedUrl, 303)
    res.headers.set('Referrer-Policy', 'no-referrer')
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    logError('[staff/novice/file] failed', err, { id })
    return NextResponse.json({ error: 'The file cannot be opened right now' }, { status: 500 })
  }
}
