/**
 * The Terms section for Suzanne's session rules (D024), as data so the page,
 * the tests and the approval note quote the same words.
 *
 * DRAFT until Suzanne approves it: the section shows on /legal/terms only when
 * SESSION_TERMS_LIVE=true. Before that, /legal/terms?draft=sessions shows it
 * with a draft banner for review.
 */

export const SESSION_TERMS_TITLE = '4A. Sessions: cancellations, rescheduling and no-shows'

export interface SessionTermsParagraph {
  lead: string
  text: string
}

export const SESSION_TERMS: readonly SessionTermsParagraph[] = [
  {
    lead: 'Notice period.',
    text: 'You may cancel or reschedule a private session at no cost up to 48 working hours before it starts. Working hours are Monday to Friday, 08:00 to 17:00 South African time (SAST), excluding South African public holidays. For example, a session at 09:00 on a Monday must be cancelled or moved by 15:00 on the Friday ten days earlier, when no public holiday falls in between.',
  },
  {
    lead: 'Late changes.',
    text: 'If you cancel or reschedule with less notice, the session counts as used and is taken off your package. A rescheduled booking then uses a further session from your package.',
  },
  {
    lead: 'No-shows.',
    text: 'If you do not attend a booked session and have not cancelled it, the session counts as used.',
  },
  {
    lead: 'Exceptional circumstances.',
    text: 'If something exceptional prevents you from attending, such as a medical emergency, contact us as soon as you can. We may, at our discretion, reschedule the session or return it to your package.',
  },
  {
    lead: 'Changes by us.',
    text: 'If we need to cancel or move a session, it does not count against your package and we will offer you a new time.',
  },
]

export type SessionTermsMode = 'live' | 'draft' | 'hidden'

/** Live once SESSION_TERMS_LIVE=true; a draft preview on ?draft=sessions; otherwise hidden. */
export function sessionTermsMode(draftParam: string | string[] | undefined): SessionTermsMode {
  if (process.env.SESSION_TERMS_LIVE === 'true') return 'live'
  return draftParam === 'sessions' ? 'draft' : 'hidden'
}
