import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/log', () => ({ logError: vi.fn(), logWarn: vi.fn() }))
vi.mock('@react-pdf/renderer', () => ({ renderToBuffer: vi.fn(async () => Buffer.from('pdf')) }))
vi.mock('@/components/invoice/InvoiceDocument', () => ({ default: () => null }))
vi.mock('@/lib/medusa/admin-auth', () => ({ medusaAdminAuthHeader: () => 'Bearer t' }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    storage: {
      createBucket: async () => ({ error: null }),
      from: () => ({ upload: async () => ({ error: null }), createSignedUrl: async () => ({ data: { signedUrl: 'https://s/signed' }, error: null }) }),
    },
  }),
}))

import { POST } from './route'

const order = (metadata: Record<string, unknown>) => ({
  id: 'order_1', display_id: 7, created_at: '2026-11-26T08:00:00Z', currency_code: 'zar', status: 'completed',
  items: [], subtotal: 0, tax_total: 0, total: 0, metadata,
})

describe('POST /api/invoices/generate metadata write', () => {
  let writes: Array<Record<string, unknown>>
  beforeEach(() => {
    writes = []
    vi.stubEnv('N8N_WEBHOOK_SECRET', 's')
    vi.stubEnv('MEDUSA_API_TOKEN', 't')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://sb')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'k')
    let reads = 0
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        writes.push(JSON.parse(String(init.body)).metadata)
        return new Response('{}', { status: 200 })
      }
      reads += 1
      // First read (step 1): stale. Later read (before the write): the Sage job has written its keys.
      return new Response(JSON.stringify({ order: order(reads === 1 ? { payfast_payment_id: 'pf1' } : { payfast_payment_id: 'pf1', sage_invoice_id: '9', sage_document_number: 'INV9', sage_synced_at: 'x' }) }), { status: 200 })
    }))
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('merges only its own keys onto freshly read metadata, keeping the Sage keys written meanwhile', async () => {
    const res = await POST(new Request('http://x/api/invoices/generate', { method: 'POST', headers: { 'x-webhook-secret': 's' }, body: JSON.stringify({ orderId: 'order_1' }) }) as never)
    expect(res.status).toBe(200)
    expect(writes).toHaveLength(1)
    expect(writes[0]).toMatchObject({ payfast_payment_id: 'pf1', sage_invoice_id: '9', sage_document_number: 'INV9', sage_synced_at: 'x', invoice_path: 'order_1.pdf', invoice_url: 'https://s/signed' })
  })
})
