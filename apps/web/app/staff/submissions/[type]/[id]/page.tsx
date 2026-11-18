import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { quizBySlug } from '@/app/explore/quizzes'
import { StaffGate } from '@/components/staff/StaffGate'
import { StaffHeader } from '@/components/staff/StaffHeader'
import { StaffSection } from '@/components/staff/StaffSection'
import { SubmissionDetail } from '@/components/staff/SubmissionDetail'
import { logError } from '@/lib/log'
import { getServiceRoleClient } from '@/lib/quiz/subscriber'
import { currentStaffAccess } from '@/lib/staff/current'
import {
  NOT_RECORDED,
  formatSast,
  intakeAnswerGroups,
  marketingChoiceText,
  personName,
  quizAnswerRows,
  type AnswerGroup,
} from '@/lib/staff/present'
import {
  isSubmissionId,
  isSubmissionType,
  openSubmission,
  type IntakeDetailRow,
  type OpenResult,
  type QuizDetailRow,
} from '@/lib/staff/submissions'

/**
 * /staff/submissions/<quiz|intake>/<id> (KI125): one completed submission with
 * every answer and its question, the consent and marketing record, and when.
 * Staff role only. The view is written to the access log before anything is
 * shown; if that write fails, the answers are not shown. Read only.
 *
 * Links between staff pages are plain anchors on purpose, not next/link: every
 * view is then a full page load, where the analytics sanitiser (lib/analytics.ts)
 * drops the id and the search, and CookieConsent never starts Clarity. A
 * client-side navigation would send GA the raw URL as a history page_view.
 */
export const metadata: Metadata = {
  title: 'Submission',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ type: string; id: string }>
}

interface DetailView {
  title: string
  facts: [string, string][]
  groups: AnswerGroup[]
  answersNote?: string
}

function marketingFacts(row: QuizDetailRow | IntakeDetailRow): [string, string][] {
  return [
    ['Marketing', marketingChoiceText(row)],
    ['Marketing choice made', formatSast(row.marketing_choice_at)],
    ['Marketing wording version', row.marketing_form_version ?? NOT_RECORDED],
  ]
}

function quizView(row: QuizDetailRow): DetailView {
  const quiz = quizBySlug(row.quiz_slug)
  const result = row.result_key && quiz ? quiz.results[row.result_key] : undefined
  return {
    title: personName(row.first_name, row.last_name, row.email),
    facts: [
      ['Email', row.email],
      ['Diagnostic', quiz?.title ?? row.quiz_slug],
      ['Result', result ? `${result.title}: ${result.subtitle}` : (row.result_key ?? NOT_RECORDED)],
      ['Completed', formatSast(row.completed_at)],
      ['Consent to process answers', formatSast(row.consented_at)],
      ['Consent wording version', row.consent_form_version ?? NOT_RECORDED],
      ...marketingFacts(row),
    ],
    groups: [{ section: null, items: quizAnswerRows(quiz, row.answers) }],
    answersNote: 'Scale: Never (0) to Almost Always (4). Question wording as the diagnostic reads today.',
  }
}

function intakeView(row: IntakeDetailRow): DetailView {
  return {
    title: personName(row.first_name, row.last_name, row.customer_email),
    facts: [
      ['Email', row.customer_email],
      ['Service', row.service_name],
      ['Order', row.order_display_id ? `#${row.order_display_id}` : row.order_id],
      ['Completed', formatSast(row.completed_at)],
      ['Form version', row.form_version ?? row.form_key ?? NOT_RECORDED],
      ['Acknowledgement', row.answers?.acknowledged ? 'Ticked' : 'Not on this form'],
      ...marketingFacts(row),
    ],
    groups: intakeAnswerGroups(row.answers),
    answersNote: 'Question wording as it was when the client answered.',
  }
}

export default async function StaffSubmissionDetail({ params }: PageProps) {
  const { type, id } = await params
  if (!isSubmissionType(type) || !isSubmissionId(id)) notFound()

  const access = await currentStaffAccess()
  if (access.status !== 'allowed') {
    return (
      <StaffSection>
        <StaffHeader title="Submission" />
        <StaffGate access={access} />
      </StaffSection>
    )
  }

  const back = (
    <a
      href={`/staff/submissions/${type}`}
      className="inline-block mb-8 text-sm underline underline-offset-2 text-brand-ink hover:text-brand-primary"
    >
      Back to all {type === 'quiz' ? 'diagnostics' : 'intake forms'}
    </a>
  )

  const unavailable = (
    <StaffSection>
      {back}
      <StaffHeader title="Submission" viewer={access.viewer} />
      <p className="max-w-xl text-base leading-relaxed text-brand-ink">
        This submission could not be opened just now. Please try again in a minute.
      </p>
    </StaffSection>
  )

  const supabase = getServiceRoleClient()
  if (!supabase) {
    logError('[staff/submissions] Supabase service-role client is not configured')
    return unavailable
  }

  // notFound() throws, so it stays outside the try below.
  let opened: OpenResult<'quiz'> | OpenResult<'intake'>
  try {
    opened =
      type === 'quiz'
        ? await openSubmission(supabase, access.viewer, 'quiz', id)
        : await openSubmission(supabase, access.viewer, 'intake', id)
  } catch (error) {
    logError('[staff/submissions] read failed', error, { type })
    return unavailable
  }
  if (opened.status === 'not-found') notFound()
  if (opened.status === 'log-failed') {
    logError('[staff/submissions] access log write failed, answers not shown', opened.error, { type })
    return unavailable
  }
  const view = type === 'quiz' ? quizView(opened.row as QuizDetailRow) : intakeView(opened.row as IntakeDetailRow)

  return (
    <StaffSection>
      {back}
      <StaffHeader title={view.title} viewer={access.viewer} />
      <SubmissionDetail facts={view.facts} groups={view.groups} answersNote={view.answersNote} />
    </StaffSection>
  )
}
