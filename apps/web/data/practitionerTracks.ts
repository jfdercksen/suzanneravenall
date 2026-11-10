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

/**
 * Licensing (item 8.4, Johan 10 Nov): no separate licensing product exists.
 * The licence to practise under the Ravenall Institute name is certification
 * plus a current annual practitioner membership (repatterning.com: "Membership
 * ~ License to Practice Categories"). The membership levels link goes to the
 * portal only while memberships are on sale (membershipsEnabled, read on the
 * server); no membership prices on this page until Suzanne approves the levels.
 */
export const OBSERVATION_FEE_HANDLE = 'ravenall-institute-certification-observation-fee'

export function licensingLinks(membershipsOn: boolean): {
  membershipHref: string
  membershipLabel: string
  observationFeeHref: string
} {
  return {
    membershipHref: membershipsOn
      ? '/portal/upgrade'
      : contactHref('practitioner', 'Practitioner membership (licence to practise)'),
    membershipLabel: membershipsOn ? 'See the membership levels' : 'Ask about membership levels',
    observationFeeHref: `/shop/${OBSERVATION_FEE_HANDLE}`,
  }
}
