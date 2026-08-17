/**
 * Testimonials — the single source of truth for every written client
 * testimonial rendered on the site or in transactional emails.
 *
 * ============================================================================
 * DO NOT ADD ENTRIES WITHOUT DR. SUZANNE RAVENALL'S VERIFIED SIGN-OFF.
 * Every entry must be a real, verbatim client quote that Suzanne has approved
 * in writing. No invented names, no composite quotes, no paraphrasing.
 * The empty arrays / null values below are INTENTIONAL: the consuming
 * components render nothing at all while a slot has no verified content.
 * ============================================================================
 *
 * Consumers:
 * - components/home/TestimonialSpotlight.tsx      → `spotlightTestimonial`
 * - components/testimonials/TestimonialsContent.tsx → `spotlightTestimonial`
 *                                                     (stat band) + note below
 * - components/home/TestimonialsSection.tsx       → `homepageTestimonials`
 * - components/shop/ProductPageContent.tsx        → `productTestimonials`
 * - components/book/BookContent.tsx               → `bookTestimonials`
 * - lib/email/templates/CartAbandonment3.tsx      → `emailTestimonial`
 * - lib/email/templates/MembershipExpired.tsx     → `memberEmailTestimonial`
 *
 * NOTE: the long written-testimonials grid on /testimonials
 * (components/testimonials/TestimonialsContent.tsx) and the per-topic quotes
 * in app/explore/topics.ts were harvested verbatim from the previous live
 * suzanneravenall.com site and are treated as already-published client
 * content. They still deserve Suzanne's confirmation, but they are not
 * fabricated and are left in place.
 */

export interface Testimonial {
  /** Verbatim client quote, exactly as approved. */
  quote: string
  /** Real client name (or approved anonymised form, e.g. first name only). */
  name: string
  /** Role / company / city as approved, e.g. 'Executive Director, Johannesburg'. */
  title?: string
  /** Location only, e.g. 'Cape Town' — used where title is not shown. */
  location?: string
  /** Short outcome label, e.g. 'Leadership transformation'. */
  result?: string
}

export interface SpotlightTestimonial {
  /** Headline stat, e.g. '2×'. */
  stat: string
  /** Label under the stat, describing what the stat measures. */
  statLabel: string
  /** One-line supporting context under the divider. */
  supporting: string
  /** Verbatim client quote. */
  quote: string
  /** Real client name. */
  name: string
  /** Role / location line, e.g. 'CEO · Cape Town'. */
  role: string
  /** Initials for the avatar circle (until a real headshot is supplied). */
  initials: string
}

export interface EmailTestimonial {
  /** Verbatim client quote. */
  quote: string
  /** Attribution line, e.g. 'Thandi N., Johannesburg'. */
  attribution: string
}

/**
 * Homepage spotlight (big stat + quote) — also drives the stat band on
 * /testimonials. AWAITING a real, verified client story from Suzanne.
 */
export const spotlightTestimonial: SpotlightTestimonial | null = null

/**
 * Homepage testimonial card grid (TestimonialsSection).
 * AWAITING verified entries from Suzanne — requires full name, role,
 * company, city and ideally a headshot photo per entry.
 */
export const homepageTestimonials: Testimonial[] = []

/**
 * Shop product page "Client Stories" section.
 * AWAITING verified entries from Suzanne.
 */
export const productTestimonials: Testimonial[] = []

/**
 * /book "Early Readers Say" section.
 * AWAITING verified book-specific reader quotes from Suzanne.
 */
export const bookTestimonials: Testimonial[] = []

/**
 * Cart-abandonment email #3 "What Others Are Saying" block.
 * AWAITING a verified client quote from Suzanne.
 */
export const emailTestimonial: EmailTestimonial | null = null

/**
 * Membership-expired email member quote block.
 * AWAITING a verified member quote from Suzanne.
 */
export const memberEmailTestimonial: EmailTestimonial | null = null
