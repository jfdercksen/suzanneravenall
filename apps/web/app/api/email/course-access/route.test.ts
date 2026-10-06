import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))
vi.mock('@/lib/email/course-access', () => ({ sendCourseAccessEmail: mockSend }))
vi.mock('@/lib/log', () => ({ logError: vi.fn() }))

import { POST } from './route'

function req(body: unknown, secret: string | null = 'n8n-secret') {
  return new Request('http://localhost/api/email/course-access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(secret ? { 'x-webhook-secret': secret } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }) as never
}

const valid = { email: 'qa.buyer@example.com', firstName: 'QA', courses: ['Program 1 Self Study'], orderId: 'order_1', displayId: 21 }

describe('POST /api/email/course-access', () => {
  beforeEach(() => {
    mockSend.mockReset()
    vi.stubEnv('N8N_WEBHOOK_SECRET', 'n8n-secret')
    vi.stubEnv('INTERNAL_WEBHOOK_SECRET', '')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('sends the mail and answers with the message id', async () => {
    mockSend.mockResolvedValue('msg_1')
    const res = await POST(req(valid))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ emailId: 'msg_1' })
    expect(mockSend).toHaveBeenCalledWith({ email: 'qa.buyer@example.com', firstName: 'QA', courses: ['Program 1 Self Study'] })
  })

  it('accepts INTERNAL_WEBHOOK_SECRET as well as N8N_WEBHOOK_SECRET', async () => {
    vi.stubEnv('INTERNAL_WEBHOOK_SECRET', 'internal')
    mockSend.mockResolvedValue('msg_1')
    expect((await POST(req(valid, 'internal'))).status).toBe(200)
    expect((await POST(req(valid, 'n8n-secret'))).status).toBe(200)
  })

  it('401 on a missing or wrong secret, nothing sent', async () => {
    expect((await POST(req(valid, null))).status).toBe(401)
    expect((await POST(req(valid, 'nope'))).status).toBe(401)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('500 when no secret is configured', async () => {
    vi.stubEnv('N8N_WEBHOOK_SECRET', '')
    expect((await POST(req(valid))).status).toBe(500)
  })

  it('422 on a bad body (no courses, bad email)', async () => {
    expect((await POST(req({ ...valid, courses: [] }))).status).toBe(422)
    expect((await POST(req({ ...valid, email: 'not-an-email' }))).status).toBe(422)
    expect((await POST(req('{nope'))).status).toBe(400)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('500 when Brevo refuses, so Medusa retries', async () => {
    mockSend.mockRejectedValue(new Error('Brevo error: HTTP 503'))
    expect((await POST(req(valid))).status).toBe(500)
  })
})
