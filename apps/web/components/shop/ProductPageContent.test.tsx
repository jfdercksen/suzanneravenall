import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { MedusaProduct } from '@/types/medusa'
import ProductPageContent from './ProductPageContent'

vi.mock('./ProductHero', () => ({ ProductHero: () => null }))
vi.mock('./VariantSelector', () => ({ VariantSelector: () => null }))
vi.mock('./FAQAccordion', () => ({ FAQAccordion: () => null }))

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

const product = {
  id: 'prod_1',
  handle: 'rapid-repatterning-session',
  title: 'Rapid Repatterning Session',
  description: 'A private session.',
  variants: [],
  categories: [],
  metadata: {},
} as unknown as MedusaProduct

describe('ProductPageContent layout', () => {
  it('clips the slide-in "What\'s Included" block so it cannot widen the page on phones', () => {
    render(<ProductPageContent product={product} />)
    const heading = screen.getByRole('heading', { name: "What's Included" })
    const section = heading.closest('section')
    expect(section?.className).toMatch(/\boverflow-hidden\b/)
  })
})
