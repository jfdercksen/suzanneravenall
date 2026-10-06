import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockSendEmail, mockIsConfigured, mockSendAck, mockLogError } = vi.hoisted(() => ({
  mockSendEmail: vi.fn(),
  mockIsConfigured: vi.fn(),
  mockSendAck: vi.fn(),
  mockLogError: vi.fn(),
}))

vi.mock('@/lib/email/send', () => ({
  sendEmail: mockSendEmail,
  isEmailConfigured: mockIsConfigured,
}))

vi.mock('@/lib/log', () => ({ logError: mockLogError }))

// The real helpers (first name, enquiry label), only the send is replaced.
vi.mock('@/lib/email/contact-acknowledgement', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/email/contact-acknowledgement')>()),
  sendContactAcknowledgementEmail: mockSendAck,
}))

import { POST } from './route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

const validBody = {
  name: 'Alice <script>',
  email: 'alice@example.com',
  phone: '+27 82 000 0000',
  enquiry: 'Private sessions',
  message: 'Hello & welcome',
}

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsConfigured.mockReturnValue(true)
    mockSendEmail.mockResolvedValue('msg-1')
    mockSendAck.mockResolvedValue('ack-1')
  })

  afterEach(() => vi.unstubAllEnvs())

  it('returns 400 on a body that is not JSON', async () => {
    const res = await POST(makeRequest('{not json') as never)
    expect(res.status).toBe(400)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('returns 400 when name, email or message is missing or invalid', async () => {
    const res = await POST(makeRequest({ ...validBody, email: 'nope' }) as never)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/valid email/)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('sends the notification with the visitor as reply-to and returns 200', async () => {
    vi.stubEnv('CONTACT_NOTIFY_EMAIL', 'hello@suzanneravenall.com')

    const res = await POST(makeRequest(validBody) as never)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    const call = mockSendEmail.mock.calls[0]![0]
    expect(call.to).toEqual(['hello@suzanneravenall.com'])
    expect(call.replyTo).toBe('alice@example.com')
    expect(call.subject).toBe('New contact message from Alice <script>')
  })

  it('falls back to hello@ when CONTACT_NOTIFY_EMAIL is an empty string', async () => {
    // docker-compose passes an unset variable as '' (30 Sep 2026: every send refused).
    vi.stubEnv('CONTACT_NOTIFY_EMAIL', '')

    const res = await POST(makeRequest(validBody) as never)

    expect(res.status).toBe(200)
    expect(mockSendEmail.mock.calls[0]![0].to).toEqual(['hello@suzanneravenall.com'])
  })

  it('escapes HTML in the visitor fields', async () => {
    await POST(makeRequest(validBody) as never)

    const html: string = mockSendEmail.mock.calls[0]![0].html
    expect(html).toContain('Alice &lt;script&gt;')
    expect(html).toContain('Hello &amp; welcome')
    expect(html).not.toContain('<script>')
  })

  it('leaves out phone and enquiry rows when they are not supplied', async () => {
    await POST(makeRequest({ name: 'Bob', email: 'bob@example.com', message: 'Hi' }) as never)

    const html: string = mockSendEmail.mock.calls[0]![0].html
    expect(html).not.toContain('Phone')
    expect(html).not.toContain('Enquiry')
  })

  it('returns 500 with a direct-email hint when mail is not configured', async () => {
    mockIsConfigured.mockReturnValue(false)

    const res = await POST(makeRequest(validBody) as never)

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toMatch(/email sravenall@suzanneravenall.com directly/)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('returns 500 instead of a false success when the send fails', async () => {
    mockSendEmail.mockRejectedValue(new Error('Brevo error: unauthorized'))

    const res = await POST(makeRequest(validBody) as never)

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.success).toBeUndefined()
    expect(json.error).toMatch(/could not send your message/)
  })

  describe('visitor acknowledgement', () => {
    it('sends the visitor an acknowledgement after the staff notification', async () => {
      const res = await POST(
        makeRequest({ ...validBody, name: '  Alice van der Berg ', message: '  Hello & welcome  ' }) as never
      )

      expect(res.status).toBe(200)
      expect(mockSendAck).toHaveBeenCalledTimes(1)
      expect(mockSendAck).toHaveBeenCalledWith({
        email: 'alice@example.com',
        firstName: 'Alice',
        // "Private sessions" is not one of the form's options, so it is not echoed back.
        enquiry: null,
        message: 'Hello & welcome',
      })
    })

    it('passes a real enquiry option through and drops "Other"', async () => {
      await POST(makeRequest({ ...validBody, enquiry: 'Speaking Enquiry' }) as never)
      expect(mockSendAck.mock.calls[0]![0].enquiry).toBe('Speaking Enquiry')

      await POST(makeRequest({ ...validBody, enquiry: 'Other' }) as never)
      expect(mockSendAck.mock.calls[1]![0].enquiry).toBeNull()
    })

    it('still answers 200 and logs when the acknowledgement fails', async () => {
      mockSendAck.mockRejectedValue(new Error('Brevo error: invalid recipient'))

      const res = await POST(makeRequest(validBody) as never)

      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ success: true })
      await vi.waitFor(() =>
        expect(mockLogError).toHaveBeenCalledWith(
          '[contact] acknowledgement email to the visitor failed',
          expect.any(Error),
          { enquiry: 'Private sessions' }
        )
      )
    })

    it('does not wait for the acknowledgement before answering', async () => {
      mockSendAck.mockReturnValue(new Promise(() => {}))

      const res = await POST(makeRequest(validBody) as never)

      expect(res.status).toBe(200)
    })

    it('sends no acknowledgement when the staff notification failed', async () => {
      mockSendEmail.mockRejectedValue(new Error('Brevo error: unauthorized'))

      const res = await POST(makeRequest(validBody) as never)

      expect(res.status).toBe(500)
      expect(mockSendAck).not.toHaveBeenCalled()
    })
  })
})
