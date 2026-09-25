import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockSendEmail, mockIsConfigured } = vi.hoisted(() => ({
  mockSendEmail: vi.fn(),
  mockIsConfigured: vi.fn(),
}))

vi.mock('@/lib/email/send', () => ({
  sendEmail: mockSendEmail,
  isEmailConfigured: mockIsConfigured,
}))

vi.mock('@/lib/log', () => ({ logError: vi.fn() }))

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
    expect(json.error).toMatch(/email hello@suzanneravenall.com directly/)
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
})
