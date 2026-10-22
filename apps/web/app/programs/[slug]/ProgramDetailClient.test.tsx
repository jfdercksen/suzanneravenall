import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { getProgramBySlug } from '@/data/programs'
import { ProgramPricesProvider } from '@/components/programs/ProgramPrices'
import { programPriceTexts } from '@/lib/programs/program-prices'
import ProgramDetailClient from './ProgramDetailClient'

const cartState: { cart: { currency_code: string } | null } = { cart: null }
vi.mock('@/lib/cart', () => ({ useCart: () => cartState }))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
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
  return {
    motion: new Proxy({}, { get: (_t, tag: string) => strip(tag) }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

describe('ProgramDetailClient facilitator credentials', () => {
  it('keeps the credentials strip at two columns so "International" fits its cell', () => {
    const program = getProgramBySlug('energy-clearing-basic')!
    render(<ProgramDetailClient program={program} relatedPrograms={[]} />)
    const grid = screen.getByText('International').closest('.grid') as HTMLElement
    expect(grid.className).toMatch(/\bgrid-cols-2\b/)
    expect(grid.className).not.toMatch(/grid-cols-4/)
  })
})

describe('ProgramDetailClient sourced content (sourcing report 6 Oct)', () => {
  it('shows the sourced key takeaways instead of the generic outcome cards', () => {
    const program = getProgramBySlug('energy-clearing-basic')!
    render(<ProgramDetailClient program={program} relatedPrograms={[]} />)
    expect(screen.getByRole('heading', { name: 'Clear yourself' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Shift Your Perspective' })).not.toBeInTheDocument()
  })

  it('keeps the generic outcome cards when no takeaways are sourced', () => {
    const program = getProgramBySlug('getting-unstuck')!
    render(<ProgramDetailClient program={program} relatedPrograms={[]} />)
    expect(screen.getByRole('heading', { name: 'Shift Your Perspective' })).toBeInTheDocument()
  })

  it('shows the sourced who-it-is-for text and prerequisite link', () => {
    const program = getProgramBySlug('trauma-to-transcendence')!
    render(<ProgramDetailClient program={program} relatedPrograms={[]} />)
    expect(screen.getByText(/A two-fold programme/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Coherence Muscle Testing' })).toHaveAttribute(
      'href',
      '/programs/coherence-muscle-testing',
    )
  })

  it('labels Energy Clearing as self-study, not live training', () => {
    const program = getProgramBySlug('energy-clearing-advanced')!
    render(<ProgramDetailClient program={program} relatedPrograms={[]} />)
    expect(screen.getAllByText('Self-Study Online: Start Anytime').length).toBeGreaterThan(0)
    expect(screen.queryByText('Live Training via Zoom')).not.toBeInTheDocument()
  })

  it('asks for interest, not a booking, on a live programme with no dates', () => {
    const program = getProgramBySlug('mindfulness')!
    render(<ProgramDetailClient program={program} relatedPrograms={[]} />)
    expect(screen.getAllByText('Register Interest').length).toBeGreaterThan(0)
    expect(screen.queryByText('View in Shop')).not.toBeInTheDocument()
    expect(screen.getByText(/No live dates are scheduled yet/)).toBeInTheDocument()
  })
})

// L-USD3: the visitor's currency only, dollars from Medusa, never derived from rand.
describe('ProgramDetailClient price in the visitor currency (L-USD3)', () => {
  const program = getProgramBySlug('resonance-repatterning-basic-5-series')!
  const withUsd = programPriceTexts(program, [
    { id: 'v', title: 'Standard', prices: [{ currency_code: 'zar', amount: 1395000 }, { currency_code: 'usd', amount: 210500 }] },
  ])
  const withoutUsd = programPriceTexts(program, [
    { id: 'v', title: 'Standard', prices: [{ currency_code: 'zar', amount: 1395000 }] },
  ])

  function renderIn(currency: string, texts = withUsd) {
    return render(
      <ProgramPricesProvider texts={{ [program.slug]: texts }} defaultCurrency={currency}>
        <ProgramDetailClient program={program} relatedPrograms={[]} />
      </ProgramPricesProvider>,
    )
  }

  it('shows a South African visitor the rand price only, as before', () => {
    renderIn('zar')
    expect(screen.getAllByText('R13,950').length).toBe(2)
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
  })

  it('shows a visitor elsewhere the Medusa dollar price only', () => {
    renderIn('usd')
    expect(screen.getAllByText('$2,105').length).toBe(2)
    expect(screen.queryByText(/R13,950/)).not.toBeInTheDocument()
    expect(screen.queryByText(/2,540/)).not.toBeInTheDocument()
  })

  it('says "Price on request" to a dollar visitor when the product has no dollar price', () => {
    renderIn('usd', withoutUsd)
    expect(screen.getAllByText('Price on request').length).toBe(2)
    expect(screen.queryByText(/R13,950/)).not.toBeInTheDocument()
  })

  it('follows the cart currency once a cart exists', () => {
    cartState.cart = { currency_code: 'usd' }
    try {
      renderIn('zar')
      expect(screen.getAllByText('$2,105').length).toBe(2)
    } finally {
      cartState.cart = null
    }
  })
})
