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

export type OrderProductType = 'session' | 'self-paced' | 'live' | 'group' | 'mentorship' | 'other'

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
}

export interface LeadWelcomeEmailProps extends LeadWelcomeEmailData {
  unsubscribeUrl: string
}
