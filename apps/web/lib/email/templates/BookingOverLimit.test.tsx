import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))
vi.mock('../send', () => ({ sendEmail: mockSend }))

import BookingOverLimit from './BookingOverLimit'
import OrderConfirmation from '../../../emails/OrderConfirmation'
import { buildPlainText, sendBookingOverLimitEmail } from '../booking-over-limit'
import { sendOrderConfirmationEmail } from '../order-confirmation'
import type { BookingOverLimitEmailData, OrderEmailData } from '../types'

const OVER: BookingOverLimitEmailData = {
  email: 'johan+limit1023@aiautomations.co.za',
  firstName: 'Johan',
  dateLabel: 'Thu, 12 November 2026',
  timeLabel: '10:00 - 11:00 SAST',
  hasPackage: true,
  buyMoreUrl: 'http://169.239.180.49/services',
  appointmentsUrl: 'http://169.239.180.49/portal/appointments',
}

const ORDER: OrderEmailData = {
  id: 'order_1',
  displayId: 431,
  createdAt: '2026-10-23T08:00:00.000Z',
  currency: 'zar',
  firstName: 'Johan',
  email: 'johan+limit1023@aiautomations.co.za',
  items: [{ id: 'i1', title: 'Private Session', variantTitle: 'Package of 04 (60 min online)', quantity: 1, unitPrice: 0 }],
  subtotal: 0,
  taxTotal: 0,
  total: 0,
  productType: 'session',
  calBookingUrl: `http://169.239.180.49/book/${'a'.repeat(43)}`,
}

beforeEach(() => {
  mockSend.mockReset().mockResolvedValue('mail_1')
})

describe('BookingOverLimit mail', () => {
  it('names the booking, says it will be cancelled and links to buy more and to the portal', () => {
    const html = renderToStaticMarkup(createElement(BookingOverLimit, OVER))
    expect(html).toContain('About your booking, Johan')
    expect(html).toContain('Thu, 12 November 2026, 10:00 - 11:00 SAST')
    expect(html).toContain('All the sessions in your package are already booked')
    expect(html).toContain('Our team will cancel the booking')
    expect(html).toContain('href="http://169.239.180.49/services"')
    expect(html).toContain('href="http://169.239.180.49/portal/appointments"')
    expect(html).not.toContain('href="#"')
    // House rule: no em dashes in client-facing text.
    expect(html).not.toContain('—')
  })

  it('words it for a client with no package', () => {
    const html = renderToStaticMarkup(createElement(BookingOverLimit, { ...OVER, hasPackage: false }))
    expect(html).toContain('could not find a session purchase')
  })

  it('sends to the client with a plain-text part that says the same', async () => {
    await sendBookingOverLimitEmail(OVER)
    const sent = mockSend.mock.calls[0]?.[0]
    expect(sent.to).toEqual([OVER.email])
    expect(sent.subject).toBe('About your booking on Thu, 12 November 2026')
    expect(sent.text).toBe(buildPlainText(OVER))
    expect(sent.text).toContain('Buy more sessions: http://169.239.180.49/services')
    expect(sent.text).not.toContain('—')
  })
})

describe('order confirmation: booking link and portal block (J-07, H-13)', () => {
  it('shows the per-order link and says it stays open until every session is booked', () => {
    const html = renderToStaticMarkup(createElement(OrderConfirmation, { ...ORDER, invoiceUrl: null }))
    expect(html).toContain(`href="http://169.239.180.49/book/${'a'.repeat(43)}"`)
    expect(html).toContain('it stays open until every session you paid for is booked')
  })

  it('invites a new buyer to set up the portal with the email filled in', () => {
    const url = 'http://169.239.180.49/portal/signup?email=johan%2Blimit1023%40aiautomations.co.za'
    const html = renderToStaticMarkup(createElement(OrderConfirmation, { ...ORDER, invoiceUrl: null, portalInvite: { kind: 'signup', url } }))
    expect(html).toContain('Set up your portal account')
    expect(html).toContain(`href="${url.replace(/&/g, '&amp;')}"`)
    // Every existing block stays.
    expect(html).toContain('Book Your Session')
    expect(html).toContain('Order Summary')
  })

  it('sends a buyer with an account to log in', () => {
    const url = 'http://169.239.180.49/portal/login?email=johan%2Blimit1023%40aiautomations.co.za'
    const html = renderToStaticMarkup(createElement(OrderConfirmation, { ...ORDER, invoiceUrl: null, portalInvite: { kind: 'login', url } }))
    expect(html).toContain('Log in to your portal')
    expect(html).not.toContain('Set up your portal account')
  })

  it('has no portal block without an invite', () => {
    const html = renderToStaticMarkup(createElement(OrderConfirmation, { ...ORDER, invoiceUrl: null }))
    expect(html).not.toContain('portal account')
  })

  it('carries the portal block and the booking line in the plain text', async () => {
    const url = 'http://169.239.180.49/portal/signup?email=x%40y.z'
    await sendOrderConfirmationEmail({ order: { ...ORDER, portalInvite: { kind: 'signup', url } }, invoiceUrl: null })
    const text = mockSend.mock.calls[0]?.[0].text as string
    expect(text).toContain('SET UP YOUR PORTAL ACCOUNT')
    expect(text).toContain(`Set up your portal account: ${url}`)
    expect(text).toContain('Keep this link: it stays open until every session you paid for is booked.')
  })
})
