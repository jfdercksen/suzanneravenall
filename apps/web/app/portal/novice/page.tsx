import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { membershipsEnabled } from '@/lib/access/memberships'
import { NOT_FOUND_TITLE } from '@/lib/seo/notFoundTitle'
import { getServiceRoleClient } from '@/lib/quiz/subscriber'
import { canUpload, levelOf, memberApplications } from '@/lib/novice/applications'
import { noviceChecklistFor } from '@/lib/novice/checklist'
import { logError } from '@/lib/log'
import NoviceContent, { type NoviceApplicationView } from './NoviceContent'

/**
 * /portal/novice (Suzanne, 19 Nov 2026): the member's Novice applications.
 * After paying for a Novice level they upload what the pathway asks for and
 * send it to the team; access starts when the team approves it. Off with
 * memberships (the 404 page, like /portal/upgrade).
 */
export function generateMetadata(): Metadata {
  return membershipsEnabled()
    ? { title: 'Your Novice Application | Member Portal', robots: { index: false } }
    : { title: { absolute: NOT_FOUND_TITLE }, robots: { index: false } }
}

export const dynamic = 'force-dynamic'

export default async function NovicePage() {
  if (!membershipsEnabled()) notFound()

  const supabase = createClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login?redirect=%2Fportal%2Fnovice')

  const admin = getServiceRoleClient()
  let applications: NoviceApplicationView[] = []
  let unavailable = !admin
  if (admin) {
    try {
      const rows = await memberApplications(admin, user)
      applications = rows.flatMap((app) => {
        const level = levelOf(app)
        const checklist = level ? noviceChecklistFor(level.programme) : null
        if (!level || !checklist) return []
        return [
          {
            id: app.id,
            levelTitle: level.title,
            status: app.status,
            canUpload: canUpload(app),
            reviewerNote: app.status === 'changes_requested' ? app.reviewer_note : null,
            checklist: checklist.items,
            pathwayHref: checklist.pathwayHref,
            files: app.files.map((f) => ({ name: f.name, size: f.size, uploadedAt: f.uploaded_at })),
          },
        ]
      })
    } catch (err) {
      logError('[portal/novice] read failed', err)
      unavailable = true
    }
  }

  return <NoviceContent applications={applications} unavailable={unavailable} emailConfirmed={Boolean(user.email_confirmed_at)} />
}
