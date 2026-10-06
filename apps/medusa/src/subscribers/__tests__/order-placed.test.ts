import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * The cutover switch in order-placed.ts: per flag, exactly one path runs.
 * n8n mode must behave as before (same webhook calls); code mode must not call
 * the n8n webhook for that automation. Sage and the other side effects are
 * untouched in every mode.
 */

const { enqueueAndKick, getAutomationQueue } = vi.hoisted(() => {
  const enqueueAndKick = vi.fn(async (_a: string, key: string) => ({ job: { id: key }, created: true }))
  return { enqueueAndKick, getAutomationQueue: vi.fn(() => ({ enqueueAndKick })) }
})

vi.mock('@medusajs/framework/utils', () => ({ ContainerRegistrationKeys: { QUERY: 'query' } }))
vi.mock('../../modules/memberships', () => ({ MEMBERSHIPS_MODULE: 'membershipsModule' }))
vi.mock('../../modules/memberships/service', () => ({ default: class {} }))
vi.mock('../../automations/runtime', () => ({
  getAutomationQueue,
  createDryRunQueue: vi.fn(() => {
    throw new Error('dry run not expected in this test')
  }),
}))

const order = {
  id: 'order_01QA',
  display_id: 21,
  customer_id: 'cus_1',
  email: 'qa.buyer@example.com',
  total: 0,
  customer: { email: null },
  billing_address: { first_name: 'QA', last_name: 'SelfTest' },
  items: [
    {
      title: 'Program 1 Self Study',
      variant: { title: 'Default', product: { title: 'Program 1 Self Study', metadata: { thinkific_course_id: '1284792' }, categories: [] } },
    },
  ],
}

function container() {
  return {
    resolve: (key: string) => {
      if (key === 'query') return { graph: vi.fn(async () => ({ data: [structuredClone(order)] })) }
      if (key === 'order') return { listOrders: vi.fn(async () => []) }
      throw new Error(`unexpected resolve ${key}`)
    },
  }
}

let fetchMock: ReturnType<typeof vi.fn>

async function placeOrder(env: Record<string, string>) {
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
  vi.resetModules()
  const mod = (await import('../order-placed.js')) as unknown as { default: (args: unknown) => Promise<void> }
  await mod.default({ event: { data: { id: 'order_01QA' } }, container: container() })
  // let the fire-and-forget calls start
  await new Promise((r) => setTimeout(r, 10))
  return fetchMock.mock.calls.map((c) => String(c[0]))
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchMock = vi.fn(async () => new Response(JSON.stringify({}), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('N8N_WEBHOOK_URL', 'http://n8n:5678')
  vi.stubEnv('N8N_WEBHOOK_SECRET', 'secret')
  vi.stubEnv('WEB_BASE_URL', 'http://web:3000')
  vi.stubEnv('N8N_THINKIFIC_ENROLLMENT_WEBHOOK_URL', 'http://n8n:5678/webhook/medusa-order-complete')
  vi.stubEnv('VIBE_MARKETING_WEBHOOK_URL', '')
  vi.stubEnv('SUPABASE_URL', '')
  vi.stubEnv('AUTOMATION_THINKIFIC', '')
  vi.stubEnv('AUTOMATION_ORDER_VTIGER', '')
  vi.stubEnv('AUTOMATION_VTIGER_ORDER', '')
  vi.stubEnv('AUTOMATION_DRY_RUN', '')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('order-placed cutover flags', () => {
  it('default (flags unset = n8n): the three n8n webhooks fire as before and no job is queued', async () => {
    const urls = await placeOrder({})
    expect(urls).toContain('http://n8n:5678/webhook/medusa-order-placed')
    expect(urls).toContain('http://n8n:5678/webhook/medusa-order-vtiger')
    expect(urls).toContain('http://n8n:5678/webhook/medusa-order-complete')
    expect(getAutomationQueue).not.toHaveBeenCalled()
    // The n8n payload is unchanged: the full order with the guest email copied onto the customer.
    const vtigerCall = fetchMock.mock.calls.find((c) => String(c[0]).endsWith('medusa-order-vtiger'))!
    expect(JSON.parse(String((vtigerCall[1] as RequestInit).body))).toMatchObject({ id: 'order_01QA', customer: { email: 'qa.buyer@example.com' } })
  })

  it('both on code: no n8n call for Thinkific or Vtiger, both queued; Sage untouched', async () => {
    const urls = await placeOrder({ AUTOMATION_THINKIFIC: 'code', AUTOMATION_ORDER_VTIGER: 'code' })
    expect(urls).toContain('http://n8n:5678/webhook/medusa-order-placed')
    expect(urls).not.toContain('http://n8n:5678/webhook/medusa-order-vtiger')
    expect(urls).not.toContain('http://n8n:5678/webhook/medusa-order-complete')
    expect(enqueueAndKick.mock.calls.map((c) => c[1])).toEqual(['thinkific_enrolment:order_01QA', 'vtiger_order:order_01QA'])
    // The invoice + confirmation chain still runs.
    expect(urls).toContain('http://web:3000/api/invoices/generate')
  })

  it('Thinkific on code, Vtiger on n8n: only the Vtiger webhook fires', async () => {
    const urls = await placeOrder({ AUTOMATION_THINKIFIC: 'code' })
    expect(urls).toContain('http://n8n:5678/webhook/medusa-order-vtiger')
    expect(urls).not.toContain('http://n8n:5678/webhook/medusa-order-complete')
    expect(enqueueAndKick.mock.calls.map((c) => c[1])).toEqual(['thinkific_enrolment:order_01QA'])
  })

  it('off: neither the webhook nor the code runs', async () => {
    const urls = await placeOrder({ AUTOMATION_THINKIFIC: 'off', AUTOMATION_ORDER_VTIGER: 'off' })
    expect(urls).not.toContain('http://n8n:5678/webhook/medusa-order-vtiger')
    expect(urls).not.toContain('http://n8n:5678/webhook/medusa-order-complete')
    expect(urls).toContain('http://n8n:5678/webhook/medusa-order-placed')
    expect(enqueueAndKick).not.toHaveBeenCalled()
  })

  it('a typo in a flag falls back to n8n, never to both', async () => {
    const urls = await placeOrder({ AUTOMATION_ORDER_VTIGER: 'cod' })
    expect(urls).toContain('http://n8n:5678/webhook/medusa-order-vtiger')
    expect(enqueueAndKick).not.toHaveBeenCalled()
  })
})
