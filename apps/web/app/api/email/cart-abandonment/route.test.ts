import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted so the mock fns exist before vi.mock factories run
const { mockSend1, mockSend2, mockSend3 } = vi.hoisted(() => ({
  mockSend1: vi.fn(),
  mockSend2: vi.fn(),
  mockSend3: vi.fn(),
}))

vi.mock('@/lib/email/cart-abandonment-1', () => ({
  sendCartAbandonmentEmail1: mockSend1,
}))
vi.mock('@/lib/email/cart-abandonment-2', () => ({
  sendCartAbandonmentEmail2: mockSend2,
}))
vi.mock('@/lib/email/cart-abandonment-3', () => ({
  sendCartAbandonmentEmail3: mockSend3,
}))

import { POST } from './route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_SECRET = 'test-webhook-secret'

// makeRequest includes the correct secret header by default so most tests
// reach the validation logic. Override headers to test auth failure cases.
function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/email/cart-abandonment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': TEST_SECRET,
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

const validBody = {
  template: 1,
  cartId: 'cart_abc',
  email: 'test@example.com',
  firstName: 'Alice',
  items: [{ id: 'p1', title: 'Coaching', quantity: 1, unit_price: 9900 }],
  total: 9900,
  currency: 'ZAR',
  cartUrl: 'https://suzanneravenall.com/checkout?cart=cart_abc',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/email/cart-abandonment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('N8N_WEBHOOK_SECRET', TEST_SECRET)
    vi.stubEnv('RESEND_API_KEY', 'test_resend_key')
  })

  // -------------------------------------------------------------------------
  // Auth checks
  // -------------------------------------------------------------------------

  describe('authentication', () => {
    it('returns 401 when secret header is missing', async () => {
      mockSend1.mockResolvedValue('email_id_001')

      // Override to omit the secret header entirely (empty string = falsy in route)
      const res = await POST(makeRequest(validBody, { 'x-webhook-secret': '' }) as any)

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe('Unauthorized')
    })

    it('returns 401 when secret header is wrong', async () => {
      mockSend1.mockResolvedValue('email_id_001')

      const res = await POST(
        makeRequest(validBody, { 'x-webhook-secret': 'wrong-secret' }) as any,
      )

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe('Unauthorized')
    })

    it('returns 200 when correct secret header is provided', async () => {
      mockSend1.mockResolvedValue('email_id_correct')

      const res = await POST(makeRequest(validBody) as any)

      expect(res.status).toBe(200)
    })

    it('returns 500 when N8N_WEBHOOK_SECRET is not set', async () => {
      vi.stubEnv('N8N_WEBHOOK_SECRET', '')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const res = await POST(makeRequest(validBody) as any)

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Server configuration error')
      consoleSpy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // Input validation
  // -------------------------------------------------------------------------

  describe('input validation', () => {
    it('returns 400 when template is not 1, 2, or 3', async () => {
      const res = await POST(makeRequest({ ...validBody, template: 4 }) as any)

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/template must be 1, 2, or 3/)
    })

    it('returns 400 when template is a string instead of number', async () => {
      const res = await POST(makeRequest({ ...validBody, template: '1' }) as any)

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/template must be 1, 2, or 3/)
    })

    it('returns 400 when template is missing', async () => {
      const { template: _t, ...bodyWithoutTemplate } = validBody
      const res = await POST(makeRequest(bodyWithoutTemplate) as any)

      expect(res.status).toBe(400)
    })

    it('returns 400 when cartId is missing', async () => {
      const { cartId: _c, ...bodyWithoutCartId } = validBody
      const res = await POST(makeRequest(bodyWithoutCartId) as any)

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/cartId is required/)
    })

    it('returns 400 when cartId is a number instead of string', async () => {
      const res = await POST(makeRequest({ ...validBody, cartId: 123 }) as any)

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/cartId is required/)
    })

    it('returns 400 when email is missing', async () => {
      const { email: _e, ...bodyWithoutEmail } = validBody
      const res = await POST(makeRequest(bodyWithoutEmail) as any)

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/email is required/)
    })

    it('returns 400 when email is not a string', async () => {
      const res = await POST(makeRequest({ ...validBody, email: 42 }) as any)

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/email is required/)
    })

    it('returns 400 when items is not an array', async () => {
      const res = await POST(makeRequest({ ...validBody, items: 'not-an-array' }) as any)

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/items must be an array/)
    })

    it('returns 400 when items is an object instead of array', async () => {
      const res = await POST(makeRequest({ ...validBody, items: { item: 1 } }) as any)

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/items must be an array/)
    })

    it('returns 400 when body is invalid JSON', async () => {
      const req = new Request('http://localhost/api/email/cart-abandonment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': TEST_SECRET,
        },
        body: '{not valid json',
      })

      const res = await POST(req as any)

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/Invalid JSON/)
    })
  })

  // -------------------------------------------------------------------------
  // Template dispatch
  // -------------------------------------------------------------------------

  describe('template dispatch', () => {
    it('returns 200 with emailId when template=1 and all fields valid', async () => {
      mockSend1.mockResolvedValue('email_t1_001')

      const res = await POST(makeRequest({ ...validBody, template: 1 }) as any)

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.emailId).toBe('email_t1_001')
      expect(mockSend1).toHaveBeenCalledTimes(1)
      expect(mockSend2).not.toHaveBeenCalled()
      expect(mockSend3).not.toHaveBeenCalled()
    })

    it('returns 200 with emailId when template=2', async () => {
      mockSend2.mockResolvedValue('email_t2_001')

      const res = await POST(makeRequest({ ...validBody, template: 2 }) as any)

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.emailId).toBe('email_t2_001')
      expect(mockSend2).toHaveBeenCalledTimes(1)
      expect(mockSend1).not.toHaveBeenCalled()
      expect(mockSend3).not.toHaveBeenCalled()
    })

    it('returns 200 with emailId when template=3', async () => {
      mockSend3.mockResolvedValue('email_t3_001')

      const res = await POST(makeRequest({ ...validBody, template: 3 }) as any)

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.emailId).toBe('email_t3_001')
      expect(mockSend3).toHaveBeenCalledTimes(1)
      expect(mockSend1).not.toHaveBeenCalled()
      expect(mockSend2).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Data forwarding
  // -------------------------------------------------------------------------

  describe('data forwarding', () => {
    it('passes correct CartEmailData shape to the send function', async () => {
      mockSend1.mockResolvedValue('email_data_001')

      await POST(makeRequest(validBody) as any)

      expect(mockSend1).toHaveBeenCalledWith({
        cartId: 'cart_abc',
        email: 'test@example.com',
        firstName: 'Alice',
        items: [{ id: 'p1', title: 'Coaching', quantity: 1, unit_price: 9900 }],
        total: 9900,
        currency: 'ZAR',
        cartUrl: 'https://suzanneravenall.com/checkout?cart=cart_abc',
      })
    })

    it('defaults total to 0 when total is not a number', async () => {
      mockSend1.mockResolvedValue('email_data_002')

      await POST(makeRequest({ ...validBody, total: 'unknown' }) as any)

      expect(mockSend1).toHaveBeenCalledWith(expect.objectContaining({ total: 0 }))
    })

    it('defaults currency to ZAR when currency is not a string', async () => {
      mockSend1.mockResolvedValue('email_data_003')

      await POST(makeRequest({ ...validBody, currency: 99 }) as any)

      expect(mockSend1).toHaveBeenCalledWith(expect.objectContaining({ currency: 'ZAR' }))
    })

    it('defaults cartUrl to empty string when cartUrl is not a string', async () => {
      mockSend1.mockResolvedValue('email_data_004')

      await POST(makeRequest({ ...validBody, cartUrl: null }) as any)

      expect(mockSend1).toHaveBeenCalledWith(expect.objectContaining({ cartUrl: '' }))
    })

    it('sets firstName to undefined when firstName is not a string', async () => {
      mockSend1.mockResolvedValue('email_data_005')

      await POST(makeRequest({ ...validBody, firstName: 42 }) as any)

      expect(mockSend1).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: undefined }),
      )
    })

    it('accepts an empty items array', async () => {
      mockSend1.mockResolvedValue('email_data_006')

      const res = await POST(makeRequest({ ...validBody, items: [] }) as any)

      expect(res.status).toBe(200)
      expect(mockSend1).toHaveBeenCalledWith(expect.objectContaining({ items: [] }))
    })

    it('strips invalid item entries and passes only valid ones', async () => {
      mockSend1.mockResolvedValue('email_data_007')

      const mixedItems = [
        { id: 'p1', title: 'Valid', quantity: 1, unit_price: 500 },
        { id: 'p2', title: 'Missing unit_price', quantity: 1 },
        'not an object',
        null,
      ]

      await POST(makeRequest({ ...validBody, items: mixedItems }) as any)

      expect(mockSend1).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ id: 'p1', title: 'Valid', quantity: 1, unit_price: 500, variant_title: undefined, thumbnail: undefined }],
        }),
      )
    })
  })

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe('error handling', () => {
    it('returns 500 when the send function throws', async () => {
      mockSend1.mockRejectedValue(new Error('Resend error: rate limited'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const res = await POST(makeRequest(validBody) as any)

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to send email')
      consoleSpy.mockRestore()
    })

    it('returns 500 when send function throws a non-Error value', async () => {
      mockSend2.mockRejectedValue('string error')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const res = await POST(makeRequest({ ...validBody, template: 2 }) as any)

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to send email')
      consoleSpy.mockRestore()
    })

    it('returns 500 when RESEND_API_KEY is not set', async () => {
      vi.stubEnv('RESEND_API_KEY', '')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const res = await POST(makeRequest(validBody) as any)

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Server configuration error')
      consoleSpy.mockRestore()
    })
  })
})
