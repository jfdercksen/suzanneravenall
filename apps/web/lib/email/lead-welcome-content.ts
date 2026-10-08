import type { LeadWelcomeSource } from './types'
import { MASTERCLASS_WATCH_PATH } from '../masterclass'

/**
 * Words for the lead welcome email, one entry per form. Every sentence comes
 * from the page the visitor signed up on, so the email promises nothing the
 * page did not:
 *   masterclass         components/masterclass/MasterclassContent.tsx + EmailCaptureForm.tsx
 *   community           app/community/CommunityContent.tsx
 *   newsletter          components/resources/ResourcesNewsletterCTA.tsx
 *   assessments-notify  app/resources/assessments/AssessmentsContent.tsx + EmailNotifyForm.tsx
 *   homepage            components/home/LeadMagnet.tsx (The Breakthrough Trilogy)
 * Shared by the HTML template and the plain-text part.
 */
export type LeadWelcomeContent = {
  subject: string
  heading: string
  /** What they signed up for. */
  intro: string[]
  /** What happens next, as the page promised it. */
  next: string
  link: { label: string; path: string }
  /** Ends the footer line "You are receiving this because ...". */
  reason: string
}

// MASTERCLASS_TITLE in components/masterclass/MasterclassContent.tsx (a client
// component, so it is not imported into server email code).
const MASTERCLASS_TITLE =
  'Breaking the hold of the child brain on adult adversity. A quest to find an upgraded version of you.'

export const LEAD_WELCOME_CONTENT: Record<LeadWelcomeSource, LeadWelcomeContent> = {
  masterclass: {
    subject: "You're on the list for the free masterclass",
    heading: "Thank you, you're on the list",
    intro: [
      `You registered your interest in the free masterclass: ${MASTERCLASS_TITLE}`,
      'It is a free, one-hour, pre-recorded masterclass that you watch on demand, whenever suits you. It is a taster of the Trauma to Transcendence programme: your first experience of working at the pattern level before going deeper.',
    ],
    // Watch Now / Watch Later, as on the current site (Shayna, 7 Oct). A
    // "Watch Later" sign-up gets leadWelcomeNext's line with their time.
    next: 'Watch the masterclass whenever suits you, on the link below. Watch it to the end for your next step.',
    link: { label: 'Watch the masterclass', path: MASTERCLASS_WATCH_PATH },
    reason: 'you registered your interest in the free masterclass on suzanneravenall.com',
  },
  community: {
    subject: "You're on the list for the community launch",
    heading: "You're on the list",
    intro: [
      "You asked to hear when Your Transformation Community launches: a private space for members to connect, share breakthroughs, and support each other's journey. It is coming soon.",
    ],
    next: "We'll let you know as soon as the community launches.",
    link: { label: 'Discover the programmes', path: '/programs' },
    reason: 'you asked to hear when the community launches on suzanneravenall.com',
  },
  newsletter: {
    subject: 'Welcome to the Monthly Insights Newsletter',
    heading: "You're on the list",
    intro: [
      'Thank you for subscribing to the Monthly Insights Newsletter.',
      'Each month, Dr. Suzanne Ravenall shares insights on consciousness, healing, inner regulation and transformation, the kind of wisdom that changes how you see yourself and your world.',
    ],
    next: 'Watch your inbox for the next issue.',
    link: { label: 'Browse the resources', path: '/resources' },
    reason: 'you subscribed to the Monthly Insights Newsletter on suzanneravenall.com',
  },
  'assessments-notify': {
    subject: "You're on the list for the assessments",
    heading: "You're on the list",
    intro: [
      'You asked to hear when the self-assessment tools launch: tools to help you identify your patterns and chart your transformation path.',
      'These tools are not live yet for anyone, members included.',
    ],
    next: "We'll let you know as soon as assessments are available.",
    link: { label: 'Explore every area of your life', path: '/explore' },
    reason: 'you asked to hear when the assessments launch on suzanneravenall.com',
  },
  homepage: {
    subject: 'We will let you know when The Breakthrough Trilogy is released',
    heading: 'Thank you, your request is in',
    intro: [
      'The Breakthrough Trilogy is on pre-order. You asked to hear when it is released.',
    ],
    next: 'We will let you know the moment it is released.',
    link: { label: 'About the book', path: '/book' },
    reason: 'you asked to hear when The Breakthrough Trilogy is released on suzanneravenall.com',
  },
}

/**
 * The welcome a lead form source gets, or null for none. A missing source is
 * the homepage form (the route stores it as "homepage"). Quiz sources get
 * their own report email, and unknown sources get nothing.
 */
/** The "What happens next" line: the masterclass one names a Watch Later time. */
export function leadWelcomeNext(source: LeadWelcomeSource, watchAt?: string | null): string {
  if (source === 'masterclass' && watchAt) {
    return `You chose to watch on ${watchAt}. Your link is below and works whenever you are ready. Watch it to the end for your next step.`
  }
  return LEAD_WELCOME_CONTENT[source].next
}

export function leadWelcomeSource(source: string | null | undefined): LeadWelcomeSource | null {
  const value = source?.trim() || 'homepage'
  return Object.prototype.hasOwnProperty.call(LEAD_WELCOME_CONTENT, value) ? (value as LeadWelcomeSource) : null
}
