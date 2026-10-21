// @vitest-environment node
import crypto from 'crypto'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { afterCallbacks, runCalcomBookingSync, runSessionBookingRecord, logError } = vi.hoisted(() => ({
  afterCallbacks: [] as Array<() => unknown>,
  runCalcomBookingSync: vi.fn(),
  runSessionBookingRecord: vi.fn(),
  logError: vi.fn(),
}))

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return { ...actual, after: (cb: () => unknown) => afterCallbacks.push(cb) }
})
vi.mock('@/lib/integrations/calcom-booking', () => ({ runCalcomBookingSync }))
vi.mock('@/lib/portal/session-bookings', () => ({
  BOOKING_TRIGGERS: ['BOOKING_CREATED', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED'],
  runSessionBookingRecord,
}))
vi.mock('@/lib/log', () => ({ logError }))

import { NextRequest } from 'next/server'
import { POST } from './route'

const SECRET = 'test-calcom-secret'

function sign(body: string, secret = SECRET): string {
  return `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`
}

function request(body: string, signature: string | null = sign(body)): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (signature !== null) headers['X-Cal-Signature-256'] = signature
  return new NextRequest('http://localhost/api/webhooks/calcom', { method: 'POST', headers, body })
}

const V1 = {
  triggerEvent: 'BOOKING_CREATED',
  payload: {
    uid: 'bk_v1',
    title: 'Discovery Call',
    startTime: '2026-10-20T09:00:00.000Z',
    endTime: '2026-10-20T09:30:00.000Z',
    attendees: [{ email: 'jane@example.com', name: 'Jane Smith' }],
  },
}
const V2 = {
  triggerEvent: 'BOOKING_CREATED',
  payload: {
    bookingUid: 'bk_v2',
    eventTitle: 'Discovery Call',
    start: '2026-10-21T13:30:00.000Z',
    end: '2026-10-21T14:00:00.000Z',
    bookerEmail: 'sam@example.com',
    bookerName: 'Sam',
  },
}

describe('POST /api/webhooks/calcom', () => {
  const fetchSpy = vi.fn()

  beforeEach(() => {
    process.env.CALCOM_WEBHOOK_SECRET = SECRET
    afterCallbacks.length = 0
    runCalcomBookingSync.mockReset().mockResolvedValue({ status: 'synced' })
    runSessionBookingRecord.mockReset().mockResolvedValue('created')
    logError.mockReset()
    vi.stubGlobal('fetch', fetchSpy)
  })
  afterEach(() => {
    delete process.env.CALCOM_WEBHOOK_SECRET
    vi.unstubAllGlobals()
  })

  it('answers 200 at once and schedules the Vtiger sync after the response (v1 payload)', async () => {
    const body = JSON.stringify(V1)
    const res = await POST(request(body))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(runCalcomBookingSync).not.toHaveBeenCalled()
    expect(runSessionBookingRecord).not.toHaveBeenCalled()
    expect(afterCallbacks).toHaveLength(2)
    await Promise.all(afterCallbacks.map((cb) => cb()))
    expect(runCalcomBookingSync).toHaveBeenCalledWith(V1)
    expect(runSessionBookingRecord).toHaveBeenCalledWith(V1)
  })

  it('passes the v2 payload shape through to the sync', async () => {
    const body = JSON.stringify(V2)
    expect((await POST(request(body))).status).toBe(200)
    await afterCallbacks[0]!()
    expect(runCalcomBookingSync).toHaveBeenCalledWith(V2)
  })

  it('never calls n8n', async () => {
    await POST(request(JSON.stringify(V1)))
    await afterCallbacks[0]!()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it.each(['BOOKING_RESCHEDULED', 'BOOKING_CANCELLED'])(
    'stores %s for the appointments page but does not send it to Vtiger',
    async (triggerEvent) => {
      const payload = { ...V1, triggerEvent }
      expect((await POST(request(JSON.stringify(payload)))).status).toBe(200)
      expect(afterCallbacks).toHaveLength(1)
      await afterCallbacks[0]!()
      expect(runSessionBookingRecord).toHaveBeenCalledWith(payload)
      expect(runCalcomBookingSync).not.toHaveBeenCalled()
    },
  )

  it('ignores other trigger events', async () => {
    const body = JSON.stringify({ ...V1, triggerEvent: 'MEETING_ENDED' })
    expect((await POST(request(body))).status).toBe(200)
    expect(afterCallbacks).toHaveLength(0)
  })

  it('returns 401 without a signature header', async () => {
    const res = await POST(request(JSON.stringify(V1), null))
    expect(res.status).toBe(401)
    expect(afterCallbacks).toHaveLength(0)
  })

  it('returns 401 on a wrong signature', async () => {
    const body = JSON.stringify(V1)
    expect((await POST(request(body, sign(body, 'other-secret')))).status).toBe(401)
    expect((await POST(request(body, 'sha256=zz'))).status).toBe(401)
    expect(afterCallbacks).toHaveLength(0)
  })

  it('accepts a signature without the sha256= prefix', async () => {
    const body = JSON.stringify(V1)
    expect((await POST(request(body, sign(body).slice(7)))).status).toBe(200)
  })

  it('returns 500 when the secret is not configured', async () => {
    delete process.env.CALCOM_WEBHOOK_SECRET
    expect((await POST(request(JSON.stringify(V1)))).status).toBe(500)
    expect(afterCallbacks).toHaveLength(0)
  })

  it('returns 400 on a signed body that is not JSON or not a Cal.com payload', async () => {
    expect((await POST(request('not json'))).status).toBe(400)
    expect((await POST(request(JSON.stringify({ nope: true })))).status).toBe(400)
  })
})
