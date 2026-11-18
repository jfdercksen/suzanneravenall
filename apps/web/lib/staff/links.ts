import { siteUrl } from '@/lib/email/site-url'
import type { SubmissionType } from './submissions'

/**
 * The staff page for one submission, for the team mails. The id is not a
 * secret: the page needs the Staff role (CMS login) and logs every view.
 */
export function staffSubmissionUrl(type: SubmissionType, id: string): string {
  return `${siteUrl()}/staff/submissions/${type}/${encodeURIComponent(id)}`
}
