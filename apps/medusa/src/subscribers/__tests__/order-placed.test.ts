import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * The cutover switch in order-placed.ts: per flag, exactly one path runs.
 * n8n mode must behave as before (same webhook calls); code mode must not call
 * the n8n webhook for that automation. Sage and the other side effects are
 * untouched in every mode.
 */

const { enqueueAndKick, getAutomationQueue, staffAlertSend } = vi.hoisted(() => {
  const enqueueAndKick = vi.fn(async (_a: string, key: string) => ({ job: { id: key }, created: true }))
  const staffAlertSend = vi.fn(async (_alert: { key: string; subject: string; lines: string[] }) => 'sent' as const)
  return { enqueueAndKick, getAutomationQueue: vi.fn(() => ({ enqueueAndKick })), staffAlertSend }
})

vi.mock('@medusajs/framework/utils', () => ({ ContainerRegistrationKeys: { QUERY: 'query' } }))
vi.mock('../../modules/memberships', () => ({ MEMBERSHIPS_MODULE: 'membershipsModule' }))
vi.mock('../../modules/memberships/service', () => ({ default: class {} }))
vi.mock('../../automations/runtime', () => ({
  getAutomationQueue,
  staffAlerter: () => ({ send: staffAlertSend, reset: () => undefined }),
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
 * Supabase member_subscriptions writes.
 *
 * KI070: member_subscriptions.tier_id is a uuid, so a tier is resolved from
 * membership_tiers by slug before any row is written. The literal 'free' must
 * never reach an insert.
 *
 * Schema: user_id is NOT unique (only the id primary key is), so the fake
 * below holds a list of rows and honours the eq() filters the way Postgres
 * would: an expired row is history, a new active row sits beside it, and the
 * membership write is select-then-update-or-insert on (user_id, tier_id)
 * rather than an upsert on a key the table does not have.
 */
const FREE_TIER_ID = '6a906895-e0b7-48e0-a451-caf2affa27d3'
const SILVER_ID = 'bf4d1e22-1ad6-4dfc-9cec-786d56485def'

type SubRow = { id: string; user_id: string; tier_id: string; status: string; access_level: number; track: string }
type DbError = { message: string; code?: string } | null

function supabaseFake(opts: { tierRow: { id: string } | null; rows?: SubRow[]; insertError?: DbError; updateError?: DbError; selectError?: DbError }) {
  const rows = opts.rows ?? []
  const insert = vi.fn((_row: Record<string, unknown>) => Promise.resolve({ error: opts.insertError ?? null }))
  const updateWhere = vi.fn((_col: string, _val: string) => ({
    eq: () => Promise.resolve({ error: opts.updateError ?? null }),
    then: (cb: (v: { error: DbError }) => unknown) => Promise.resolve({ error: opts.updateError ?? null }).then(cb),
  }))
  const update = vi.fn((_values: Record<string, unknown>) => ({ eq: updateWhere }))
  const tierEq = vi.fn(() => ({ maybeSingle: async () => ({ data: opts.tierRow, error: null }) }))
  const tierSelect = vi.fn(() => ({ eq: tierEq }))
  const subSelect = () => {
    const filters: Array<[string, string]> = []
    const q = {
      eq: (col: string, val: string) => {
        filters.push([col, val])
        return q
      },
      order: () => q,
      limit: () => q,
      maybeSingle: async () => {
        if (opts.selectError) return { data: null, error: opts.selectError }
        const match = rows
          .filter((r) => filters.every(([c, v]) => String(r[c as keyof SubRow]) === v))
          .sort((a, b) => b.access_level - a.access_level)[0]
        return { data: match ?? null, error: null }
      },
    }
    return q
  }
  const client = {
    auth: { admin: { listUsers: async () => ({ data: { users: [{ id: 'user_qa', email: 'qa.buyer@example.com' }] }, error: null }) } },
    from: (table: string) => {
      if (table === 'membership_tiers') return { select: tierSelect }
      // No upsert on purpose: the table has no unique key an upsert could use.
      if (table === 'member_subscriptions') return { select: subSelect, insert, update }
      throw new Error(`unexpected table ${table}`)
    },
  }
  return { client, insert, update, updateWhere, tierSelect, tierEq }
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

const membershipOrder = {
  ...programmeOrder,
  items: [{ title: 'Silver', variant: { title: 'Membership', product: { title: 'Silver', metadata: { product_type: 'membership', tier: 'silver' }, categories: [] } } }],
}

/** Loads the subscriber once against the fake; the returned function places orders on that same module (same tier id cache). */
async function loadSubscriber(fake: ReturnType<typeof supabaseFake>) {
  vi.doMock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => fake.client) }))
  vi.stubEnv('SUPABASE_URL', 'http://supabase.test')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test')
  vi.resetModules()
  const mod = (await import('../order-placed.js')) as unknown as { default: (args: unknown) => Promise<void> }
  return async (placed: Record<string, unknown>, orderId = 'order_01QA') => {
    const c = {
      resolve: (key: string) => {
        if (key === 'query') return { graph: vi.fn(async () => ({ data: [{ ...structuredClone(placed), id: orderId }] })) }
        if (key === 'order') return { listOrders: vi.fn(async () => []) }
        if (key === 'membershipsModule') return { activateMembership: vi.fn(async () => undefined) }
        throw new Error(`unexpected resolve ${key}`)
      },
    }
    await mod.default({ event: { data: { id: orderId } }, container: c })
    await new Promise((r) => setTimeout(r, 10))
  }
}

async function placeProgrammeOrder(fake: ReturnType<typeof supabaseFake>, placed: Record<string, unknown> = programmeOrder) {
  const place = await loadSubscriber(fake)
  await place(placed)
}

function alertKeys() {
  return staffAlertSend.mock.calls.map((c) => (c[0] as { key: string }).key)
}

describe('order-placed portal access base row (KI070)', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    errorSpy.mockRestore()
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
    expect(staffAlertSend).not.toHaveBeenCalled()
  })

  it('skips the insert and alerts staff when the free tier is not seeded', async () => {
    const fake = supabaseFake({ tierRow: null })
    await placeProgrammeOrder(fake)
    expect(fake.insert).not.toHaveBeenCalled()
    expect(alertKeys()).toEqual(['membership-tier-missing'])
    const alert = staffAlertSend.mock.calls[0][0] as { lines: string[] }
    expect(alert.lines.join('\n')).toContain('order_01QA')
    expect(alert.lines.join('\n')).not.toContain('qa.buyer@example.com')
  })

  it('upgrades an existing active row in place without touching membership_tiers', async () => {
    const fake = supabaseFake({
      tierRow: { id: FREE_TIER_ID },
      rows: [{ id: 'sub_1', user_id: 'user_qa', tier_id: FREE_TIER_ID, status: 'active', access_level: 2, track: 'general' }],
    })
    await placeProgrammeOrder(fake)
    expect(fake.insert).not.toHaveBeenCalled()
    expect(fake.update).toHaveBeenCalledWith({ access_level: 3, track: 'general' })
    expect(fake.tierSelect).not.toHaveBeenCalled()
    expect(staffAlertSend).not.toHaveBeenCalled()
  })

  it('a buyer whose only row is expired gets a new active base row; the expired row is left as history', async () => {
    const fake = supabaseFake({
      tierRow: { id: FREE_TIER_ID },
      rows: [{ id: 'sub_old', user_id: 'user_qa', tier_id: FREE_TIER_ID, status: 'expired', access_level: 5, track: 'akashic' }],
    })
    await placeProgrammeOrder(fake)
    expect(fake.update).not.toHaveBeenCalled()
    expect(fake.insert).toHaveBeenCalledTimes(1)
    expect(fake.insert.mock.calls[0][0]).toMatchObject({ user_id: 'user_qa', tier_id: FREE_TIER_ID, status: 'active', access_level: 3 })
    expect(staffAlertSend).not.toHaveBeenCalled()
  })

  it('alerts staff when the access lookup fails and writes nothing', async () => {
    const fake = supabaseFake({ tierRow: { id: FREE_TIER_ID }, selectError: { message: 'connection reset' } })
    await placeProgrammeOrder(fake)
    expect(fake.insert).not.toHaveBeenCalled()
    expect(fake.update).not.toHaveBeenCalled()
    expect(alertKeys()).toEqual(['portal-access'])
    expect((staffAlertSend.mock.calls[0][0] as { lines: string[] }).lines.join('\n')).toContain('connection reset')
  })

  it('alerts staff when the insert fails', async () => {
    const fake = supabaseFake({ tierRow: { id: FREE_TIER_ID }, insertError: { message: 'permission denied', code: '42501' } })
    await placeProgrammeOrder(fake)
    expect(alertKeys()).toEqual(['portal-access'])
  })

  it('alerts staff when the upgrade fails', async () => {
    const fake = supabaseFake({
      tierRow: { id: FREE_TIER_ID },
      rows: [{ id: 'sub_1', user_id: 'user_qa', tier_id: FREE_TIER_ID, status: 'active', access_level: 1, track: 'general' }],
      updateError: { message: 'permission denied' },
    })
    await placeProgrammeOrder(fake)
    expect(alertKeys()).toEqual(['portal-access'])
  })

  it('caches the tier id across orders in one process', async () => {
    const fake = supabaseFake({ tierRow: { id: FREE_TIER_ID } })
    const place = await loadSubscriber(fake)
    await place(programmeOrder, 'order_01')
    await place(programmeOrder, 'order_02')
    expect(fake.tierEq).toHaveBeenCalledTimes(1)
    expect(fake.insert).toHaveBeenCalledTimes(2)
  })

  it('evicts the cached tier id after a foreign key violation so the next order re-resolves it', async () => {
    const fake = supabaseFake({
      tierRow: { id: FREE_TIER_ID },
      insertError: { message: 'insert or update on table "member_subscriptions" violates foreign key constraint "member_subscriptions_tier_id_fkey"', code: '23503' },
    })
    const place = await loadSubscriber(fake)
    await place(programmeOrder, 'order_01')
    await place(programmeOrder, 'order_02')
    expect(fake.tierEq).toHaveBeenCalledTimes(2)
    expect(alertKeys()).toEqual(['portal-access', 'portal-access'])
  })
})

describe('order-placed membership row (user_id is not unique)', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    errorSpy.mockRestore()
    vi.doUnmock('@supabase/supabase-js')
  })

  it('inserts a new active row on the tier uuid looked up by the product tier slug when the user has no row on that tier', async () => {
    const fake = supabaseFake({ tierRow: { id: SILVER_ID } })
    await placeProgrammeOrder(fake, membershipOrder)
    expect(fake.tierEq).toHaveBeenCalledWith('slug', 'silver')
    expect(fake.insert).toHaveBeenCalledTimes(1)
    const row = fake.insert.mock.calls[0][0]
    expect(row).toMatchObject({ user_id: 'user_qa', tier_id: SILVER_ID, status: 'active' })
    expect(typeof row.end_date).toBe('string')
    expect(fake.update).not.toHaveBeenCalled()
    expect(staffAlertSend).not.toHaveBeenCalled()
  })

  it('re-activates the existing (user, tier) row by id instead of inserting a second one', async () => {
    const fake = supabaseFake({
      tierRow: { id: SILVER_ID },
      rows: [{ id: 'sub_silver', user_id: 'user_qa', tier_id: SILVER_ID, status: 'expired', access_level: 4, track: 'general' }],
    })
    await placeProgrammeOrder(fake, membershipOrder)
    expect(fake.insert).not.toHaveBeenCalled()
    expect(fake.update).toHaveBeenCalledTimes(1)
    expect(fake.update.mock.calls[0][0]).toMatchObject({ status: 'active' })
    expect(fake.updateWhere).toHaveBeenCalledWith('id', 'sub_silver')
  })

  it('leaves a row on another tier alone and inserts the purchased tier beside it', async () => {
    const fake = supabaseFake({
      tierRow: { id: SILVER_ID },
      rows: [{ id: 'sub_free', user_id: 'user_qa', tier_id: FREE_TIER_ID, status: 'active', access_level: 1, track: 'general' }],
    })
    await placeProgrammeOrder(fake, membershipOrder)
    expect(fake.update).not.toHaveBeenCalled()
    expect(fake.insert).toHaveBeenCalledTimes(1)
    expect(fake.insert.mock.calls[0][0]).toMatchObject({ tier_id: SILVER_ID })
  })

  it('alerts staff and writes nothing when the tier is not seeded', async () => {
    const fake = supabaseFake({ tierRow: null })
    await placeProgrammeOrder(fake, membershipOrder)
    expect(fake.insert).not.toHaveBeenCalled()
    expect(fake.update).not.toHaveBeenCalled()
    expect(alertKeys()).toEqual(['membership-tier-missing'])
  })

  it('alerts staff when the membership write fails and evicts the tier id on a foreign key violation', async () => {
    const fake = supabaseFake({ tierRow: { id: SILVER_ID }, insertError: { message: 'violates foreign key constraint', code: '23503' } })
    const place = await loadSubscriber(fake)
    await place(membershipOrder, 'order_01')
    await place(membershipOrder, 'order_02')
    expect(alertKeys()).toEqual(['membership-sync', 'membership-sync'])
    expect(fake.tierEq).toHaveBeenCalledTimes(2)
  })
})
