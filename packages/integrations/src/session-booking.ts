/**
 * Which Cal.com event a private-session purchase books on (KI079).
 *
 * Every session product has four Cal.com event types to match its length:
 * session-30, session-45, session-60 and session-90 under the suzanneravenall
 * user. The order mail (apps/medusa order-placed) and the confirmation page
 * (apps/web checkout status) both build the "Book Your Session" link here, so
 * the two can never point at different pages. The free discovery call keeps
 * its own link and never comes through here.
 */

export const SESSION_DURATIONS = [30, 45, 60, 90] as const
export type SessionDuration = (typeof SESSION_DURATIONS)[number]

/** A package or a variant without a length books the standard hour. */
export const DEFAULT_SESSION_DURATION: SessionDuration = 60

export interface SessionLine {
  productTitle?: string | null
  productHandle?: string | null
  variantTitle?: string | null
}

export interface SessionBooker {
  name?: string | null
  email?: string | null
}

// Products whose every variant, packages included, has one fixed length that
// the variant title does not repeat. Matched on the handle, then the title.
const PRODUCT_DURATION: ReadonlyArray<{ match: RegExp; minutes: SessionDuration }> = [
  { match: /alpha[\s-]mind/i, minutes: 45 },
]

function isSessionDuration(value: number): value is SessionDuration {
  return (SESSION_DURATIONS as readonly number[]).includes(value)
}

/**
 * The length of one session for this line: the minutes the variant title
 * names ("90 min online", "Package of 04 (60 min online)"), else the
 * product's fixed length, else the standard hour. A package books one
 * session at a time, so it inherits its per-session length.
 */
export function sessionDurationMinutes(line: SessionLine): SessionDuration {
  const fromVariant = /(\d+)\s*min/i.exec(line.variantTitle ?? '')
  if (fromVariant) {
    const minutes = Number(fromVariant[1])
    if (isSessionDuration(minutes)) return minutes
  }
  const product = `${line.productHandle ?? ''} ${line.productTitle ?? ''}`
  const fixed = PRODUCT_DURATION.find(({ match }) => match.test(product))
  return fixed ? fixed.minutes : DEFAULT_SESSION_DURATION
}

/**
 * The booking page for this line, with the buyer's name and email filled in
 * (Cal.com reads ?name= and &email=). `baseUrl` is the Cal.com user page,
 * CALCOM_SESSION_BOOKING_URL, for example http://host:3002/suzanneravenall.
 */
export function sessionBookingUrl(baseUrl: string, line: SessionLine, booker: SessionBooker = {}): string {
  const base = baseUrl.trim().replace(/\/+$/, '')
  const params = new URLSearchParams()
  const name = booker.name?.trim()
  const email = booker.email?.trim()
  if (name) params.set('name', name)
  if (email) params.set('email', email)
  const query = params.toString()
  return `${base}/session-${sessionDurationMinutes(line)}${query ? `?${query}` : ''}`
}

/** "First Last" from the parts an order or cart carries; null when both are empty. */
export function bookerName(first?: string | null, last?: string | null): string | null {
  const name = [first, last].map((part) => part?.trim() ?? '').filter(Boolean).join(' ')
  return name === '' ? null : name
}
