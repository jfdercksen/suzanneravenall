import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createElement, type ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import CartAbandonment1 from './CartAbandonment1'
import CartAbandonment2 from './CartAbandonment2'
import CartAbandonment3 from './CartAbandonment3'
import MembershipWelcome from './MembershipWelcome'
import MembershipRenewalReminder from './MembershipRenewalReminder'
import MembershipExpired from './MembershipExpired'
import QuizInvite from './QuizInvite'
import ContactAcknowledgement from './ContactAcknowledgement'
import LeadWelcome from './LeadWelcome'
import { LEAD_WELCOME_CONTENT } from '../lead-welcome-content'
import OrderConfirmation from '../../../emails/OrderConfirmation'
import type { CartEmailProps, LeadWelcomeSource, MembershipEmailProps } from '../types'

/**
 * Render smoke tests for the POPIA footer requirements:
 *  - no email ever ships an href="#" placeholder link
 *  - marketing emails carry the real unsubscribe URL
 *  - every customer-facing email footer shows the physical address
 */

const UNSUB_URL = 'https://suzanneravenall.com/unsubscribe?token=test-token'
const ADDRESS = '42 Test Street, Kyalami, Gauteng, 1684, South Africa'

const cartProps: CartEmailProps = {
  cartId: 'cart_1',
  email: 'shopper@example.com',
  firstName: 'Alice',
  items: [{ id: 'i1', title: 'Inner Circle Coaching', quantity: 1, unit_price: 9900 }],
  total: 9900,
  currency: 'ZAR',
  cartUrl: 'https://suzanneravenall.com/checkout?cart=cart_1',
  unsubscribeUrl: UNSUB_URL,
}

const membershipProps: MembershipEmailProps = {
  email: 'member@example.com',
  firstName: 'Alice',
  tier: 'gold',
  tierLabel: 'Gold Membership',
  renewalDate: '2026-09-01',
  siteUrl: 'https://suzanneravenall.com',
  unsubscribeUrl: UNSUB_URL,
}

describe('email template rendering (POPIA footer)', () => {
  beforeEach(() => {
    vi.stubEnv('COMPANY_PHYSICAL_ADDRESS', ADDRESS)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  const marketing: Array<[string, () => string]> = [
    ['CartAbandonment1', () => renderToStaticMarkup(createElement(CartAbandonment1, cartProps))],
    ['CartAbandonment2', () => renderToStaticMarkup(createElement(CartAbandonment2, cartProps))],
    ['CartAbandonment3', () => renderToStaticMarkup(createElement(CartAbandonment3, cartProps))],
    ['MembershipWelcome', () => renderToStaticMarkup(createElement(MembershipWelcome, membershipProps))],
    ['MembershipRenewalReminder', () => renderToStaticMarkup(createElement(MembershipRenewalReminder, membershipProps))],
    ['MembershipExpired', () => renderToStaticMarkup(createElement(MembershipExpired, membershipProps))],
  ]

  it.each(marketing)('%s renders the unsubscribe link and physical address', (_name, render) => {
    const html = render()
    expect(html).toContain(UNSUB_URL)
    expect(html).toContain(ADDRESS)
    expect(html).not.toContain('href="#"')
  })

  it('QuizInvite (transactional) renders the physical address with no placeholder links', () => {
    const html = renderToStaticMarkup(
      createElement(QuizInvite, {
        email: 'lead@example.com',
        firstName: 'Alice',
        quizTitle: 'Nervous System Diagnostic',
        link: 'https://suzanneravenall.com/explore/nervous-system/quiz?token=abc',
      })
    )
    expect(html).toContain(ADDRESS)
    expect(html).not.toContain('href="#"')
  })

  const orderProps = {
    id: 'order_1',
    displayId: 42,
    createdAt: '2026-08-04T09:00:00.000Z',
    currency: 'ZAR',
    firstName: 'Alice',
    email: 'shopper@example.com',
    items: [{ id: 'i1', title: 'Inner Circle Coaching', variantTitle: null, quantity: 1, unitPrice: 9900 }],
    subtotal: 9900,
    taxTotal: 0,
    total: 9900,
    invoiceUrl: 'https://suzanneravenall.com/api/invoices/order_1.pdf',
    productType: 'self-paced',
    calBookingUrl: null,
  } satisfies ComponentProps<typeof OrderConfirmation>

  it('OrderConfirmation (transactional) renders the physical address with no placeholder links', () => {
    const html = renderToStaticMarkup(createElement(OrderConfirmation, orderProps))
    expect(html).toContain(ADDRESS)
    expect(html).not.toContain('href="#"')
  })

  it('OrderConfirmation shows no VAT line or tax-invoice wording when not VAT registered (default)', () => {
    vi.stubEnv('COMPANY_VAT_NUMBER', '')
    const html = renderToStaticMarkup(createElement(OrderConfirmation, orderProps))
    expect(html).not.toContain('VAT')
    expect(html).toContain('Your Invoice')
    expect(html).not.toContain('Your Tax Invoice')
  })

  it('OrderConfirmation shows the VAT line and tax-invoice wording when COMPANY_VAT_NUMBER is set', () => {
    vi.stubEnv('COMPANY_VAT_NUMBER', '4123456789')
    const html = renderToStaticMarkup(
      createElement(OrderConfirmation, { ...orderProps, subtotal: 8609, taxTotal: 1291 })
    )
    expect(html).toContain('VAT (15%)')
    expect(html).toContain('Your Tax Invoice')
    expect(html).toContain('VAT compliant')
  })

  it('OrderConfirmation says the invoice is attached, with no download button, when the PDF is attached', () => {
    const html = renderToStaticMarkup(
      createElement(OrderConfirmation, { ...orderProps, invoiceUrl: null, invoiceAttachmentName: 'invoice-42.pdf' })
    )
    expect(html).toContain('attached to this email as a PDF')
    expect(html).toContain('invoice-42.pdf')
    expect(html).not.toContain('Download Invoice')
    expect(html).not.toContain('separate email')
  })

  it('OrderConfirmation says the fallback link lasts 7 days', () => {
    const html = renderToStaticMarkup(createElement(OrderConfirmation, orderProps))
    expect(html).toContain('Download Invoice (PDF)')
    expect(html).toContain('works for 7 days')
    expect(html).not.toContain('Keep this invoice for your records')
  })

  it('OrderConfirmation promises no separate invoice email when there is no invoice', () => {
    const html = renderToStaticMarkup(createElement(OrderConfirmation, { ...orderProps, invoiceUrl: null }))
    expect(html).not.toContain('separate email')
    expect(html).toContain('reply to this email and we will send it to you')
  })

  it.each(Object.keys(LEAD_WELCOME_CONTENT) as LeadWelcomeSource[])(
    'LeadWelcome (%s, marketing) renders its copy, site link, unsubscribe link and address',
    (source) => {
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://suzanneravenall.com')
      const content = LEAD_WELCOME_CONTENT[source]
      const html = renderToStaticMarkup(
        createElement(LeadWelcome, { email: 'lead@example.com', firstName: 'Alice', source, unsubscribeUrl: UNSUB_URL })
      )
      expect(html).toContain(UNSUB_URL)
      expect(html).toContain(ADDRESS)
      expect(html).toContain('Hi Alice,')
      expect(html).toContain(`href="https://suzanneravenall.com${content.link.path}"`)
      expect(html).not.toContain('href="#"')
      expect(html).not.toMatch(/\u2014/)
    }
  )

  it('ContactAcknowledgement (transactional) renders the enquiry, the escaped message and contact details', () => {
    const html = renderToStaticMarkup(
      createElement(ContactAcknowledgement, {
        email: 'alice@example.com',
        firstName: 'Alice',
        enquiry: 'Group Program',
        message: 'Hello <b>there</b> & welcome',
      })
    )
    expect(html).toContain('Thank you, Alice')
    expect(html).toContain('We received your message about Group Program.')
    expect(html).toContain('within 2 business days')
    expect(html).toContain('Hello &lt;b&gt;there&lt;/b&gt; &amp; welcome')
    expect(html).toContain('mailto:sravenall@suzanneravenall.com')
    expect(html).toContain('tel:+27105970841')
    expect(html).toContain(ADDRESS)
    expect(html).not.toContain('href="#"')
    expect(html).not.toMatch(/\u2014/)
  })

  it('falls back to the real company address when the env var is unset', () => {
    vi.stubEnv('COMPANY_PHYSICAL_ADDRESS', '')
    const html = renderToStaticMarkup(createElement(CartAbandonment1, cartProps))
    expect(html).toContain('Oxmoor Street, Kyalami Estates, Johannesburg, 1684, South Africa')
    expect(html).not.toContain('8 Oxmoor Street')
  })
})
