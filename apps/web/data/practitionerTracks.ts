import { ph, type RichLine } from '@/lib/content/richLine'
import { contactHref } from '@/app/contact/enquiry'

/**
 * Practitioner programmes Suzanne listed as missing on 8 Nov (item 8.1):
 * Rapid Repatterning (top of the list), Human Performance Replicator and
 * Pattern Intelligence. No content or product exists for any of them yet, so
 * each card carries a visible placeholder and a register-interest enquiry.
 * Johan decides the products; Suzanne supplies the copy.
 */
export interface PractitionerTrack {
  id: string
  name: string
  description: RichLine
  interestHref: string
}

const track = (id: string, name: string): PractitionerTrack => ({
  id,
  name,
  description: [ph('Programme description, format and price', 'Suzanne')],
  interestHref: contactHref('practitioner', `Register interest: ${name} practitioner training`),
})

export const PRACTITIONER_TRACKS: PractitionerTrack[] = [
  track('rapid-repatterning', 'Rapid Repatterning®'),
  track('human-performance-replicator', 'Human Performance Replicator'),
  track('pattern-intelligence', 'Pattern Intelligence™'),
]

/** Licensing of the practitioner training (item 8.4): product and price are Johan's. */
export const LICENSING = {
  detail: [ph('What is licensed, who it is for, terms and price; shop product to follow', 'Johan')] as RichLine,
  enquiryHref: contactHref('practitioner', 'Licensing the practitioner training'),
}
