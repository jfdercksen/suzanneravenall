import { createElement } from 'react'
import { sendEmail } from './send'
import { siteUrl } from './site-url'
import IntakeRequest from './templates/IntakeRequest'
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
  return [
    record.first_name ? `Hi ${record.first_name},` : 'Hi there,',
    '',
    reminder > 0
      ? `We have not received your intake form for ${record.service_name} yet. It helps us prepare for your session, so please take a few minutes to complete it.`
      : `Thank you for booking ${record.service_name}. Before your session, please complete your intake form. It helps us understand you and prepare, so you have a great and comfortable experience.`,
    '',
    'It takes about 10 to 15 minutes. Leave out anything you would prefer not to answer.',
    '',
    `Complete your intake form: ${formUrl}`,
    '',
    'This link is personal to you; please do not forward it.',
    '',
    `Questions about your form or your session? Contact us at ${INTAKE_SUPPORT_EMAIL} or simply reply to this email.`,
    '',
    'Warm regards,',
    'The Ravenall Institute team',
  ].join('\n')
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
