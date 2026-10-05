import type { MedusaProduct } from '@/types/medusa'

/**
 * What a shop product actually is, read from the data the store already holds
 * (category, variant titles, handle, title, metadata), so the shop card and
 * the product page stop using one generic programme template for everything
 * (site check C1, C3).
 *
 * Nothing here invents a product fact. When the data does not say, the
 * answer is "unknown" and the page hides the block instead of guessing.
 */

export type ProductKind =
  | 'book'
  | 'download'
  | 'session'
  | 'group'
  | 'programme'
  | 'service'

export type DeliveryFormat = 'live' | 'self-study' | 'recorded' | 'in-person'

/** Private-session sub-categories: these are booked, not studied. */
export const SESSION_CATEGORY_HANDLES = new Set([
  'private-sessions',
  'rapid-repatterning',
  'resonance-repatterning-sessions',
  'transformation-coaching',
  'executive-coaching',
  'akashic-coaching',
  'family-coaching',
  'exploring-the-alpha-mind',
  'rapid-transformation-therapy',
  'energetic-clearing',
])

const GROUP_CATEGORY_HANDLES = new Set(['group-sessions', 'group-sessions-live', 'group-sessions-recorded'])

const PROGRAMME_CATEGORY_HANDLES = new Set([
  'guided-programmes',
  'rp-programmes',
  'rp-live',
  'rp-self-paced',
  'akashic-navigator',
  'akashic-live',
  'akashic-self-paced',
  'energy-clearing-programmes',
  'energy-clearing-live',
  'energy-clearing-self-paced',
  'life-enhancing',
  'life-enhancing-live',
  'life-enhancing-self-paced',
  'meditation-programmes',
])

const LIVE_RE = /\blive\b/i
const SELF_STUDY_RE = /self[\s-]?(study|paced)|selfstudy/i
const RECORDED_RE = /\brecorded\b/i
const IN_PERSON_RE = /in[\s-]person/i
/** Session variants are named by length, e.g. "60 min online", "Single session (45 min)". */
const SESSION_LENGTH_RE = /\b\d+\s*min/i

/** Placeholder variant titles that say nothing about the format. */
const NEUTRAL_VARIANT_RE = /^(default|standard|default variant)$/i

function formatsIn(text: string): DeliveryFormat[] {
  const out: DeliveryFormat[] = []
  if (LIVE_RE.test(text)) out.push('live')
  if (SELF_STUDY_RE.test(text)) out.push('self-study')
  if (RECORDED_RE.test(text)) out.push('recorded')
  if (IN_PERSON_RE.test(text)) out.push('in-person')
  return out
}

/**
 * The delivery formats a product is sold in. Variant titles win: a handle that
 * ends in "live-via-zoom" often also sells a "Self Study" variant. Only when
 * the variants are placeholders ("Standard", "Default") is the rest read, in
 * the order the buyer sees it: the title, then the handle, then the
 * category (e.g. "energy-clearing-self-paced"). Some handles contradict
 * their titles ("art-of-deep-clearing-level-1-self-study" is titled
 * "... (Live via Zoom)"), so the title wins.
 */
export function getDeliveryFormats(
  product: Pick<MedusaProduct, 'handle' | 'title' | 'variants'> & { categories?: MedusaProduct['categories'] }
): Set<DeliveryFormat> {
  const titles = product.variants.map((v) => v.title ?? '').filter((t) => !NEUTRAL_VARIANT_RE.test(t.trim()))
  const fromVariants = titles.flatMap(formatsIn)
  if (fromVariants.length > 0) return new Set(fromVariants)
  const fallbacks = [
    product.title,
    product.handle.replace(/-/g, ' '),
    (product.categories ?? []).map((c) => c.handle.replace(/-/g, ' ')).join(' '),
  ]
  for (const text of fallbacks) {
    const found = formatsIn(text)
    if (found.length > 0) return new Set(found)
  }
  return new Set()
}

export function hasThinkificCourse(product: Pick<MedusaProduct, 'metadata'>): boolean {
  const id = product.metadata?.thinkific_course_id
  return id != null && id !== 0 && id !== ''
}

export function getProductKind(
  product: Pick<MedusaProduct, 'handle' | 'title' | 'variants' | 'categories' | 'metadata'>
): ProductKind {
  const cats = product.categories.map((c) => c.handle)
  if (cats.includes('books')) return 'book'
  if (cats.includes('digital-downloads')) return 'download'
  if (cats.some((c) => SESSION_CATEGORY_HANDLES.has(c))) return 'session'
  if (cats.some((c) => GROUP_CATEGORY_HANDLES.has(c))) return 'group'
  if (cats.some((c) => PROGRAMME_CATEGORY_HANDLES.has(c))) return 'programme'
  // Uncategorised products: read what the data does say.
  if (hasThinkificCourse(product)) return 'programme'
  if (product.variants.some((v) => SESSION_LENGTH_RE.test(v.title ?? ''))) return 'session'
  if (getDeliveryFormats(product).size > 0) return 'programme'
  // Support packages, fees and other add-ons.
  return 'service'
}

export interface Badge {
  label: string
  className: string
}

const BADGE_LIVE = 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30'
const BADGE_NEUTRAL = 'bg-brand-sand text-brand-ink border border-brand-border'
const BADGE_IN_PERSON = 'bg-brand-primary-900 text-white border border-brand-primary-900'
const BADGE_RECORDED = 'bg-white text-brand-ink border border-brand-primary-300'
const BADGE_MUTED = 'bg-brand-sand text-brand-muted'

/**
 * The format badge for a card or product page, or null when the data does
 * not say (better no badge than a wrong one).
 */
export function getDeliveryBadge(
  product: Pick<MedusaProduct, 'handle' | 'title' | 'variants' | 'categories' | 'metadata'>
): Badge | null {
  const kind = getProductKind(product)
  if (kind === 'book') return { label: 'Book', className: BADGE_MUTED }
  if (kind === 'download') return { label: 'Download', className: BADGE_MUTED }

  if (kind === 'session') {
    // In-Person only when every option is in person ("60 min online" is not).
    const allInPerson =
      product.variants.length > 0 && product.variants.every((v) => IN_PERSON_RE.test(v.title ?? ''))
    return allInPerson ? { label: 'In-Person', className: BADGE_IN_PERSON } : { label: 'Session', className: BADGE_MUTED }
  }

  const formats = getDeliveryFormats(product)

  const live = formats.has('live')
  const selfStudy = formats.has('self-study')
  const recorded = formats.has('recorded')
  if (live && selfStudy) return { label: 'Live or Self-Paced', className: BADGE_LIVE }
  if (live && recorded) return { label: 'Live or Recorded', className: BADGE_LIVE }
  if (live) return { label: 'Live', className: BADGE_LIVE }
  if (selfStudy) return { label: 'Self-Paced', className: BADGE_NEUTRAL }
  if (recorded) return { label: 'Recorded', className: BADGE_RECORDED }
  if (formats.has('in-person')) return { label: 'In-Person', className: BADGE_IN_PERSON }
  return null
}

/**
 * Whether a product belongs under the "Self-Study" shop filter: it sells a
 * self-study format, or it is a course on the Ravenall Institute with nothing
 * saying it is live.
 */
export function isSelfStudyProduct(
  product: Pick<MedusaProduct, 'handle' | 'title' | 'variants' | 'categories' | 'metadata'>
): boolean {
  const kind = getProductKind(product)
  if (kind === 'book' || kind === 'download' || kind === 'session' || kind === 'service') return false
  const formats = getDeliveryFormats(product)
  if (formats.has('self-study')) return true
  return hasThinkificCourse(product) && formats.size === 0
}

/** The noun for one of these products, used in "Choose your ..." copy. */
export function productNoun(kind: ProductKind): string {
  switch (kind) {
    case 'session':
      return 'session'
    case 'group':
      return 'group session'
    case 'programme':
      return 'programme'
    default:
      return 'option'
  }
}

/** Eyebrow over the product page details block. */
export function detailsEyebrow(kind: ProductKind): string {
  switch (kind) {
    case 'session':
      return 'Session Details'
    case 'group':
      return 'Group Session Details'
    case 'programme':
      return 'Programme Details'
    case 'book':
      return 'Book Details'
    case 'download':
      return 'Download Details'
    default:
      return 'Details'
  }
}

/** Heading over the variant buttons. */
export function variantChooserLabel(kind: ProductKind): string {
  switch (kind) {
    case 'session':
      return 'Choose Your Session'
    case 'group':
    case 'programme':
      return 'Choose Your Format'
    default:
      return 'Choose an Option'
  }
}

/**
 * The variant to preselect. A retaker seat is only for people repeating a
 * programme, so it is never the default even when the store lists it first.
 */
export function defaultVariantId(variants: MedusaProduct['variants']): string {
  const first = variants.find((v) => !/retaker/i.test(v.title ?? '')) ?? variants[0]
  return first?.id ?? ''
}

/** Reads a list of strings from product metadata (array, or one item per line). */
export function metadataList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string').map((v) => v.trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value.split('\n').map((v) => v.trim()).filter(Boolean)
  }
  return []
}

export interface FaqItem {
  question: string
  answer: string
}

/** Reads FAQ entries ({ question, answer }[]) from product metadata. */
export function metadataFaq(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (v): v is FaqItem =>
      typeof v === 'object' &&
      v !== null &&
      typeof (v as FaqItem).question === 'string' &&
      typeof (v as FaqItem).answer === 'string' &&
      (v as FaqItem).question.trim() !== '' &&
      (v as FaqItem).answer.trim() !== ''
  )
}

/** Contact form enquiry key (app/contact/enquiry.ts) for a payment-plan question. */
export function paymentPlanEnquiry(kind: ProductKind): 'coaching' | 'group' | 'practitioner' | 'other' {
  switch (kind) {
    case 'session':
      return 'coaching'
    case 'group':
      return 'group'
    case 'programme':
      return 'practitioner'
    default:
      return 'other'
  }
}

/** Splits a plain-text store description into paragraphs, tidying stray indents. */
export function descriptionParagraphs(description: string | null | undefined): string[] {
  return (description ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

/**
 * The first sentence of the description, for the hero. Taken from the first
 * paragraph only, so a paragraph break is never run into the next one
 * (site check C1: splitting the raw text on ". " joined paragraphs).
 */
export function firstSentence(description: string | null | undefined): string | null {
  const first = descriptionParagraphs(description)[0]
  if (!first) return null
  const match = first.match(/^(.+?[.!?])(\s|$)/)
  const sentence = (match?.[1] ?? first).trim()
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`
}
