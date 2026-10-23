export interface CartItem {
  id: string
  title: string
  variant_title?: string
  quantity: number
  unit_price: number
  thumbnail?: string
}

export interface CartEmailData {
  cartId: string
  email: string
  firstName?: string
  items: CartItem[]
  total: number
  currency: string
  cartUrl: string
}

export interface OrderLineItem {
  id: string
  title: string
  variantTitle?: string | null
  quantity: number
  unitPrice: number
}

export interface MembershipEmailData {
  email: string
  firstName: string | null
  tier: 'free' | 'silver' | 'gold' | 'practitioner'
  tierLabel: string
  renewalDate?: string | null
  siteUrl: string
}

/**
 * Props actually rendered by templates that carry a working unsubscribe link.
 * The send function (not the caller) injects unsubscribeUrl via
 * buildUnsubscribeUrl() so routes keep passing plain CartEmailData /
 * MembershipEmailData.
 */
export interface CartEmailProps extends CartEmailData {
  unsubscribeUrl: string
}

export interface MembershipEmailProps extends MembershipEmailData {
  unsubscribeUrl: string
}

/** 'live-course': a live programme whose seat also enrols a Thinkific course (materials now, Zoom details later). */
export type OrderProductType = 'session' | 'self-paced' | 'live' | 'live-course' | 'group' | 'mentorship' | 'download' | 'other'

/** A file the order delivers: a signed link the buyer clicks (see lib/downloads/storage.ts). */
export interface OrderDownload {
  title: string
  url: string
}

export interface OrderEmailData {
  id: string
  displayId: number
  createdAt: string
  currency: string
  firstName: string | null
  email: string
  items: OrderLineItem[]
  subtotal: number
  /** Voucher or discount taken off the subtotal; shown as its own row when above 0. */
  discountTotal?: number
  taxTotal: number
  total: number
  productType?: OrderProductType
  calBookingUrl?: string | null
  /** Signed links for files bought as a download; shown above the order summary. */
  downloads?: OrderDownload[]
  /** Business checkout: the company the order is billed to, shown under the order reference. */
  business?: { companyName: string; vatNumber: string | null } | null
  /** The portal block (H-13): sign up with the order email, or log in when an account exists. */
  portalInvite?: PortalInvite | null
}

/** Where the order mail sends the buyer for the member portal (H-13). */
export interface PortalInvite {
  kind: 'signup' | 'login'
  url: string
}

/** A Cal.com booking past the client's paid sessions (J-07). */
export interface BookingOverLimitEmailData {
  email: string
  firstName: string | null
  /** "Fri, 30 October 2026" (SAST) */
  dateLabel: string
  /** "10:00 - 11:00 SAST" */
  timeLabel: string
  /** False when the address has no session purchase at all */
  hasPackage: boolean
  buyMoreUrl: string
  appointmentsUrl: string
}

export interface QuizInviteEmailData {
  email: string
  firstName: string
  quizTitle: string
  link: string
  /** When this copy was requested, shown in the email so repeat sends of the same link are not identical (Gmail hides identical repeats as "..."). */
  requestedAt?: string
}

/** The subscriber's own full report, the same content the results screen shows. */
export interface QuizReportEmailData {
  email: string
  firstName: string
  quizTitle: string
  resultTitle: string
  resultSubtitle: string
  mirror: string
  mechanism: string
  impact: string[]
  shift: string[]
  ctaLabel: string
  ctaLink: string
}

export interface QuizAnsweredQuestion {
  text: string
  answerLabel: string
}

export interface QuizCompletionEmailData {
  firstName: string
  lastName: string
  email: string
  quizTitle: string
  resultTitle: string
  resultSubtitle: string
  questions: QuizAnsweredQuestion[]
}

/** Auto-reply to a /contact form submission. */
export interface ContactAcknowledgementEmailData {
  email: string
  firstName: string
  /** One of the form's enquiry options, or null when none (or "Other") was picked. */
  enquiry: string | null
  message: string
}

export type LeadWelcomeSource = 'masterclass' | 'community' | 'newsletter' | 'assessments-notify' | 'homepage'

/** Welcome email after a lead form sign-up (POST /api/lead-magnet). */
export interface LeadWelcomeEmailData {
  email: string
  /** Only when the form collected one; the greeting falls back to "Hi there,". */
  firstName: string | null
  source: LeadWelcomeSource
  /** Masterclass "Watch Later": the date and time the visitor picked, formatted. */
  watchAt?: string | null
}

export interface LeadWelcomeEmailProps extends LeadWelcomeEmailData {
  unsubscribeUrl: string
}
