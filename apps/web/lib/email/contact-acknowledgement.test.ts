import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('./send', () => ({ sendEmail: mockSend }))

import {
  CONTACT_REPLY_PROMISE,
  enquiryLabel,
  firstNameOf,
  sendContactAcknowledgementEmail,
} from './contact-acknowledgement'

const data = {
  email: 'alice@example.com',
  firstName: 'Alice',
  enquiry: 'Speaking Enquiry',
  message: 'Could Suzanne speak at our conference?\nWe are in Durban.',
}

describe('sendContactAcknowledgementEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue('msg-ack')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://suzanneravenall.com')
  })

  afterEach(() => vi.unstubAllEnvs())

  it('sends to the visitor with the business address as reply-to', async () => {
    const id = await sendContactAcknowledgementEmail(data)

    expect(id).toBe('msg-ack')
    const arg = mockSend.mock.calls[0]![0]
    expect(arg.to).toEqual(['alice@example.com'])
    expect(arg.replyTo).toBe('sravenall@suzanneravenall.com')
    expect(arg.subject).toBe('We received your message, Alice')
    expect(arg.react).toBeTruthy()
  })

  it('plain text thanks by first name, names the enquiry, repeats the message and the reply promise', async () => {
    await sendContactAcknowledgementEmail(data)

    const text: string = mockSend.mock.calls[0]![0].text
    expect(text).toContain('Thank you, Alice')
    expect(text).toContain('We received your message about Speaking Enquiry.')
    expect(text).toContain(CONTACT_REPLY_PROMISE)
    expect(text).toContain('Could Suzanne speak at our conference?\nWe are in Durban.')
    expect(text).toContain('Email: sravenall@suzanneravenall.com')
    expect(text).toContain('Phone: +27 10 597 0841')
    expect(text).toContain('Website: https://suzanneravenall.com/contact')
    expect(text).not.toMatch(/\u2014/)
  })

  it('leaves the enquiry out when there is none', async () => {
    await sendContactAcknowledgementEmail({ ...data, enquiry: null })

    const text: string = mockSend.mock.calls[0]![0].text
    expect(text).toContain('We received your message.')
    expect(text).not.toContain('message about')
  })

  it('propagates a send failure to the caller', async () => {
    mockSend.mockRejectedValue(new Error('Brevo error: x'))
    await expect(sendContactAcknowledgementEmail(data)).rejects.toThrow('Brevo error: x')
  })
})

describe('helpers', () => {
  it('reuses the reply promise the contact page shows', () => {
    expect(CONTACT_REPLY_PROMISE).toBe("Suzanne's team will be in touch within 2 business days.")
  })

  it('firstNameOf takes the first word', () => {
    expect(firstNameOf('  Alice van der Berg ')).toBe('Alice')
    expect(firstNameOf('Bob')).toBe('Bob')
  })

  it('enquiryLabel only echoes real form options', () => {
    expect(enquiryLabel('1-on-1 Coaching')).toBe('1-on-1 Coaching')
    expect(enquiryLabel('Other')).toBeNull()
    expect(enquiryLabel('')).toBeNull()
    expect(enquiryLabel(undefined)).toBeNull()
    expect(enquiryLabel('Buy cheap pills')).toBeNull()
  })
})
