import type { MembershipProgramme } from '@suzanne/integrations'

/**
 * What a member uploads to become a Novice, per programme. Shortened from
 * section B of Suzanne's Career & Certification Pathway documents of 12 Nov
 * (data/certificationPathways), in her words. The pathway page stays the
 * full rule; the email and the upload page link to it.
 */
export const NOVICE_CHECKLIST: Record<Exclude<MembershipProgramme, 'general'>, { status: string; pathwayHref: string; items: string[] }> = {
  akashic: {
    status: 'Novice Navigator',
    pathwayHref: '/programs/certification/akashic-navigation',
    items: [
      'Verification of the Akashic Navigation programmes you have taken (AN1 Foundations and AN2 Reading for Others), or your certificates of attendance.',
      'Your written declaration that you have read the set texts for both programmes and completed the skills development assignments in the workbooks.',
      'Your Session Log: the typed-up Excel spreadsheet you started at AN1.',
      'The notes of your 21 self-readings and your 8 full practice readings, highlighted in your Session Log (the notes can be anonymous).',
      'Written consent from each person whose reading notes you share for observation.',
      'The recordings set out in section C of the pathway.',
    ],
  },
  'energy-clearing': {
    status: 'Novice Practitioner',
    pathwayHref: '/programs/certification/energy-alignment-optimisation',
    items: [
      'Verification of the Energy Alignment & Optimisation programmes you have taken (EA1 Foundations and EA2 Energy Assessment), or your certificates of attendance.',
      'Your written declaration that you have read the set texts for both programmes and completed the skills development assignments in the workbooks.',
      'Your Session Log: the typed-up Excel spreadsheet you started at EA1.',
      'The notes of your 8 full self-sessions and 8 full practice sessions, highlighted in your Session Log (the notes can be anonymous).',
      'Written consent from each person whose session notes you share for observation.',
      'The recordings set out in section C of the pathway.',
    ],
  },
}

export function noviceChecklistFor(programme: MembershipProgramme) {
  return programme === 'general' ? null : NOVICE_CHECKLIST[programme]
}
