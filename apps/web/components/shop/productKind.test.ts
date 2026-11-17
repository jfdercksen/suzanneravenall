import { describe, it, expect } from 'vitest'
import {
  defaultVariantId,
  descriptionParagraphs,
  firstSentence,
  getDeliveryBadge,
  getProductKind,
  hasFormatChoice,
  isComingSoonProduct,
  isComingSoonVariant,
  isSelfStudyProduct,
  metadataFaq,
  metadataList,
  isFormatCategory,
  productTopicCategory,
  selectedFormatBadge,
  variantFormat,
} from './productKind'
import type { MedusaProduct } from '@/types/medusa'

// Shapes taken from the review store's real catalogue (site check C1, C3).
function product(
  handle: string,
  title: string,
  variants: string[],
  categoryHandles: string[] = [],
  metadata: Record<string, unknown> | null = null
): MedusaProduct {
  return {
    id: handle,
    handle,
    title,
    description: null,
    thumbnail: null,
    metadata,
    variants: variants.map((t, i) => ({ id: `${handle}-${i}`, title: t, prices: [] })),
    categories: categoryHandles.map((h) => ({ id: h, handle: h, name: h, parent_category_id: null })),
    collection: null,
  }
}

const book = product('the-latest-book-by-suzanne', 'The Latest Book', ['Pre-order'], ['books'])
const ebook = product('quantum-healing-codes-ebook-audio-download', 'Quantum Healing Codes', ['eBook & Audio Download'], ['digital-downloads'])
const session = product('rapid-repatterning-session', 'Rapid Repatterning Session', ['60 min in-person', '90 min online'], ['rapid-repatterning'])
const liveAndSelfStudy = product(
  'resonance-repatterning-program-1-fundamentals-live-via-zoom',
  'Program 1',
  ['Live Retaker', 'Self Study', 'Live via Zoom'],
  ['rp-live'],
  { thinkific_course_id: 1349879 }
)
// Thinkific course id, but titled live: used to be labelled Self-Paced.
const liveThinkific = product(
  'art-of-deep-clearing-level-1-self-study',
  'Deep Energy Clearing Fundamentals: Clearing Self, Level 1 (Live via Zoom)',
  ['Standard'],
  [],
  { thinkific_course_id: 1892663 }
)
const selfStudyThinkific = product('meditation-self-study', 'Meditation (Self Study)', ['Standard'], [], { thinkific_course_id: 1892716 })
const selfPacedByCategory = product('bringing-your-energy-back', 'Bringing Your Energy Back', ['Default'], ['energy-clearing-self-paced'])
const group = product('money-mastery-group-session', 'Money Mastery', ['Live (booked as series)', 'Recorded series'], ['group-sessions-live'])
const emailSupport = product('email-support', 'Email Support', ['Per month'])
const sessionNoCategory = product('rapid-repatterning-session-60-min-online', 'Rapid Repatterning', ['60 min online', '60 min in-person'])

describe('getProductKind', () => {
  it('reads the kind from the category first', () => {
    expect(getProductKind(book)).toBe('book')
    expect(getProductKind(ebook)).toBe('download')
    expect(getProductKind(session)).toBe('session')
    expect(getProductKind(group)).toBe('group')
    expect(getProductKind(liveAndSelfStudy)).toBe('programme')
  })

  it('falls back to metadata and variant names for uncategorised products', () => {
    expect(getProductKind(liveThinkific)).toBe('programme')
    expect(getProductKind(sessionNoCategory)).toBe('session')
    expect(getProductKind(emailSupport)).toBe('service')
  })
})

describe('getDeliveryBadge', () => {
  it('never calls a book or an ebook a session', () => {
    expect(getDeliveryBadge(book)?.label).toBe('Book')
    expect(getDeliveryBadge(ebook)?.label).toBe('Download')
  })

  it('labels sessions as sessions, and In-Person only when every option is', () => {
    expect(getDeliveryBadge(session)?.label).toBe('Session')
    expect(getDeliveryBadge(product('x', 'X', ['60 min in-person'], ['rapid-repatterning']))?.label).toBe('In-Person')
  })

  it('reads live and self-study from the variants, not the handle', () => {
    expect(getDeliveryBadge(liveAndSelfStudy)?.label).toBe('Live or Self-Paced')
    expect(getDeliveryBadge(group)?.label).toBe('Live or Recorded')
  })

  it('does not call a live course Self-Paced because it has a Thinkific id', () => {
    expect(getDeliveryBadge(liveThinkific)?.label).toBe('Live')
    expect(getDeliveryBadge(selfStudyThinkific)?.label).toBe('Self-Paced')
  })

  it('falls back to the category for placeholder variants', () => {
    expect(getDeliveryBadge(selfPacedByCategory)?.label).toBe('Self-Paced')
  })

  it('shows no badge when the data does not say', () => {
    expect(getDeliveryBadge(emailSupport)).toBeNull()
    expect(getDeliveryBadge(product('post-traumatic-growth', 'Post Traumatic Growth Presentation', ['Standard'], [], { thinkific_course_id: 1 }))).toBeNull()
  })
})

describe('isSelfStudyProduct', () => {
  it('keeps live-only courses out of the Self-Study filter', () => {
    expect(isSelfStudyProduct(liveThinkific)).toBe(false)
    expect(isSelfStudyProduct(selfStudyThinkific)).toBe(true)
    expect(isSelfStudyProduct(liveAndSelfStudy)).toBe(true)
  })

  it('leaves out books, sessions and support packages', () => {
    expect(isSelfStudyProduct(book)).toBe(false)
    expect(isSelfStudyProduct(session)).toBe(false)
    expect(isSelfStudyProduct(emailSupport)).toBe(false)
  })
})

describe('defaultVariantId', () => {
  it('never preselects a retaker seat', () => {
    expect(defaultVariantId(liveAndSelfStudy.variants)).toBe(`${liveAndSelfStudy.handle}-1`)
  })

  it('uses the only variant even when it is a retaker seat', () => {
    expect(defaultVariantId([{ id: 'v', title: 'Live Retaker', prices: [] }])).toBe('v')
    expect(defaultVariantId([])).toBe('')
  })
})

describe('description helpers', () => {
  const text = 'First line of the promise. More text here.\n\n     Second paragraph   with indent.'

  it('splits paragraphs and tidies indents', () => {
    expect(descriptionParagraphs(text)).toEqual(['First line of the promise. More text here.', 'Second paragraph with indent.'])
    expect(descriptionParagraphs(null)).toEqual([])
  })

  it('takes the first sentence from the first paragraph only', () => {
    expect(firstSentence(text)).toBe('First line of the promise.')
    expect(firstSentence('No full stop\n\nNext paragraph. Here.')).toBe('No full stop.')
    expect(firstSentence('')).toBeNull()
  })
})

describe('metadata readers', () => {
  it('reads lists from arrays or lines', () => {
    expect(metadataList(['A', ' ', 'B '])).toEqual(['A', 'B'])
    expect(metadataList('A\nB\n')).toEqual(['A', 'B'])
    expect(metadataList(42)).toEqual([])
  })

  it('keeps only complete FAQ entries', () => {
    expect(metadataFaq([{ question: 'Q', answer: 'A' }, { question: 'Q2' }, 'x'])).toEqual([{ question: 'Q', answer: 'A' }])
    expect(metadataFaq('nope')).toEqual([])
  })
})


describe('coming soon (Suzanne, 12 Oct: recorded series not yet sold as self study)', () => {
  const live = { id: 'live', title: 'Live', prices: [], metadata: null }
  const recordedSoon = { id: 'rec', title: 'Recorded series', prices: [], metadata: { coming_soon: true } }
  const recorded = { id: 'rec2', title: 'Recorded series', prices: [], metadata: { thinkific_course_id: 1776395 } }

  it('reads the flag from variant metadata, as a boolean or a string', () => {
    expect(isComingSoonVariant(recordedSoon)).toBe(true)
    expect(isComingSoonVariant({ metadata: { coming_soon: 'true' } })).toBe(true)
    expect(isComingSoonVariant(recorded)).toBe(false)
    expect(isComingSoonVariant(live)).toBe(false)
  })

  it('a product is coming soon only when every format is', () => {
    const base = product('group-session-attraction-frequency-recorded', 'Group Session: Attraction Frequency', [], ['group-sessions-recorded'])
    expect(isComingSoonProduct({ ...base, variants: [recordedSoon] })).toBe(true)
    expect(isComingSoonProduct({ ...base, variants: [live, recordedSoon] })).toBe(false)
    expect(isComingSoonProduct({ ...base, variants: [] })).toBe(false)
  })

  it('the badge says Coming Soon for an all-coming-soon product and keeps the format badge otherwise', () => {
    const base = product('group-session-develop-super-confidence', 'Group Session: Develop Super Confidence', [], ['group-sessions-live'])
    expect(getDeliveryBadge({ ...base, variants: [recordedSoon] })?.label).toBe('Coming Soon')
    expect(getDeliveryBadge({ ...base, variants: [live, recordedSoon] })?.label).toBe('Live or Recorded')
  })
})

describe('format per variant (Shayna, 17 Nov)', () => {
  const formats = {
    handle: 'deep-energy-clearing-advanced-clearing-others-level-2-live-via-zoom',
    title: 'Energy Alignment & Optimisation: Advanced (Live via Zoom)',
    metadata: {},
    categories: [
      {
        id: 'c',
        handle: 'energy-clearing-live',
        name: 'Live',
        parent_category_id: 'p',
        parent_category: { id: 'p', handle: 'energy-clearing-programmes', name: 'Energy Alignment & Optimisation' },
      },
    ],
    variants: [
      { id: 'r', title: 'Live Retaker', prices: [] },
      { id: 's', title: 'Self Study', prices: [] },
      { id: 'l', title: 'Live via Zoom', prices: [] },
    ],
  }

  it('reads one format from a variant title', () => {
    expect(variantFormat('Self Study')).toBe('self-study')
    expect(variantFormat('Live Retaker')).toBe('live')
    expect(variantFormat('Live (booked as series)')).toBe('live')
    expect(variantFormat('Recorded series')).toBe('recorded')
    expect(variantFormat('Business Capacity: Self Study')).toBe('self-study')
    expect(variantFormat('Single Session (Live)')).toBe('live')
    expect(variantFormat('60 min online')).toBeNull()
    expect(variantFormat(null)).toBeNull()
  })

  it('knows when the formats are sold as variants', () => {
    expect(hasFormatChoice(formats)).toBe(true)
    expect(hasFormatChoice({ variants: [{ id: 'a', title: 'Self Study', prices: [] }] })).toBe(false)
    expect(hasFormatChoice({ variants: [{ id: 'a', title: '60 min', prices: [] }, { id: 'b', title: '90 min', prices: [] }] })).toBe(false)
  })

  it('the badge follows the selected variant', () => {
    expect(selectedFormatBadge(formats, 's')?.label).toBe('Self-Paced')
    expect(selectedFormatBadge(formats, 'l')?.label).toBe('Live')
    expect(selectedFormatBadge(formats, 'r')?.label).toBe('Live')
    // Nothing selected that names a format: the product badge.
    expect(selectedFormatBadge(formats, 'missing')?.label).toBe('Live or Self-Paced')
  })

  it('a session keeps its session badge whatever is selected', () => {
    const session = {
      ...formats,
      categories: [{ id: 'x', handle: 'private-sessions', name: 'Private Sessions', parent_category_id: null }],
      variants: [
        { id: 'a', title: 'Single Session (Self Study)', prices: [] },
        { id: 'b', title: 'Single Session (Live)', prices: [] },
      ],
    }
    expect(selectedFormatBadge(session, 'a')?.label).toBe('Session')
  })

  it('names a format category by its topic, and any other category as it is', () => {
    expect(isFormatCategory('akashic-live')).toBe(true)
    expect(isFormatCategory('life-enhancing-self-paced')).toBe(true)
    expect(isFormatCategory('group-sessions-recorded')).toBe(true)
    expect(isFormatCategory('books')).toBe(false)
    expect(productTopicCategory(formats)?.name).toBe('Energy Alignment & Optimisation')
    const noParent = { categories: [{ id: 'c', handle: 'akashic-live', name: 'Live', parent_category_id: 'p' }] }
    expect(productTopicCategory(noParent)?.name).toBe('Live')
    expect(productTopicCategory({ categories: [{ id: 'b', handle: 'books', name: 'Books', parent_category_id: null }] })?.name).toBe('Books')
    expect(productTopicCategory({ categories: [] })).toBeUndefined()
  })
})
