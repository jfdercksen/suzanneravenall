import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { MedusaProduct } from '@/types/medusa'
import ProductPageContent from './ProductPageContent'

vi.mock('./ProductHero', () => ({ ProductHero: () => null }))
// Records what the page hands the selector, so its props can be checked.
const selectorProps: Array<Record<string, unknown>> = []
vi.mock('./VariantSelector', () => ({
  VariantSelector: (props: Record<string, unknown>) => {
    selectorProps.push(props)
    return null
  },
}))
vi.mock('./FAQAccordion', () => ({
  FAQAccordion: ({ items }: { items: Array<{ question: string }> }) => (
    <ul>
      {items.map((i) => (
        <li key={i.question}>{i.question}</li>
      ))}
    </ul>
  ),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('framer-motion', () => {
  const strip = (tag: string) =>
    function MotionStub({
      children,
      initial,
      animate,
      exit,
      transition,
      variants,
      whileInView,
      viewport,
      whileHover,
      whileTap,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) {
      return React.createElement(tag, props, children)
    }
  return { motion: { div: strip('div'), section: strip('section') } }
})

function makeProduct(overrides: Partial<MedusaProduct> = {}): MedusaProduct {
  return {
    id: 'prod_1',
    handle: 'rapid-repatterning-session',
    title: 'Rapid Repatterning Session',
    description: 'A private session.',
    thumbnail: null,
    variants: [],
    categories: [{ id: 'c', handle: 'rapid-repatterning', name: 'Rapid Repatterning', parent_category_id: null }],
    metadata: {},
    collection: null,
    ...overrides,
  }
}

const book = makeProduct({
  handle: 'the-latest-book-by-suzanne',
  title: 'The Latest Book',
  description: 'First paragraph about the book.\n\nSecond paragraph.',
  categories: [{ id: 'b', handle: 'books', name: 'Books', parent_category_id: null }],
  variants: [{ id: 'v1', title: 'Pre-order', prices: [] }],
})

describe('ProductPageContent layout', () => {
  it('clips the details block so it cannot widen the page on phones', () => {
    render(
      <ProductPageContent product={makeProduct({ metadata: { included: ['One private session'] } })} />
    )
    const heading = screen.getByRole('heading', { name: "What's Included" })
    const section = heading.closest('section')
    expect(section?.className).toMatch(/\boverflow-hidden\b/)
  })
})

describe('ProductPageContent per product type (site check C1)', () => {
  it('a book gets no session FAQ, no programme wording, no What\'s Included and no Prerequisites', () => {
    render(<ProductPageContent product={book} />)
    expect(screen.getByText('Book Details')).toBeInTheDocument()
    expect(screen.getByText('Book')).toBeInTheDocument()
    expect(screen.queryByText(/session/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/programme/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: "What's Included" })).not.toBeInTheDocument()
    expect(screen.queryByText('Prerequisites')).not.toBeInTheDocument()
    expect(screen.queryByText('Frequently Asked Questions')).not.toBeInTheDocument()
  })

  it('shows the full description, paragraph by paragraph', () => {
    render(<ProductPageContent product={book} />)
    expect(screen.getByText('First paragraph about the book.')).toBeInTheDocument()
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument()
  })

  it('a session uses session wording and only the general FAQ', () => {
    render(<ProductPageContent product={makeProduct()} />)
    expect(screen.getByText('Session Details')).toBeInTheDocument()
    expect(screen.getByText('Is this right for me?')).toBeInTheDocument()
    expect(screen.queryByText('How does a session work?')).not.toBeInTheDocument()
    expect(screen.queryByText(/None required/)).not.toBeInTheDocument()
  })

  it('a live course with a Thinkific id is not labelled Self-Paced', () => {
    render(
      <ProductPageContent
        product={makeProduct({
          handle: 'art-of-deep-clearing-level-1-self-study',
          title: 'Deep Energy Clearing Fundamentals (Live via Zoom)',
          categories: [],
          metadata: { thinkific_course_id: 1892663 },
          variants: [{ id: 'v1', title: 'Standard', prices: [] }],
        })}
      />
    )
    expect(screen.getByText('Live')).toBeInTheDocument()
    expect(screen.queryByText('Self-Paced')).not.toBeInTheDocument()
    expect(screen.getByText('Programme Details')).toBeInTheDocument()
  })

  it('renders What\'s Included, Prerequisites and FAQ from metadata when supplied', () => {
    render(
      <ProductPageContent
        product={makeProduct({
          metadata: {
            included: ['One 60 minute session'],
            prerequisites: 'Program 1',
            faq: [{ question: 'Custom question?', answer: 'Custom answer.' }],
          },
        })}
      />
    )
    expect(screen.getByText('One 60 minute session')).toBeInTheDocument()
    expect(screen.getByText('Program 1')).toBeInTheDocument()
    expect(screen.getByText('Custom question?')).toBeInTheDocument()
    expect(screen.queryByText('Is this right for me?')).not.toBeInTheDocument()
  })

  it('preselects a variant other than the retaker seat and links payment plans to the contact form', () => {
    selectorProps.length = 0
    render(
      <ProductPageContent
        product={makeProduct({
          handle: 'resonance-repatterning-program-1-fundamentals-live-via-zoom',
          title: 'Program 1',
          categories: [{ id: 'r', handle: 'rp-live', name: 'Live', parent_category_id: null }],
          variants: [
            { id: 'retaker', title: 'Live Retaker', prices: [] },
            { id: 'self', title: 'Self Study', prices: [] },
          ],
        })}
      />
    )
    expect(selectorProps[0]?.selectedVariantId).toBe('self')
    expect(selectorProps[0]?.chooseLabel).toBe('Choose Your Format')
    expect(selectorProps[0]?.paymentPlanHref).toBe(
      '/contact?enquiry=practitioner&topic=Payment+plan%3A+Program+1#message'
    )
  })
})
