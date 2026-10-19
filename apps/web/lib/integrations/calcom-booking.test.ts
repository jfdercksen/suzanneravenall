// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { sendStaffAlert, logError, fake } = vi.hoisted(() => ({
  sendStaffAlert: vi.fn(),
  logError: vi.fn(),
  fake: { client: null as unknown },
}))
vi.mock('@/lib/integrations/staff-alert', () => ({ sendStaffAlert }))
vi.mock('@/lib/log', () => ({ logError }))
vi.mock('@/lib/integrations/vtiger', () => ({ getVtigerClient: () => fake.client }))

import { VtigerClient } from '@suzanne/integrations'
import { makeFakeVtiger } from '../../../../packages/integrations/src/test-utils'
import { runCalcomBookingSync } from './calcom-booking'

const BODY = {
  triggerEvent: 'BOOKING_CREATED',
  payload: {
    uid: 'bk_1',
    title: 'Discovery Call',
    startTime: '2026-10-20T09:00:00.000Z',
    endTime: '2026-10-20T09:30:00.000Z',
    attendees: [{ email: 'jane@example.com', name: 'Jane Smith' }],
  },
}

function useVtiger(opts: Parameters<typeof makeFakeVtiger>[0] = {}) {
  const v = makeFakeVtiger({ fields: { Contacts: ['cf_pipeline_stage'] }, ...opts })
  fake.client = new VtigerClient({ url: 'https://crm.test', username: 'u', accessKey: 'k', fetchImpl: v.fetchImpl, retries: 0, sleep: async () => {} })
  return v
}

const noWait = { sleep: async () => {} }

describe('runCalcomBookingSync', () => {
  beforeEach(() => {
    sendStaffAlert.mockReset().mockResolvedValue('sent')
    logError.mockReset()
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    delete process.env.AUTOMATION_CALCOM
    vi.restoreAllMocks()
  })

  it('writes the contact and Event and sends no alert', async () => {
    const v = useVtiger()
    const out = await runCalcomBookingSync(BODY, noWait)
    expect(out.status).toBe('synced')
    expect(v.created.map((c) => c.elementType)).toEqual(['Contacts', 'Events'])
    expect(sendStaffAlert).not.toHaveBeenCalled()
  })

  it('does nothing when AUTOMATION_CALCOM=off', async () => {
    const v = useVtiger()
    process.env.AUTOMATION_CALCOM = 'off'
    expect(await runCalcomBookingSync(BODY, noWait)).toEqual({ status: 'skipped', reason: 'off' })
    expect(v.calls).toHaveLength(0)
  })

  it('skips a booking without a UID', async () => {
    useVtiger()
    const body = { payload: { ...BODY.payload, uid: undefined } }
    expect(await runCalcomBookingSync(body, noWait)).toEqual({ status: 'skipped', reason: 'invalid-payload' })
  })

  it('after the last retry: Sentry via logError without the email, and one staff alert', async () => {
    const err = () => new Response(JSON.stringify({ success: false, error: { code: 'DATABASE_QUERY_ERROR', message: 'x' } }))
    useVtiger({ failures: { query: [err(), err(), err(), err()] } })
    expect(await runCalcomBookingSync(BODY, noWait)).toEqual({ status: 'failed' })
    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError.mock.calls[0]![2]).toEqual({ bookingUid: 'bk_1', automation: 'calcom' })
    expect(JSON.stringify(logError.mock.calls[0]![2])).not.toContain('jane@')
    expect(sendStaffAlert).toHaveBeenCalledTimes(1)
    const alert = sendStaffAlert.mock.calls[0]![0] as { key: string; lines: string[] }
    expect(alert.key).toBe('calcom-vtiger:bk_1')
    expect(alert.lines.join(' ')).toContain('bk_1')
    expect(alert.lines.join(' ')).not.toContain('jane@')
  })
})
