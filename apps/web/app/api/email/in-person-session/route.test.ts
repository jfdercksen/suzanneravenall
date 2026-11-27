import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockSend, mockLog } = vi.hoisted(() => ({ mockSend: vi.fn(), mockLog: vi.fn() }))
vi.mock('@/lib/email/send', () => ({ sendEmail: mockSend }))
vi.mock('@/lib/log', () => ({ logError: mockLog }))

import { POST } from './route'
import { inPersonTeamAddress } from '@/lib/email/in-person-session'

function req(body: unknown, secret: string | null = 'n8n-secret') {
  return new Request('http://localhost/api/email/in-person-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(secret ? { 'x-webhook-secret': secret } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }) as never
}

const valid = {
  orderId: 'order_1',
  displayId: 42,
  reference: 'SR-00042',
  customerName: 'Thandi Nkosi',
  email: 'thandi@example.com',
  phone: '+27821234567',
  orderDate: '2026-11-27T08:30:00.000Z',
  lines: [{ product: 'Rapid Repatterning Session', variant: '90 min in-person', quantity: 2 }],
}

describe('POST /api/email/in-person-session', () => {
  beforeEach(() => {
    mockSend.mockReset().mockResolvedValue('msg_1')
    mockLog.mockReset()
    vi.stubEnv('N8N_WEBHOOK_SECRET', 'n8n-secret')
    vi.stubEnv('INTERNAL_WEBHOOK_SECRET', '')
    vi.stubEnv('IN_PERSON_NOTIFY_EMAIL', '')
    vi.stubEnv('CONTACT_NOTIFY_EMAIL', '')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('200: mails the team with the subject, details and footer', async () => {
    const res = await POST(req(valid))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ emailId: 'msg_1' })
    const sent = mockSend.mock.calls[0]![0] as { to: string[]; subject: string; text: string; replyTo?: string }
    expect(sent.subject).toBe('In-person session to arrange: Thandi Nkosi, SR-00042')
    expect(sent.to).toEqual(['support@ravenallinstitute.com'])
    expect(sent.replyTo).toBe('thandi@example.com')
    for (const part of ['Thandi Nkosi', 'thandi@example.com', '+27821234567', 'SR-00042', 'Rapid Repatterning Session (90 min in-person) x2', 'Contact the client to agree the day.', 'This mail holds customer details: keep it within the team.']) {
      expect(sent.text).toContain(part)
    }
    expect(sent.text).not.toContain('—')
  })

  it('401 on a missing or wrong secret, nothing sent', async () => {
    expect((await POST(req(valid, null))).status).toBe(401)
    expect((await POST(req(valid, 'nope'))).status).toBe(401)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('500 when no secret is configured', async () => {
    vi.stubEnv('N8N_WEBHOOK_SECRET', '')
    expect((await POST(req(valid))).status).toBe(500)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('400 on bad JSON, a missing reference or no lines', async () => {
    expect((await POST(req('{not json'))).status).toBe(400)
    expect((await POST(req({ ...valid, reference: undefined }))).status).toBe(400)
    expect((await POST(req({ ...valid, lines: [] }))).status).toBe(400)
    expect((await POST(req({ ...valid, email: 'not-an-address' }))).status).toBe(400)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('500 when the send fails', async () => {
    mockSend.mockRejectedValue(new Error('brevo down'))
    expect((await POST(req(valid))).status).toBe(500)
    expect(mockLog).toHaveBeenCalled()
  })

  it('accepts a notice with no phone or name', async () => {
    const res = await POST(req({ ...valid, phone: null, customerName: null }))
    expect(res.status).toBe(200)
    expect((mockSend.mock.calls[0]![0] as { subject: string }).subject).toBe('In-person session to arrange: thandi@example.com, SR-00042')
  })

  describe('recipient order', () => {
    it('IN_PERSON_NOTIFY_EMAIL first', () => {
      vi.stubEnv('IN_PERSON_NOTIFY_EMAIL', 'shayna@ravenallinstitute.com')
      vi.stubEnv('CONTACT_NOTIFY_EMAIL', 'contact@ravenallinstitute.com')
      expect(inPersonTeamAddress()).toBe('shayna@ravenallinstitute.com')
    })
    it('then CONTACT_NOTIFY_EMAIL', () => {
      vi.stubEnv('CONTACT_NOTIFY_EMAIL', 'contact@ravenallinstitute.com')
      expect(inPersonTeamAddress()).toBe('contact@ravenallinstitute.com')
    })
    it('then support', () => {
      expect(inPersonTeamAddress()).toBe('support@ravenallinstitute.com')
    })
  })
})
