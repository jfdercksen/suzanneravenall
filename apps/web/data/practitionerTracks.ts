import { contactHref } from '@/app/contact/enquiry'

/**
 * The three programmes Suzanne listed as missing on 8 Nov (item 8.1), in her
 * order: Rapid Repatterning, Human Performance Replicator, Pattern
 * Intelligence. Copy from her mail of 18 Nov 2026 (source text:
 * docs/content/suzanne-2026-11-18-three-programmes.md).
 *
 * Rules from that mail and Johan's reply of 19 Nov:
 * - her square-bracketed values are published as written, WITHOUT the
 *   brackets, until she confirms them (KNOWN_ISSUES KI127);
 * - her trademark marks exactly as she wrote them, and none on Human
 *   Performance Replicator until she confirms which marks are registered;
 * - no "one session" claim for Rapid Repatterning;
 * - Rapid Repatterning and HPR end with a link to their own website.
 *
 * Each next step points at the closest real thing on the site: the discovery
 * call booking on /contact, the contact form with the subject filled in, and
 * the free pattern scan on /discover-your-pattern.
 */
export interface ProgrammeFact {
  label: string
  value?: string
  /** A list in place of one line (HPR's phases, the PI journey). */
  steps?: string[]
}

export interface SignatureProgramme {
  id: string
  name: string
  /** Short eyebrow above the name. */
  label: string
  headline: string
  description: string[]
  /** Her closing line, set apart (Rapid Repatterning only). */
  tagline?: string
  facts: ProgrammeFact[]
  nextStep: { label: string; href: string }
  /** The programme's own website, opened in a new tab. */
  site?: { label: string; href: string }
}

export const PRACTITIONER_TRACKS: SignatureProgramme[] = [
  {
    id: 'rapid-repatterning',
    name: 'Rapid Repatterning™',
    label: 'One-to-one',
    headline: 'Change the pattern at its source.',
    description: [
      "Most change doesn't last because it works on the surface: new habits and new strategies, layered over an old prediction that's still running. Rapid Repatterning™ goes underneath. Using what neuroscience calls memory reconsolidation, it finds the pattern where it was first wired in, along with the meaning you attached to it at the time, and updates it. The nervous system stops defending against an old threat, and the behaviour changes naturally. It's faster than most people expect, and it holds.",
    ],
    tagline: "It's not you. It's your pattern.",
    facts: [
      { label: 'Delivery', value: 'One-to-one, online via Zoom or in person' },
      {
        label: 'Structure',
        value:
          'A series of 3–6 sessions, each 60–90 minutes. Each session traces one pattern, and each pattern is cleared layer by layer',
      },
      {
        label: 'Includes',
        value: 'A pattern scan before the first session, plus between-session practices to settle the change into the body',
      },
      { label: 'For', value: "Anyone ready to do the work, who keeps getting results they don't consciously want" },
    ],
    nextStep: { label: 'Book a discovery call', href: '/contact#book' },
    site: { label: 'Visit rapidrepatterning.com', href: 'https://rapidrepatterning.com' },
  },
  {
    id: 'human-performance-replicator',
    name: 'Human Performance Replicator',
    label: 'For organisations',
    headline: 'Your best people already know how. We make it repeatable.',
    description: [
      "Every organisation has a top 10% whose results seem effortless and impossible to copy. It isn't luck or talent alone. It's pattern. The Human Performance Replicator studies your top performers, works out the unconscious patterns behind their results, and turns those patterns into training your wider team can learn. The result is less variation in performance and the excellence you already have, spread across the people who most need it.",
    ],
    facts: [
      { label: 'Delivery', value: 'Organisational engagement, on-site and virtual' },
      {
        label: 'Phases',
        steps: [
          'Pre-analysis: scope the roles and choose the top performers',
          'Decode: observe and interview top performers, then map their patterns',
          'Design: build the replication programme',
          'Deliver: train the wider team, with coaching to embed the change',
          'Measure: test the shift in performance against the baseline',
        ],
      },
      { label: 'Duration', value: '3–6 months, depending on scope' },
      { label: 'For', value: 'Executives, HR and L&D leaders, and sales and operations heads' },
      { label: 'Licensing', value: 'Available for governments and large enterprises' },
    ],
    nextStep: {
      label: 'Request a scoping conversation',
      href: contactHref('other', 'Scoping conversation: Human Performance Replicator'),
    },
    site: { label: 'Visit humanperformancereplicator.com', href: 'https://humanperformancereplicator.com' },
  },
  {
    id: 'pattern-intelligence',
    name: 'The Pattern Intelligence™ Programme',
    label: 'Individuals, teams and organisations',
    headline: 'Decode the pattern. Unlock the potential.',
    description: [
      "Why do intelligent, capable people keep producing outcomes they don't want? Because behaviour is never the problem. It's the evidence. The Pattern Intelligence™ Programme is a structured journey. You see the unconscious patterns driving your results, build a steady, regulated base, and redesign the predictions underneath your behaviour. Then you lead and perform from a new level. It works for individuals, teams, departments and whole organisations.",
    ],
    facts: [
      { label: 'Delivery', value: 'Online cohort or one-to-one, with in-house versions for teams and organisations' },
      {
        label: 'Journey',
        steps: ['See the pattern', 'Build the regulated base', 'Advanced Pattern Recognition', 'Aligned Execution'],
      },
      { label: 'Duration', value: '8–12 weeks, with live sessions, practices and integration work' },
      {
        label: 'Includes',
        value:
          'A Pattern Signature™ assessment at the start or the short pattern scan until the full assessment is ready',
      },
      { label: 'For', value: "Leaders, professionals and teams ready to change what's underneath, not just manage it" },
    ],
    nextStep: { label: 'Take the pattern scan', href: '/discover-your-pattern' },
  },
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
