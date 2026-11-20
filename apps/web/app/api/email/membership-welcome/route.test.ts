import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))
vi.mock('@/lib/email/membership-welcome', async (orig) => ({
  ...(await orig<typeof import('@/lib/email/membership-welcome')>()),
  sendMembershipWelcomeEmail: mockSend,
}))
vi.mock('@/lib/log', () => ({ logError: vi.fn() }))

import { POST } from './route'

function req(body: unknown, secret: string | null = 'internal') {
  return new Request('http://localhost/api/email/membership-welcome', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(secret ? { 'x-webhook-secret': secret } : {}) },
    body: JSON.stringify(body),
  }) as never
}

const valid = { email: 'member@example.com', firstName: 'Thandi', sku: 'S0229', renewalDate: '2027-11-20T10:00:00.000Z' }

describe('POST /api/email/membership-welcome (KI128)', () => {
  beforeEach(() => {
    mockSend.mockReset()
    vi.stubEnv('INTERNAL_WEBHOOK_SECRET', 'internal')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://suzanneravenall.com')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('sends the welcome with the level, its programme and the end of the year', async () => {
    mockSend.mockResolvedValue('msg_1')
    const res = await POST(req(valid))
    expect(res.status).toBe(200)
    expect(mockSend).toHaveBeenCalledWith({
      email: 'member@example.com',
      firstName: 'Thandi',
      levelTitle: 'Energy Alignment & Optimisation Practitioner (Prdip) - Basic Membership',
      programmeName: 'Energy Alignment & Optimisation',
      renewalDate: '20 November 2027',
      siteUrl: 'https://suzanneravenall.com',
    })
  })

  it('names no programme for Lifestyle', async () => {
    mockSend.mockResolvedValue('msg_1')
    await POST(req({ ...valid, sku: 'S0212' }))
    expect(mockSend.mock.calls[0]?.[0]).toMatchObject({ levelTitle: 'Lifestyle Membership', programmeName: null })
  })

  it('refuses Guest, a Novice (welcomed on approval instead) and an unknown level', async () => {
    for (const sku of ['S0211', 'S0214', 'S0999']) expect((await POST(req({ ...valid, sku }))).status).toBe(422)
    expect((await POST(req({ ...valid, sku: 'silver' }))).status).toBe(422)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('401 without the internal secret', async () => {
    expect((await POST(req(valid, 'nope'))).status).toBe(401)
    expect(mockSend).not.toHaveBeenCalled()
  })
})
