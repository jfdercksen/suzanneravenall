import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))
vi.mock('@/lib/email/novice', () => ({ sendNoviceDocumentsEmail: mockSend }))
vi.mock('@/lib/log', () => ({ logError: vi.fn() }))

import { POST } from './route'

function req(body: unknown, secret: string | null = 'internal') {
  return new Request('http://localhost/api/email/novice-documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(secret ? { 'x-webhook-secret': secret } : {}) },
    body: JSON.stringify(body),
  }) as never
}

describe('POST /api/email/novice-documents', () => {
  beforeEach(() => {
    mockSend.mockReset()
    vi.stubEnv('INTERNAL_WEBHOOK_SECRET', 'internal')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('sends the upload list for a Novice level', async () => {
    mockSend.mockResolvedValue('msg_1')
    expect((await POST(req({ email: 'member@example.com', firstName: null, sku: 's0227' }))).status).toBe(200)
    expect(mockSend).toHaveBeenCalledWith({ email: 'member@example.com', firstName: null, sku: 'S0227' })
  })

  it('refuses a level that is not Novice', async () => {
    expect((await POST(req({ email: 'member@example.com', sku: 'S0216' }))).status).toBe(422)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('401 without the internal secret', async () => {
    expect((await POST(req({ email: 'member@example.com', sku: 'S0214' }, null))).status).toBe(401)
  })
})
