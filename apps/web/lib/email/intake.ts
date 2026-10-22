import { createElement } from 'react'
import { sendEmail } from './send'
import { siteUrl } from './site-url'
import IntakeRequest from './templates/IntakeRequest'
import { isRapidRepatterning, RR_INTRO_COUPON, RR_INTRO_COURSE_URL, ZOOM_URL } from './intake-content'
import IntakeCompleted from './templates/IntakeCompleted'
import { answerText } from '../intake/validate'
import type { IntakeForm, IntakeRecord } from '../intake/types'

/**
 * The intake mails (H-12). The client's request and reminders go to the
 * buyer; the completed form goes to the team. Transactional (they follow a
 * purchase), so no unsubscribe link, like the order confirmation.
 */

/** Where clients write with questions, and the reply-to on their mails. */
export const INTAKE_SUPPORT_EMAIL = 'support@ravenallinstitute.com'

/**
 * The team inbox for completed forms: the form's own override, else
 * INTAKE_NOTIFY_EMAIL, else CONTACT_NOTIFY_EMAIL (on the review box both point
 * at our own inbox), else support.
 */
export function intakeTeamAddress(form: Pick<IntakeForm, 'recipientEmail'> | null): string {
  return (
    form?.recipientEmail ||
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
    '',
  ]
  let section: string | undefined
  for (const item of record.answers?.items ?? []) {
    if (item.section && item.section !== section) {
      section = item.section
      lines.push('', section.toUpperCase())
    }
    lines.push(`${item.label}: ${answerText(item) || 'Not answered'}`)
    if (item.detail) lines.push(`  Details: ${item.detail}`)
  }
  return lines.join('\n')
}

/** The completed form to the team. Reply-to is the client. Throws on failure. */
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
      items: record.answers?.items ?? [],
    }),
    text: completedText(record, formTitle),
  })
}
