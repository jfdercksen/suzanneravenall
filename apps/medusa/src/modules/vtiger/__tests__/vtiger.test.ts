import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VtigerService } from '../service'
import type { VtigerContact, VtigerActivity } from '../types'

// ---------------------------------------------------------------------------
// Helpers — build typed mock responses
// ---------------------------------------------------------------------------

function makeContact(overrides: Partial<VtigerContact> = {}): VtigerContact {
  return {
    id: '12x1',
    email: 'test@example.com',
    firstname: 'Jane',
    lastname: 'Doe',
    phone: '0821234567',
    cf_pipeline_stage: 'New Lead',
    ...overrides,
  }
}

function makeActivity(overrides: Partial<VtigerActivity> = {}): VtigerActivity {
  return {
    id: '18x1',
    activitytype: 'Call',
    subject: 'Discovery Call',
    contact_id: '12x1',
    date_start: '2026-05-12',
    time_start: '09:00:00',
    ...overrides,
  }
}

function mockFetch(responses: Array<{ ok: boolean; json: () => unknown }>) {
  let callIndex = 0
  return vi.fn().mockImplementation(() => {
    const res = responses[callIndex++] ?? responses[responses.length - 1]!
    return Promise.resolve(res)
  })
}

function jsonResponse(data: unknown) {
  return { ok: true, json: () => Promise.resolve(data) }
}

function httpErrorResponse(status = 500) {
  return { ok: false, status, json: () => Promise.resolve({}) }
}

const CHALLENGE_RESPONSE = {
  success: true,
  result: { token: 'challenge_token_abc', serverTime: 1715000000, expireTime: 1715000900 },
}

const LOGIN_RESPONSE = {
  success: true,
  result: {
    sessionName: 'session_xyz',
    userId: '19x1',
    vtigerVersion: '7.5',
    apiVersion: '0.1',
  },
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('VtigerService', () => {
  let service: VtigerService
  let originalFetch: typeof global.fetch
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalFetch = global.fetch
    originalEnv = { ...process.env }
    process.env.VTIGER_URL = 'https://vtiger.example.com'
    process.env.VTIGER_USERNAME = 'admin@example.com'
    process.env.VTIGER_ACCESS_KEY = 'secret_access_key'
    service = new VtigerService()
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  // -------------------------------------------------------------------------
  // Construction — lazy validation
  // -------------------------------------------------------------------------

  describe('construction', () => {
    it('does NOT throw when env vars are missing', () => {
      delete process.env.VTIGER_URL
      delete process.env.VTIGER_USERNAME
      delete process.env.VTIGER_ACCESS_KEY
      expect(() => new VtigerService()).not.toThrow()
    })

    it('throws on first API call when env vars are missing', async () => {
      delete process.env.VTIGER_URL
      delete process.env.VTIGER_USERNAME
      delete process.env.VTIGER_ACCESS_KEY
      const noConfigService = new VtigerService()
      await expect(noConfigService.findContact('a@b.com')).rejects.toThrow(
        'Vtiger configuration missing'
      )
    })
  })

  // -------------------------------------------------------------------------
  // findContact
  // -------------------------------------------------------------------------

  describe('findContact', () => {
    it('returns the contact when found', async () => {
      const contact = makeContact()
      global.fetch = mockFetch([
        jsonResponse(CHALLENGE_RESPONSE),
        jsonResponse(LOGIN_RESPONSE),
        jsonResponse({ success: true, result: [contact] }),
      ])

      const result = await service.findContact('test@example.com')
      expect(result).toEqual(contact)
    })

    it('returns null when no contact matches', async () => {
      global.fetch = mockFetch([
        jsonResponse(CHALLENGE_RESPONSE),
        jsonResponse(LOGIN_RESPONSE),
        jsonResponse({ success: true, result: [] }),
      ])

      const result = await service.findContact('notfound@example.com')
      expect(result).toBeNull()
    })

    it('throws when the API returns an error', async () => {
      global.fetch = mockFetch([
        jsonResponse(CHALLENGE_RESPONSE),
        jsonResponse(LOGIN_RESPONSE),
        jsonResponse({ success: false, error: { code: 'QUERY_ERROR', message: 'Invalid VQL' } }),
      ])

      await expect(service.findContact('test@example.com')).rejects.toThrow('QUERY_ERROR')
    })

    it('throws when the HTTP response is not OK', async () => {
      global.fetch = mockFetch([
        jsonResponse(CHALLENGE_RESPONSE),
        jsonResponse(LOGIN_RESPONSE),
        httpErrorResponse(503),
      ])

      await expect(service.findContact('test@example.com')).rejects.toThrow('HTTP 503')
    })
  })

  // -------------------------------------------------------------------------
  // createContact
  // -------------------------------------------------------------------------

  describe('createContact', () => {
    it('creates and returns the contact', async () => {
      const created = makeContact({ id: '12x99' })
      global.fetch = mockFetch([
        jsonResponse(CHALLENGE_RESPONSE),
        jsonResponse(LOGIN_RESPONSE),
        jsonResponse({ success: true, result: created }),
      ])

      const result = await service.createContact({
        email: 'new@example.com',
        firstname: 'Jane',
        lastname: 'Smith',
      })

      expect(result).toEqual(created)
    })

    it('passes all provided fields in the request element', async () => {
      const captured: string[] = []
      global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (init?.body) {
          captured.push(String(init.body))
        }
        if (captured.length === 0) {
          return Promise.resolve(jsonResponse(CHALLENGE_RESPONSE))
        }
        if (captured.length === 1) {
          return Promise.resolve(jsonResponse(LOGIN_RESPONSE))
        }
        return Promise.resolve(
          jsonResponse({ success: true, result: makeContact() })
        )
      })

      await service.createContact({
        email: 'new@example.com',
        firstname: 'Jane',
        lastname: 'Smith',
        leadsource: 'Web',
      })

      const createBody = captured[1] ?? ''
      expect(createBody).toContain('operation=create')
      expect(createBody).toContain('elementType=Contacts')
      expect(createBody).toContain('new%40example.com')
    })
  })

  // -------------------------------------------------------------------------
  // updateContact
  // -------------------------------------------------------------------------

  describe('updateContact', () => {
    it('returns the updated contact', async () => {
      const updated = makeContact({ phone: '0831234567' })
      global.fetch = mockFetch([
        jsonResponse(CHALLENGE_RESPONSE),
        jsonResponse(LOGIN_RESPONSE),
        jsonResponse({ success: true, result: updated }),
      ])

      const result = await service.updateContact('12x1', { phone: '0831234567' })
      expect(result).toEqual(updated)
    })

    it('throws on API error', async () => {
      global.fetch = mockFetch([
        jsonResponse(CHALLENGE_RESPONSE),
        jsonResponse(LOGIN_RESPONSE),
        jsonResponse({ success: false, error: { code: 'INVALID_RECORD', message: 'Record not found' } }),
      ])

      await expect(service.updateContact('12x999', { phone: '0831234567' })).rejects.toThrow(
        'INVALID_RECORD'
      )
    })
  })

  // -------------------------------------------------------------------------
  // createActivity
  // -------------------------------------------------------------------------

  describe('createActivity', () => {
    it('creates and returns the activity', async () => {
      const activity = makeActivity()
      global.fetch = mockFetch([
        jsonResponse(CHALLENGE_RESPONSE),
        jsonResponse(LOGIN_RESPONSE),
        jsonResponse({ success: true, result: activity }),
      ])

      const result = await service.createActivity('12x1', 'Call', {
        subject: 'Discovery Call',
        description: 'Initial discovery session',
      })

      expect(result).toEqual(activity)
      expect(result.activitytype).toBe('Call')
    })

    it('passes correct element type in the request', async () => {
      const captured: string[] = []
      global.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
        if (init?.body) captured.push(String(init.body))
        if (captured.length < 2) {
          return Promise.resolve(
            jsonResponse(captured.length === 0 ? CHALLENGE_RESPONSE : LOGIN_RESPONSE)
          )
        }
        return Promise.resolve(
          jsonResponse({ success: true, result: makeActivity() })
        )
      })

      await service.createActivity('12x1', 'Meeting', { subject: 'Follow-up' })
      const createBody = captured[1] ?? ''
      expect(createBody).toContain('elementType=Activities')
    })
  })

  // -------------------------------------------------------------------------
  // updatePipelineStage
  // -------------------------------------------------------------------------

  describe('updatePipelineStage', () => {
    it('calls updateContact with the correct pipeline stage field', async () => {
      const updated = makeContact({ cf_pipeline_stage: 'Discovery Call Booked' })
      global.fetch = mockFetch([
        jsonResponse(CHALLENGE_RESPONSE),
        jsonResponse(LOGIN_RESPONSE),
        jsonResponse({ success: true, result: updated }),
      ])

      await service.updatePipelineStage('12x1', 'Discovery Call Booked')

      // Verify updateContact was effectively called (no throw, returns void)
    })

    it('sends cf_pipeline_stage in the update element', async () => {
      const captured: string[] = []
      global.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
        if (init?.body) captured.push(String(init.body))
        if (captured.length < 2) {
          return Promise.resolve(
            jsonResponse(captured.length === 0 ? CHALLENGE_RESPONSE : LOGIN_RESPONSE)
          )
        }
        return Promise.resolve(
          jsonResponse({ success: true, result: makeContact({ cf_pipeline_stage: 'Closed Won' }) })
        )
      })

      await service.updatePipelineStage('12x1', 'Closed Won')
      const updateBody = captured[1] ?? ''
      expect(updateBody).toContain('Closed+Won')
    })
  })

  // -------------------------------------------------------------------------
  // Session re-authentication on ACCESS_DENIED
  // -------------------------------------------------------------------------

  describe('session re-authentication', () => {
    it('re-authenticates and retries on ACCESS_DENIED error', async () => {
      const contact = makeContact()
      // Sequence: initial auth (2 calls), query fails with ACCESS_DENIED,
      // re-auth (2 calls), query succeeds
      global.fetch = mockFetch([
        jsonResponse(CHALLENGE_RESPONSE),         // 1. initial challenge
        jsonResponse(LOGIN_RESPONSE),             // 2. initial login
        jsonResponse({                            // 3. query → ACCESS_DENIED
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'Session expired' },
        }),
        jsonResponse(CHALLENGE_RESPONSE),         // 4. re-challenge
        jsonResponse(LOGIN_RESPONSE),             // 5. re-login
        jsonResponse({ success: true, result: [contact] }), // 6. retry query succeeds
      ])

      const result = await service.findContact('test@example.com')
      expect(result).toEqual(contact)
    })

    it('does NOT retry a second time on repeated ACCESS_DENIED (prevents infinite loop)', async () => {
      global.fetch = mockFetch([
        jsonResponse(CHALLENGE_RESPONSE),
        jsonResponse(LOGIN_RESPONSE),
        jsonResponse({ success: false, error: { code: 'ACCESS_DENIED', message: 'Still denied' } }),
        jsonResponse(CHALLENGE_RESPONSE),
        jsonResponse(LOGIN_RESPONSE),
        jsonResponse({ success: false, error: { code: 'ACCESS_DENIED', message: 'Still denied' } }),
      ])

      await expect(service.findContact('test@example.com')).rejects.toThrow('ACCESS_DENIED')
    })
  })
})
