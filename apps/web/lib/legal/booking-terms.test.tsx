import { readFileSync } from 'fs'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LegalTermsContent from '@/app/legal/terms/LegalTermsContent'
import LegalPrivacyContent from '@/app/legal/privacy/LegalPrivacyContent'
import { CheckoutTermsDetails } from '@/components/checkout/CheckoutTermsDetails'
import { LIVE_TERMS, LIVE_TRAINING_PRIVACY, MEDIA_TERMS, REFUND_TERMS } from './booking-terms'

/**
 * A2 to A5 (go-live, 25 Nov 2026): Suzanne's own wording from her current
 * site, the PO Box only, and 12 months with lifetime as a paid add-on.
 */

beforeEach(() => {
  // framer-motion's whileInView needs an observer jsdom lacks.
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('A3: her booking terms on /legal/terms and at checkout', () => {
  it('carries her refund clause word for word, with the 3% administration fee', () => {
    expect(REFUND_TERMS).toContain('Cancellation of orders by the client after the purchase has been made will attract a 3% administration fee')
    expect(REFUND_TERMS).toContain('we will refund the client in full within 30 days')
  })

  it('shows the refund clause, the media licence and every live-programme term on the Terms page', () => {
    const { container } = render(<LegalTermsContent />)
    const text = container.textContent ?? ''
    expect(text).toContain(REFUND_TERMS)
    expect(screen.getByRole('heading', { name: '4B. Events, photos and recordings' })).toBeInTheDocument()
    expect(text).toContain(MEDIA_TERMS)
    expect(screen.getByRole('heading', { name: '4C. Live programs' })).toBeInTheDocument()
    for (const term of LIVE_TERMS) expect(text).toContain(term)
    expect(LIVE_TERMS).toHaveLength(26)
    expect(text).not.toContain('—')
  })

  it('lets the buyer expand the same terms under the checkout tick before ticking', async () => {
    render(<CheckoutTermsDetails />)
    const summary = screen.getByText('Read the booking terms')
    const details = summary.closest('details')!
    expect(details.open).toBe(false)
    await userEvent.click(summary)
    expect(details.open).toBe(true)
    const text = details.textContent ?? ''
    expect(text).toContain(REFUND_TERMS)
    expect(text).toContain(MEDIA_TERMS)
    expect(text).toContain(LIVE_TERMS[LIVE_TERMS.length - 1]!)
    expect(screen.getByRole('link', { name: 'Terms and Conditions' })).toHaveAttribute('href', '/legal/terms')
  })
})

describe('A2 and A4: the Privacy Notice', () => {
  it('shows the PO Box from her signature and no street address (Suzanne: "use the box address")', () => {
    const { container } = render(<LegalPrivacyContent />)
    const text = container.textContent ?? ''
    expect(text).toContain('PO Box 910, Kyalami, Midrand, Johannesburg, South Africa, 1685')
    expect(text).not.toMatch(/Oxmoor|Physical address/)
  })

  it('carries her live-training paragraph, her purposes and support@ as on her current policy', () => {
    const { container } = render(<LegalPrivacyContent />)
    const text = container.textContent ?? ''
    expect(text).toContain(LIVE_TRAINING_PRIVACY)
    expect(text).toContain('For the detection and prevention of fraud, crime, money laundering or other malpractice')
    expect(text).toContain('We will need a copy of your ID document')
    expect(text).toContain('support@ravenallinstitute.com')
    // Kept from the POPIA work of 18 and 24 Nov.
    expect(text).toContain('Dr. Suzanne Ravenall, Information Officer')
    expect(text).toContain('the email that sends your completed')
    // Her policy names another company ("COR Concepts"); not carried over.
    expect(text).not.toContain('COR Concepts')
  })
})

describe('A5: 12 months, lifetime access is a paid add-on (Suzanne, 24 Nov)', () => {
  const web = join(__dirname, '..', '..')
  const sources = ['app/programs/ProgramsPageClient.tsx', 'components/services/Programs.tsx', 'data/programs.ts'].map((f) =>
    readFileSync(join(web, f), 'utf8'),
  )

  it('no page promises access for as long as you need, or lifetime access included', () => {
    for (const s of sources) {
      expect(s).not.toMatch(/as long as you\s+need|Lifetime access to all recordings/)
    }
  })

  it('says 12 months with lifetime access as a paid add-on where it said otherwise', () => {
    const joined = sources.join('\n')
    expect(joined.match(/12 months/g)?.length ?? 0).toBeGreaterThanOrEqual(4)
    expect(joined).toContain('lifetime access as a paid add-on')
  })
})
