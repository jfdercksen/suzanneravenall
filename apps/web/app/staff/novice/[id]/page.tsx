import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StaffGate } from '@/components/staff/StaffGate'
import { StaffHeader } from '@/components/staff/StaffHeader'
import { StaffSection } from '@/components/staff/StaffSection'
import { logError } from '@/lib/log'
import { getServiceRoleClient } from '@/lib/quiz/subscriber'
import { currentStaffAccess } from '@/lib/staff/current'
import { formatSast } from '@/lib/staff/present'
import { isApplicationId, levelOf, logEvent, STATUS_LABEL, staffApplication } from '@/lib/novice/applications'

/**
 * /staff/novice/<id>: one Novice application. Every opening is logged before
 * the files are listed; each file opens through /api/staff/novice/<id>/file,
 * which logs it and hands out a five-minute link. Approve starts the member's
 * Novice access for a year; Ask for more sends the application back with the
 * team's note (both email the member).
 */
export const metadata: Metadata = {
  title: 'Novice application',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export const dynamic = 'force-dynamic'

const MESSAGES: Record<string, string> = {
  approved: 'Approved. The member is a Novice for a year from today and has been emailed.',
  changes_requested: 'Sent back to the member with your note.',
  'not-submitted': 'This application is not waiting for a decision (someone may have decided it already).',
  'no-account': 'The member has no portal account linked yet. They link it by logging in with the email they paid with and opening their application.',
  'note-required': 'Write what the member must add before sending it back.',
  activation: 'The approval could not start the member\u2019s access. Nothing changed; please try again or tell Johan.',
  error: 'Something went wrong. Nothing changed.',
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ done?: string }>
}

export default async function StaffNoviceDetail({ params, searchParams }: PageProps) {
  const { id } = await params
  if (!isApplicationId(id)) notFound()
  const { done } = await searchParams

  const access = await currentStaffAccess()
  if (access.status !== 'allowed') {
    return (
      <StaffSection>
        <StaffHeader title="Novice application" />
        <StaffGate access={access} />
      </StaffSection>
    )
  }

  const supabase = getServiceRoleClient()
  const back = (
    // A full page load on purpose, like /staff/submissions: the analytics
    // sanitiser runs on load and Clarity never starts on staff pages.
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a href="/staff/novice" className="inline-block mb-8 text-sm underline underline-offset-2 text-brand-ink hover:text-brand-primary">
      All Novice applications
    </a>
  )
  if (!supabase) {
    return (
      <StaffSection>
        <StaffHeader title="Novice application" viewer={access.viewer} />
        {back}
        <p className="text-brand-ink">The application cannot be shown right now.</p>
      </StaffSection>
    )
  }

  let app = null
  try {
    app = await staffApplication(supabase, id)
  } catch (error) {
    logError('[staff/novice] read failed', error)
  }
  if (!app) notFound()

  const logged = await logEvent(supabase, {
    application_id: app.id,
    actor_type: 'staff',
    actor_id: access.viewer.id,
    actor_email: access.viewer.email,
    action: 'viewed',
  })

  const level = levelOf(app)
  const facts: [string, string][] = [
    ['Member', app.first_name ?? 'Not given'],
    ['Email', app.email],
    ['Level', level?.title ?? app.sku],
    ['Status', STATUS_LABEL[app.status]],
    ['Order', app.medusa_order_id],
    ['Opened', formatSast(app.created_at)],
    ['Sent to the team', app.submitted_at ? formatSast(app.submitted_at) : 'Not yet'],
    ['Portal account linked', app.user_id ? 'Yes' : 'Not yet'],
  ]
  if (app.reviewed_at) facts.push(['Last decision', `${formatSast(app.reviewed_at)} by ${app.reviewer_email ?? 'unknown'}`])

  return (
    <StaffSection>
      <StaffHeader title={app.first_name ?? app.email} viewer={access.viewer} />
      {back}
      {done && MESSAGES[done] && (
        <p role="status" className="mb-8 p-4 rounded-xl bg-brand-sand text-brand-ink">
          {MESSAGES[done]}
        </p>
      )}

      <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-[12rem_1fr] mb-10 text-brand-ink">
        {facts.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-medium">{k}</dt>
            <dd className="mb-2 sm:mb-0 break-words">{v}</dd>
          </div>
        ))}
      </dl>

      {app.reviewer_note && (
        <div className="mb-10">
          <h2 className="mb-2 text-lg font-medium text-brand-ink">Last note to the member</h2>
          <p className="whitespace-pre-line text-brand-ink">{app.reviewer_note}</p>
        </div>
      )}

      <h2 className="mb-4 text-lg font-medium text-brand-ink">Files ({app.files.length})</h2>
      {!logged ? (
        <p className="mb-10 text-brand-ink">The files cannot be shown because this view could not be logged.</p>
      ) : app.files.length === 0 ? (
        <p className="mb-10 text-brand-muted">No files yet.</p>
      ) : (
        <ul className="mb-10 space-y-2">
          {app.files.map((f, i) => (
            <li key={f.path} className="break-all">
              <a href={`/api/staff/novice/${app.id}/file?i=${i}`} className="underline underline-offset-2 text-brand-ink hover:text-brand-primary">
                {f.name}
              </a>{' '}
              <span className="text-sm text-brand-muted">({Math.max(1, Math.round(f.size / 1024))} KB, {formatSast(f.uploaded_at)})</span>
            </li>
          ))}
        </ul>
      )}

      {app.status === 'submitted' && (
        <form method="post" action={`/api/staff/novice/${app.id}/decision`} className="max-w-2xl p-6 rounded-2xl bg-brand-sand">
          <h2 className="mb-4 text-lg font-medium text-brand-ink">Your decision</h2>
          <label htmlFor="note" className="block mb-2 text-sm text-brand-ink">
            Note to the member (needed when you ask for more; optional when you approve)
          </label>
          <textarea id="note" name="note" rows={5} maxLength={4000} className="w-full mb-4 p-3 rounded-xl border border-brand-border bg-white text-brand-ink" />
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" name="decision" value="approve" className="px-6 py-3 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-sm font-semibold rounded-button transition-all duration-300">
              Approve: start Novice access
            </button>
            <button type="submit" name="decision" value="changes" className="px-6 py-3 bg-white border border-brand-primary-300 text-brand-ink text-sm font-semibold rounded-button transition-all duration-300 hover:border-brand-primary">
              Ask for more
            </button>
          </div>
        </form>
      )}
    </StaffSection>
  )
}
