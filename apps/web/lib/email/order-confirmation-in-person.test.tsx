import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@react-email/components'
import type { ReactElement } from 'react'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))
vi.mock('./send', () => ({ sendEmail: mockSend }))

import { sendOrderConfirmationEmail } from './order-confirmation'
import { IN_PERSON_ARRANGED_LINE } from '../booking/in-person-copy'
import type { OrderEmailData } from './types'

const PARAGRAPH =
  'Your in-person session is arranged by our team. Suzanne sets aside one day a month for in-person sessions, and we will contact you to agree the date and time.'

const base: OrderEmailData = {
  id: 'order_1',
  displayId: 42,
  createdAt: '2026-11-27T10:00:00.000Z',
  currency: 'ZAR',
  firstName: 'Thandi',
  email: 'thandi@example.com',
  items: [{ id: 'i1', title: 'Rapid Repatterning Session', variantTitle: '90 min in-person', quantity: 1, unitPrice: 150000 }],
  subtotal: 150000,
  taxTotal: 0,
  total: 150000,
  productType: 'session',
}

async function sendAndRender(order: OrderEmailData) {
  mockSend.mockResolvedValue('msg')
  await sendOrderConfirmationEmail({ order, invoiceUrl: null })
  const call = mockSend.mock.calls[0]![0] as { text: string; react: ReactElement }
  return { text: call.text, html: await render(call.react) }
}

describe('order confirmation with an in-person session', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the approved wording', () => {
    expect(IN_PERSON_ARRANGED_LINE).toBe(PARAGRAPH)
  })

  it('all in-person: the paragraph replaces the booking block, in HTML and plain text', async () => {
    const { text, html } = await sendAndRender({ ...base, calBookingUrl: null, inPersonArranged: true })
    expect(html).toContain(PARAGRAPH)
    expect(text).toContain(PARAGRAPH)
    expect(html).not.toContain('Book Your Session')
    expect(text).not.toContain('BOOK YOUR SESSION')
    expect(html).not.toContain('Your booking link is above')
    expect(text).toContain('Our team will contact you to agree the date and time of your session.')
  })

  it('mixed: the booking block stays and the paragraph follows it', async () => {
    const { text, html } = await sendAndRender({ ...base, calBookingUrl: 'http://site/book/abc', inPersonArranged: true })
    expect(html).toContain('Book Your Session')
    expect(html).toContain(PARAGRAPH)
    expect(html.indexOf('Book Your Session')).toBeLessThan(html.indexOf(PARAGRAPH))
    expect(text).toContain('http://site/book/abc')
    expect(text.indexOf('BOOK YOUR SESSION')).toBeLessThan(text.indexOf(PARAGRAPH))
    expect(html).toContain('Your booking link is above')
  })

  it('without the flag: nothing changes', async () => {
    const { text, html } = await sendAndRender({ ...base, calBookingUrl: 'http://site/book/abc' })
    expect(html).not.toContain('in-person session is arranged')
    expect(text).not.toContain('in-person session is arranged')
    expect(html).toContain('Book Your Session')
  })

  it('has no em dash in the new copy', async () => {
    const { text, html } = await sendAndRender({ ...base, calBookingUrl: null, inPersonArranged: true })
    expect(text).not.toContain('—')
    expect(html).not.toContain('—')
  })
})
