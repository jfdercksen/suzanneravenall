import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ ctx: vi.fn(), submit: vi.fn(), logEvent: vi.fn(async (_admin: unknown, _event: unknown) => true), team: vi.fn(async (_input: unknown) => 'msg') }))
vi.mock('@/lib/novice/member-request', () => ({ memberContext: h.ctx }))
vi.mock('@/lib/novice/applications', () => ({ submitApplication: h.submit, logEvent: h.logEvent }))
vi.mock('@/lib/email/novice', () => ({ sendNoviceSubmittedTeamEmail: h.team }))
vi.mock('@/lib/log', () => ({ logError: vi.fn() }))

import { NextResponse } from 'next/server'
import { POST } from './route'

const ID = '7f0c2d7e-1d5b-4c55-9a3c-2d7f3f0a9b11'
const req = (body: unknown) => new Request('http://localhost/api/portal/novice/submit', { method: 'POST', body: JSON.stringify(body) })
const app = { id: ID, email: 'member@example.com', first_name: 'Thandi', sku: 'S0227', files: [{ name: 'a.pdf' }] }

describe('POST /api/portal/novice/submit', () => {
  beforeEach(() => {
    for (const fn of Object.values(h)) fn.mockClear()
  })

  it('passes on the sign-in or ownership refusal', async () => {
    h.ctx.mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) })
    expect((await POST(req({ applicationId: ID }))).status).toBe(401)
    expect(h.submit).not.toHaveBeenCalled()
  })

  it('sends the application, logs it and tells the team', async () => {
    h.ctx.mockResolvedValue({ ok: true, user: { id: 'u1', email: 'member@example.com' }, admin: {}, app })
    h.submit.mockResolvedValue({ ok: true })
    expect((await POST(req({ applicationId: ID }))).status).toBe(200)
    expect(h.logEvent.mock.calls[0]?.[1]).toMatchObject({ actor_type: 'member', actor_id: 'u1', action: 'submitted' })
    expect(h.team).toHaveBeenCalledWith({ id: ID, memberName: 'Thandi', memberEmail: 'member@example.com', sku: 'S0227', fileCount: 1 })
  })

  it('409 when there is nothing to send or it is already with the team', async () => {
    h.ctx.mockResolvedValue({ ok: true, user: { id: 'u1' }, admin: {}, app })
    h.submit.mockResolvedValue({ ok: false, reason: 'no-files' })
    expect((await POST(req({ applicationId: ID }))).status).toBe(409)
    expect(h.team).not.toHaveBeenCalled()
  })

  it('422 on a bad id', async () => {
    expect((await POST(req({ applicationId: 'x' }))).status).toBe(422)
  })
})
