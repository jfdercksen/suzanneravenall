import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  access: vi.fn(),
  get: vi.fn(),
  decide: vi.fn(),
  logEvent: vi.fn(async (_admin: unknown, _event: unknown) => true),
  welcome: vi.fn(async (_input: unknown) => 'msg'),
  changes: vi.fn(async (_input: unknown) => 'msg'),
}))
vi.mock('@/lib/staff/current', () => ({ currentStaffAccess: h.access }))
vi.mock('@/lib/quiz/subscriber', () => ({ getServiceRoleClient: () => ({}) }))
vi.mock('@/lib/novice/applications', async (orig) => ({
  ...(await orig<typeof import('@/lib/novice/applications')>()),
  staffApplication: h.get,
  decideApplication: h.decide,
  logEvent: h.logEvent,
}))
vi.mock('@/lib/email/membership-welcome', async (orig) => ({
  ...(await orig<typeof import('@/lib/email/membership-welcome')>()),
  sendMembershipWelcomeEmail: h.welcome,
}))
vi.mock('@/lib/email/novice', () => ({ sendNoviceChangesRequestedEmail: h.changes }))
vi.mock('@/lib/log', () => ({ logError: vi.fn() }))

import { POST } from './route'

const ID = '7f0c2d7e-1d5b-4c55-9a3c-2d7f3f0a9b11'
const viewer = { id: '3', email: 'team@example.com', name: 'Team', role: 'staff' }
const app = { id: ID, email: 'member@example.com', first_name: 'Thandi', sku: 'S0214', status: 'submitted', user_id: 'u1', files: [] }

function req(fields: Record<string, string>, origin: string | null = 'http://localhost') {
  const body = new URLSearchParams(fields)
  return new Request(`http://localhost/api/staff/novice/${ID}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(origin ? { origin } : {}) },
    body,
  })
}
const ctx = { params: Promise.resolve({ id: ID }) }

describe('POST /api/staff/novice/<id>/decision', () => {
  beforeEach(() => {
    for (const fn of Object.values(h)) fn.mockClear()
    h.access.mockResolvedValue({ status: 'allowed', viewer })
    h.get.mockResolvedValue(app)
  })

  it('refuses a post from another site', async () => {
    expect((await POST(req({ decision: 'approve' }, 'https://evil.example'), ctx)).status).toBe(403)
    expect((await POST(req({ decision: 'approve' }, null), ctx)).status).toBe(403)
    expect(h.decide).not.toHaveBeenCalled()
  })

  it('behind the review box nginx: accepts the public site Origin although Next sees an internal URL, still refuses null and other sites (KI138)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://169.239.180.49')
    h.decide.mockResolvedValue({ ok: false, reason: 'not-submitted' })
    const proxied = (origin: string) =>
      new Request(`http://0.0.0.0:3000/api/staff/novice/${ID}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', origin },
        body: new URLSearchParams({ decision: 'approve' }),
      })
    const res = await POST(proxied('http://169.239.180.49'), ctx)
    expect(res.status).toBe(303)
    // Back to the public page, never the internal bind address (KI139).
    expect(res.headers.get('location')).toBe(`http://169.239.180.49/staff/novice/${ID}?done=not-submitted`)
    expect(h.decide).toHaveBeenCalledTimes(1)
    // What a browser sends on a form post from a no-referrer page (the KI138 cause): refused.
    expect((await POST(proxied('null'), ctx)).status).toBe(403)
    expect((await POST(proxied('http://169.239.180.49.evil.example'), ctx)).status).toBe(403)
    expect((await POST(proxied('https://169.239.180.49'), ctx)).status).toBe(403)
    expect(h.decide).toHaveBeenCalledTimes(1)
    vi.unstubAllEnvs()
  })

  it('refuses anyone without the Staff role', async () => {
    h.access.mockResolvedValue({ status: 'forbidden', viewer: { ...viewer, role: 'editor' } })
    expect((await POST(req({ decision: 'approve' }), ctx)).status).toBe(401)
    expect(h.decide).not.toHaveBeenCalled()
  })

  it('approves, logs who did it and sends the welcome email', async () => {
    h.decide.mockResolvedValue({ ok: true, status: 'approved', endDate: '2027-11-21T10:00:00.000Z' })
    const res = await POST(req({ decision: 'approve', note: '' }), ctx)
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toContain(`/staff/novice/${ID}?done=approved`)
    expect(h.decide).toHaveBeenCalledWith(expect.anything(), app, 'approve', '', 'team@example.com')
    expect(h.logEvent.mock.calls[0]?.[1]).toMatchObject({ actor_type: 'staff', actor_id: '3', action: 'approved' })
    expect(h.welcome.mock.calls[0]?.[0]).toMatchObject({ email: 'member@example.com', levelTitle: 'Akashic Novice Practitioner - Basic Membership', programmeName: 'Akashic Navigation', renewalDate: '21 November 2027' })
  })

  it('asks for more with the note and emails the member', async () => {
    h.decide.mockResolvedValue({ ok: true, status: 'changes_requested' })
    const res = await POST(req({ decision: 'changes', note: 'Add your Session Log.' }), ctx)
    expect(res.headers.get('location')).toContain('done=changes_requested')
    expect(h.changes).toHaveBeenCalledWith({ email: 'member@example.com', firstName: 'Thandi', sku: 'S0214', note: 'Add your Session Log.' })
    expect(h.welcome).not.toHaveBeenCalled()
  })

  it('sends nobody an email when the decision did not go through', async () => {
    h.decide.mockResolvedValue({ ok: false, reason: 'not-submitted' })
    const res = await POST(req({ decision: 'approve' }), ctx)
    expect(res.headers.get('location')).toContain('done=not-submitted')
    expect(h.welcome).not.toHaveBeenCalled()
    expect(h.logEvent).not.toHaveBeenCalled()
  })

  it('422 on an unknown decision', async () => {
    expect((await POST(req({ decision: 'delete' }), ctx)).status).toBe(422)
  })
})
