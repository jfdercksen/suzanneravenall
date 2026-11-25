import { createElement } from 'react'
import { membershipBySku } from '@suzanne/integrations'
import { sendEmail } from './send'
import { siteUrl } from './site-url'
import { NoviceChangesRequested, NoviceDocuments, NoviceSubmittedTeam } from './templates/NoviceEmails'
import { noviceChecklistFor } from '../novice/checklist'

/**
 * The Novice application emails (Suzanne, 19 Nov 2026). Transactional (they
 * follow a purchase), so no unsubscribe link, like the intake mails.
 */

/** Where members write with questions: "just use support@" (Suzanne, 24 Nov 2026). */
export const MEMBER_SUPPORT_EMAIL = 'support@ravenallinstitute.com'

/**
 * The team inbox for "an application is waiting": CONTACT_NOTIFY_EMAIL (on the
 * review box our own inbox), else member support.
 */
export function noviceTeamAddress(): string {
  return process.env.CONTACT_NOTIFY_EMAIL?.trim() || MEMBER_SUPPORT_EMAIL
}

export const NOVICE_PORTAL_PATH = '/portal/novice'

export function staffNoviceUrl(id: string): string {
  return `${siteUrl()}/staff/novice/${id}`
}

function levelAndChecklist(sku: string) {
  const level = membershipBySku(sku)
  if (!level) throw new Error(`unknown membership SKU ${sku}`)
  const checklist = noviceChecklistFor(level.programme)
  if (!checklist) throw new Error(`${sku} has no Novice checklist`)
  return { level, checklist }
}

export async function sendNoviceDocumentsEmail(input: { email: string; firstName: string | null; sku: string }): Promise<string> {
  const { level, checklist } = levelAndChecklist(input.sku)
  return sendEmail({
    to: [input.email],
    replyTo: MEMBER_SUPPORT_EMAIL,
    subject: `What to upload for your ${checklist.status} status`,
    react: createElement(NoviceDocuments, {
      firstName: input.firstName,
      levelTitle: level.title,
      status: checklist.status,
      items: checklist.items,
      uploadUrl: `${siteUrl()}${NOVICE_PORTAL_PATH}`,
      pathwayUrl: `${siteUrl()}${checklist.pathwayHref}`,
    }),
  })
}

export async function sendNoviceChangesRequestedEmail(input: { email: string; firstName: string | null; sku: string; note: string }): Promise<string> {
  const { level } = levelAndChecklist(input.sku)
  return sendEmail({
    to: [input.email],
    replyTo: MEMBER_SUPPORT_EMAIL,
    subject: 'Your team has feedback on your Novice application',
    react: createElement(NoviceChangesRequested, {
      firstName: input.firstName,
      levelTitle: level.title,
      note: input.note,
      uploadUrl: `${siteUrl()}${NOVICE_PORTAL_PATH}`,
    }),
  })
}

export async function sendNoviceSubmittedTeamEmail(input: {
  id: string
  memberName: string
  memberEmail: string
  sku: string
  fileCount: number
}): Promise<string> {
  const { level } = levelAndChecklist(input.sku)
  return sendEmail({
    to: [noviceTeamAddress()],
    replyTo: input.memberEmail,
    subject: `Novice application from ${input.memberName}`,
    react: createElement(NoviceSubmittedTeam, {
      memberName: input.memberName,
      memberEmail: input.memberEmail,
      levelTitle: level.title,
      fileCount: input.fileCount,
      reviewUrl: staffNoviceUrl(input.id),
    }),
  })
}
