// Enquiry types offered by the /contact form, and the short keys other pages
// use to preselect one: /contact?enquiry=speaking&topic=Keynote#message
// (site check W4: enquiry buttons used to land on a blank form with no context).

export const ENQUIRY_OPTIONS = [
  '1-on-1 Coaching',
  'Group Program',
  'Events & Immersions',
  'Speaking Enquiry',
  'Practitioner Program',
  'Other',
] as const

export type EnquiryOption = (typeof ENQUIRY_OPTIONS)[number]

export const ENQUIRY_KEYS = {
  coaching: '1-on-1 Coaching',
  group: 'Group Program',
  events: 'Events & Immersions',
  speaking: 'Speaking Enquiry',
  practitioner: 'Practitioner Program',
  other: 'Other',
} as const satisfies Record<string, EnquiryOption>

export type EnquiryKey = keyof typeof ENQUIRY_KEYS

/** Builds a /contact link that preselects an enquiry type and, optionally, a topic. */
export function contactHref(enquiry: EnquiryKey, topic?: string): string {
  const params = new URLSearchParams({ enquiry })
  if (topic) params.set('topic', topic)
  return `/contact?${params.toString()}#message`
}

/**
 * Maps a ?enquiry= value to one of the form's options. Accepts a short key
 * ("speaking") or the option label itself, case-insensitively. Anything else
 * returns undefined, so the form falls back to "Select an option".
 */
export function resolveEnquiry(raw: string | string[] | undefined): EnquiryOption | undefined {
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim().toLowerCase()
  if (!value) return undefined
  // hasOwnProperty, not `in`: "constructor" and friends must not match.
  if (Object.prototype.hasOwnProperty.call(ENQUIRY_KEYS, value)) {
    return ENQUIRY_KEYS[value as EnquiryKey]
  }
  return ENQUIRY_OPTIONS.find((option) => option.toLowerCase() === value)
}

const MAX_TOPIC_LENGTH = 120

/**
 * Cleans a ?topic= value (e.g. the event or immersion a visitor clicked on) so
 * it can prefill the message. Control characters and extra whitespace are
 * collapsed and the length is capped; React escapes the text on render.
 */
export function resolveTopic(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return undefined
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TOPIC_LENGTH)
    .trim()
  return cleaned || undefined
}
