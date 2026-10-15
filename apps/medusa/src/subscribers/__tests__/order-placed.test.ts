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

/**
 * KI070: member_subscriptions.tier_id is a uuid, so the free tier is resolved
 * from membership_tiers by slug before the base row is inserted. The literal
 * 'free' must never reach the insert.
 */
const FREE_TIER_ID = '6a906895-e0b7-48e0-a451-caf2affa27d3'

function supabaseFake(opts: { tierRow: { id: string } | null; existing?: { access_level: number; track: string } | null }) {
  const insert = vi.fn((_row: Record<string, unknown>) => Promise.resolve({ error: null }))
  const update = vi.fn(() => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }))
  const tierEq = vi.fn(() => ({ maybeSingle: async () => ({ data: opts.tierRow, error: null }) }))
  const tierSelect = vi.fn(() => ({ eq: tierEq }))
  const upsert = vi.fn((_row: Record<string, unknown>, _opts: { onConflict: string }) => Promise.resolve({ error: null }))
  const subSelect = () => {
    const q = {
      eq: () => q,
      order: () => q,
      limit: () => q,
      maybeSingle: async () => ({ data: opts.existing ?? null, error: null }),
    }
    return q
  }
  const client = {
    auth: { admin: { listUsers: async () => ({ data: { users: [{ id: 'user_qa', email: 'qa.buyer@example.com' }] }, error: null }) } },
    from: (table: string) => {
      if (table === 'membership_tiers') return { select: tierSelect }
      if (table === 'member_subscriptions') return { select: subSelect, insert, update, upsert }
      throw new Error(`unexpected table ${table}`)
    },
  }
  return { client, insert, update, upsert, tierSelect, tierEq }
}

const programmeOrder = {
  ...order,
  customer: { email: 'qa.buyer@example.com' },
  items: [
    {
      title: 'Rapid Repatterning Self Study',
      variant: { title: 'Default', product: { title: 'Rapid Repatterning Self Study', metadata: {}, categories: [{ handle: 'rp-self-paced' }] } },
    },
  ],
}

async function placeProgrammeOrder(fake: ReturnType<typeof supabaseFake>, placed: Record<string, unknown> = programmeOrder) {
  vi.doMock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => fake.client) }))
  vi.stubEnv('SUPABASE_URL', 'http://supabase.test')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test')
  vi.resetModules()
  const mod = (await import('../order-placed.js')) as unknown as { default: (args: unknown) => Promise<void> }
  const c = {
    resolve: (key: string) => {
      if (key === 'query') return { graph: vi.fn(async () => ({ data: [structuredClone(placed)] })) }
      if (key === 'order') return { listOrders: vi.fn(async () => []) }
      if (key === 'membershipsModule') return { activateMembership: vi.fn(async () => undefined) }
      throw new Error(`unexpected resolve ${key}`)
    },
  }
  await mod.default({ event: { data: { id: 'order_01QA' } }, container: c })
  await new Promise((r) => setTimeout(r, 10))
}

describe('order-placed portal access base row (KI070)', () => {
  afterEach(() => {
    vi.doUnmock('@supabase/supabase-js')
  })

  it('inserts the base row with the free tier uuid looked up by slug, never the literal "free"', async () => {
    const fake = supabaseFake({ tierRow: { id: FREE_TIER_ID } })
    await placeProgrammeOrder(fake)
    expect(fake.tierSelect).toHaveBeenCalledWith('id')
    expect(fake.tierEq).toHaveBeenCalledWith('slug', 'free')
    expect(fake.insert).toHaveBeenCalledTimes(1)
    const row = fake.insert.mock.calls[0][0]
    expect(row).toMatchObject({ user_id: 'user_qa', tier_id: FREE_TIER_ID, status: 'active', access_level: 3, track: 'general' })
    expect(row.tier_id).not.toBe('free')
  })

  it('skips the insert and logs when the free tier is not seeded', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fake = supabaseFake({ tierRow: null })
    await placeProgrammeOrder(fake)
    expect(fake.insert).not.toHaveBeenCalled()
    expect(errorSpy.mock.calls.map((c) => String(c[0])).join('\n')).toContain('free tier not found')
    errorSpy.mockRestore()
  })

  it('upgrades an existing row in place without touching membership_tiers', async () => {
    const fake = supabaseFake({ tierRow: { id: FREE_TIER_ID }, existing: { access_level: 2, track: 'general' } })
    await placeProgrammeOrder(fake)
    expect(fake.insert).not.toHaveBeenCalled()
    expect(fake.update).toHaveBeenCalledWith({ access_level: 3, track: 'general' })
    expect(fake.tierSelect).not.toHaveBeenCalled()
  })

  it('membership orders upsert the tier uuid looked up by the product tier slug', async () => {
    const SILVER_ID = 'bf4d1e22-1ad6-4dfc-9cec-786d56485def'
    const fake = supabaseFake({ tierRow: { id: SILVER_ID } })
    const membershipOrder = {
      ...programmeOrder,
      items: [{ title: 'Silver', variant: { title: 'Membership', product: { title: 'Silver', metadata: { product_type: 'membership', tier: 'silver' }, categories: [] } } }],
    }
    await placeProgrammeOrder(fake, membershipOrder)
    expect(fake.tierEq).toHaveBeenCalledWith('slug', 'silver')
    expect(fake.upsert).toHaveBeenCalledTimes(1)
    const row = fake.upsert.mock.calls[0][0]
    expect(row).toMatchObject({ user_id: 'user_qa', tier_id: SILVER_ID, status: 'active' })
    expect(fake.insert).not.toHaveBeenCalled()
  })
})
