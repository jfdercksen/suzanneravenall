import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * In-person sessions are arranged by the team, never self-booked (27 Nov
 * 2026). Per session line: all in-person means no booking link; mixed keeps
 * the link from the first ONLINE line; both tell the mail to say the team
 * arranges the in-person part, and the team gets one notice.
 */

const { staffAlertSend } = vi.hoisted(() => ({
  staffAlertSend: vi.fn(async (_alert: { key: string; subject: string; lines: string[] }) => 'sent' as const),
}))

vi.mock('@medusajs/framework/utils', () => ({ ContainerRegistrationKeys: { QUERY: 'query' } }))
vi.mock('../../modules/memberships', () => ({ MEMBERSHIPS_MODULE: 'membershipsModule' }))
vi.mock('../../modules/memberships/service', () => ({ default: class {} }))
vi.mock('../../automations/runtime', () => ({
  getAutomationQueue: vi.fn(),
  staffAlerter: () => ({ send: staffAlertSend, reset: () => undefined }),
  createDryRunQueue: vi.fn(),
}))

const privateSessions = [{ handle: 'private-sessions' }]
const line = (variant: string, title = 'Rapid Repatterning Session', quantity = 1) => ({
  title,
  quantity,
  variant: { title: variant, product: { handle: 'rapid-repatterning-session', title, categories: privateSessions } },
})

function orderWith(items: unknown[]) {
  return {
    id: 'order_01IP',
    display_id: 42,
    created_at: '2026-11-27T08:30:00.000Z',
    customer_id: 'cus_1',
    email: 'client@example.com',
    customer: { email: 'client@example.com', first_name: 'Thandi', last_name: 'Nkosi' },
    billing_address: { first_name: 'Thandi', last_name: 'Nkosi', phone: '+27821234567' },
    items,
  }
}

let fetchMock: ReturnType<typeof vi.fn>
let notice: { ok: boolean; throws: boolean }

async function place(items: unknown[]) {
  vi.resetModules()
  const mod = (await import('../order-placed.js')) as unknown as { default: (args: unknown) => Promise<void> }
  const container = {
    resolve: (key: string) => {
      if (key === 'query') return { graph: vi.fn(async () => ({ data: [structuredClone(orderWith(items))] })) }
      if (key === 'order') return { listOrders: vi.fn(async () => []) }
      throw new Error(`unexpected resolve ${key}`)
    },
  }
  await mod.default({ event: { data: { id: 'order_01IP' } }, container })
  await new Promise((r) => setTimeout(r, 20))
}

function bodyOf(path: string): Record<string, unknown> | null {
  const call = fetchMock.mock.calls.find((c) => String(c[0]).endsWith(path))
  return call ? (JSON.parse(String((call[1] as RequestInit).body)) as Record<string, unknown>) : null
}

const noticeCalls = () => fetchMock.mock.calls.filter((c) => String(c[0]).endsWith('/api/email/in-person-session'))

beforeEach(() => {
  vi.clearAllMocks()
  notice = { ok: true, throws: false }
  fetchMock = vi.fn(async (url: unknown) => {
    if (String(url).endsWith('/api/email/in-person-session')) {
      if (notice.throws) throw new Error('web down')
      return new Response('{}', { status: notice.ok ? 200 : 500 })
    }
    return new Response(JSON.stringify({}), { status: 200 })
  })
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('N8N_WEBHOOK_URL', 'http://n8n:5678')
  vi.stubEnv('N8N_WEBHOOK_SECRET', 'secret')
  vi.stubEnv('WEB_BASE_URL', 'http://web:3000')
  vi.stubEnv('CALCOM_SESSION_BOOKING_URL', 'http://cal.test/suzanneravenall')
  vi.stubEnv('VIBE_MARKETING_WEBHOOK_URL', '')
  vi.stubEnv('SUPABASE_URL', '')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('order-placed in-person sessions', () => {
  it('all in-person: no booking url, inPersonArranged true, one team notice', async () => {
    await place([line('90 min in-person')])
    const confirmation = bodyOf('/api/email/order-confirmation')!
    expect(confirmation.calBookingUrl).toBeNull()
    expect(confirmation.inPersonArranged).toBe(true)
    expect(noticeCalls()).toHaveLength(1)
    const sent = noticeCalls()[0]![1] as RequestInit
    expect((sent.headers as Record<string, string>)['x-webhook-secret']).toBe('secret')
    expect(JSON.parse(String(sent.body))).toMatchObject({
      orderId: 'order_01IP',
      displayId: 42,
      reference: 'SR-00042',
      customerName: 'Thandi Nkosi',
      email: 'client@example.com',
      phone: '+27821234567',
      orderDate: '2026-11-27T08:30:00.000Z',
      lines: [{ product: 'Rapid Repatterning Session', variant: '90 min in-person', quantity: 1 }],
    })
  })

  it('mixed: the link comes from the first online line, inPersonArranged true, notice lists only in-person lines', async () => {
    await place([line('90 min in-person'), line('45 min online', 'Alpha Mind')])
    const confirmation = bodyOf('/api/email/order-confirmation')!
    expect(String(confirmation.calBookingUrl)).toContain('/session-45')
    expect(confirmation.inPersonArranged).toBe(true)
    expect(noticeCalls()).toHaveLength(1)
    const lines = (JSON.parse(String((noticeCalls()[0]![1] as RequestInit).body)) as { lines: { variant: string }[] }).lines
    expect(lines.map((l) => l.variant)).toEqual(['90 min in-person'])
  })

  it('online: unchanged link, no flag, no notice', async () => {
    await place([line('60 min online')])
    const confirmation = bodyOf('/api/email/order-confirmation')!
    expect(String(confirmation.calBookingUrl)).toContain('/session-60')
    expect(confirmation).not.toHaveProperty('inPersonArranged')
    expect(noticeCalls()).toHaveLength(0)
  })

  it('a refused notice raises a staff alert and the order still goes through', async () => {
    notice = { ok: false, throws: false }
    await place([line('90 min in-person')])
    expect(staffAlertSend).toHaveBeenCalledWith(expect.objectContaining({ key: 'in-person-notice' }))
    expect(bodyOf('/api/email/order-confirmation')).not.toBeNull()
  })

  it('an unreachable web service alerts and does not throw', async () => {
    notice = { ok: true, throws: true }
    await expect(place([line('90 min in-person')])).resolves.toBeUndefined()
    expect(staffAlertSend).toHaveBeenCalledWith(expect.objectContaining({ key: 'in-person-notice' }))
  })
})
