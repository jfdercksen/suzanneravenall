import { createElement } from 'react'
import { sendEmail } from './send'
import { siteUrl } from './site-url'
import IntakeRequest from './templates/IntakeRequest'
import { isRapidRepatterning, RR_INTRO_COUPON, RR_INTRO_COURSE_URL, ZOOM_URL } from './intake-content'
import IntakeCompleted from './templates/IntakeCompleted'
import { marketingSummary } from '../consent/marketing'
import { staffSubmissionUrl } from '../staff/links'
import { intakeAnswerGroups } from '../staff/present'
import { answerListText } from './templates/AnswerList'
import { logError } from '../log'
import type { IntakeForm, IntakeRecord } from '../intake/types'

/**
 * The intake mails (H-12). The client's request and reminders go to the
 * buyer; the completed form goes to the team. Transactional (they follow a
 * purchase), so no unsubscribe link, like the order confirmation.
 */

/** Where clients write with questions, and the reply-to on their mails. */
export const INTAKE_SUPPORT_EMAIL = 'support@ravenallinstitute.com'

/**
 * Domains a form's own recipient override may use. The completed-form mail
 * carries the client's answers (health information), and any signed-in CMS
 * user can edit the override, so an address elsewhere is ignored and logged.
 */
export const TEAM_EMAIL_DOMAINS = ['ravenallinstitute.com', 'suzanneravenall.com', 'effectivenesscompany.com'] as const

/** One plain address (no second @, spaces, commas or display name) on a team domain. */
export function isTeamAddress(address: string): boolean {
  const match = /^[^\s@,;<>"]+@([^\s@,;<>"]+)$/.exec(address.trim().toLowerCase())
  return match !== null && (TEAM_EMAIL_DOMAINS as readonly string[]).includes(match[1]!)
}

/**
 * The team inbox for completed forms: the form's own override (team domains
 * only), else INTAKE_NOTIFY_EMAIL, else CONTACT_NOTIFY_EMAIL (on the review
 * box both point at our own inbox), else support.
 */
export function intakeTeamAddress(form: Pick<IntakeForm, 'recipientEmail'> | null): string {
  const override = form?.recipientEmail?.trim()
  if (override && !isTeamAddress(override)) {
    logError('[intake] recipient override ignored: not a team domain', new Error('override outside team domains'))
  }
  return (
    (override && isTeamAddress(override) ? override : '') ||
    process.env.INTAKE_NOTIFY_EMAIL?.trim() ||
    process.env.CONTACT_NOTIFY_EMAIL?.trim() ||
    INTAKE_SUPPORT_EMAIL
  )
}

export function intakeFormUrl(token: string): string {
  return `${siteUrl()}/intake/${token}`
}

export function intakeRequestSubject(serviceName: string, reminder: number): string {
  return reminder > 0
    ? `Reminder: your intake form for ${serviceName}`
    : `Please complete your intake form for ${serviceName}`
}

function requestText(record: IntakeRecord, reminder: number, formUrl: string): string {
  const lines = [
    record.first_name ? `Hi ${record.first_name},` : 'Hi there,',
    '',
    reminder > 0
      ? `I hope you're doing well. This is a friendly reminder that we have not yet received your intake form for your ${record.service_name}.`
      : `I hope you're doing well, and thank you so much for purchasing and booking your ${record.service_name}.`,
    '',
    'May I kindly ask you to please complete your intake form at least 3 days before your session, as this helps ensure you get the best session possible. We work holistically, and therefore want to understand more about your overall wellbeing, so we know how to work with you, and how hard to push! But if any questions feel uncomfortable, feel free not to answer them.',
    '',
    `Complete your intake form: ${formUrl}`,
    '',
  ]
  if (isRapidRepatterning(record.service_key)) {
    lines.push(
      'To get you started on your journey we have given you access to a short program of information about what will happen in the session and also short informative videos, along with an understanding of how our system works and a little information about what is going on inside of you that causes stuckness, flow, pain, illness. We hope you enjoy this gift.',
      '',
      'Steps to access the short programme',
      `Step 1: Go to ${RR_INTRO_COURSE_URL} and open a free account.`,
      'Step 2: Select this course.',
      `Step 3: Check out using this code: ${RR_INTRO_COUPON}`,
      '',
    )
  }
  if (!record.in_person) {
    lines.push(`Your session will be via Zoom. Click on this link at the time of your session: ${ZOOM_URL}`, '')
  }
  lines.push(
    `If you have any questions at all, please don't hesitate to reach out: reply to this email or write to ${INTAKE_SUPPORT_EMAIL}.`,
    '',
    'This link is personal to you; please do not forward it.',
    '',
    'Warm regards,',
    'The Ravenall Institute team',
  )
  return lines.join('\n')
}

/** The first mail (reminder 0) or reminder 1 to 6. Returns the Brevo message id; throws on failure. */
export async function sendIntakeRequestEmail(record: IntakeRecord, reminder: number): Promise<string> {
  const formUrl = intakeFormUrl(record.token)
  return sendEmail({
    to: [record.customer_email],
    replyTo: INTAKE_SUPPORT_EMAIL,
    subject: intakeRequestSubject(record.service_name, reminder),
    react: createElement(IntakeRequest, {
      firstName: record.first_name,
      serviceName: record.service_name,
      formUrl,
      reminder,
      supportEmail: INTAKE_SUPPORT_EMAIL,
      rapidRepatterning: isRapidRepatterning(record.service_key),
      online: !record.in_person,
    }),
    text: requestText(record, reminder, formUrl),
  })
}

export function clientName(record: Pick<IntakeRecord, 'first_name' | 'last_name' | 'customer_email'>): string {
  const name = [record.first_name, record.last_name].map((p) => p?.trim() ?? '').filter(Boolean).join(' ')
  return name || record.customer_email
}

export function orderNumber(record: Pick<IntakeRecord, 'order_display_id' | 'order_id'>): string {
  return record.order_display_id ? `#${record.order_display_id}` : record.order_id
}

export function intakeCompletedSubject(record: IntakeRecord): string {
  return `Intake form: ${clientName(record)}, order ${orderNumber(record)} (${record.service_name})`
}

function formatCompletedAt(iso: string | null): string {
  const date = iso ? new Date(iso) : new Date()
  return date.toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg', dateStyle: 'medium', timeStyle: 'short' })
}

function completedText(record: IntakeRecord, formTitle: string): string {
  const lines = [
    `Client: ${clientName(record)}`,
    `Email: ${record.customer_email}`,
    `Order: ${orderNumber(record)}`,
    `Service: ${record.service_name}`,
    `Form: ${formTitle}`,
    `Completed: ${formatCompletedAt(record.completed_at)}`,
    `Acknowledgement: ${record.answers?.acknowledged ? 'Ticked' : 'Not on this form'}`,
    `Marketing: ${recordMarketing(record)}`,
    '',
    'ANSWERS',
    '=======',
    ...answerListText(intakeAnswerGroups(record.answers)),
    '',
    'The website keeps a copy on the staff page (log in with your staff CMS account):',
    staffSubmissionUrl('intake', record.id),
    '',
    'Personal and health information: keep this mail within the team.',
    'Reply to this mail to write to the client.',
  ]
  return lines.join('\n')
}

function recordMarketing(record: IntakeRecord): string {
  // A row from before the opt-in, or a form sent without one, is not a "no".
  if (!record.marketing_choice_at) return 'No choice recorded'
  return marketingSummary({ optIn: record.marketing_opt_in === true, channels: record.marketing_channels ?? [] })
}

/**
 * The completed form to the team: who, which order and form, when, and every
 * answer (Suzanne, 20 Nov 2026: "we do allow email"). The copy stays in
 * intake_submissions behind the staff page. Reply-to is the client. Throws on failure.
 */
export async function sendIntakeCompletedEmail(record: IntakeRecord, form: IntakeForm | null): Promise<string> {
  const formTitle = form?.title ?? record.form_key ?? 'Intake form'
  return sendEmail({
    to: [intakeTeamAddress(form)],
    replyTo: record.customer_email,
    subject: intakeCompletedSubject(record),
    react: createElement(IntakeCompleted, {
      clientName: clientName(record),
      clientEmail: record.customer_email,
      orderNumber: orderNumber(record),
      serviceName: record.service_name,
      formTitle,
      completedAt: formatCompletedAt(record.completed_at),
      acknowledged: record.answers?.acknowledged ?? false,
      marketing: recordMarketing(record),
      answers: intakeAnswerGroups(record.answers),
      answersUrl: staffSubmissionUrl('intake', record.id),
    }),
    text: completedText(record, formTitle),
  })
}
