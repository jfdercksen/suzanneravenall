import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VtigerClient } from '@suzanne/integrations'
import { makeFakeVtiger } from '../../../../../../packages/integrations/src/test-utils'
import { makeFakeSupabase, type FakeLeadRow } from '@/lib/leads/__fixtures__/fake-supabase'

const h = vi.hoisted(() => ({
  supabase: null as unknown,
  vtiger: null as unknown,
}))

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }))
vi.mock('@/lib/quiz/subscriber', () => ({ getServiceRoleClient: () => h.supabase }))
vi.mock('@/lib/integrations/vtiger', () => ({ getVtigerClient: () => h.vtiger }))
vi.mock('@/lib/email/send', () => ({ sendEmail: vi.fn() }))

const SECRET = 'test-secret'

function req(body?: unknown, secret: string | null = SECRET): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret !== null) headers['x-webhook-secret'] = secret
  return new Request('http://localhost/api/leads/retry', {
    method: 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

function row(id: string, status: string, extra: Partial<FakeLeadRow> = {}): FakeLeadRow {
  return {
    id,
    email: `${id}@example.com`,
    first_name: 'Lee',
    last_name: null,
    source: 'masterclass',
    quiz_result: null,
    vtiger_status: status,
    sync_attempts: 1,
    created_at: '2026-10-06T08:00:00Z',
    ...extra,
  }
}

function client(fake: ReturnType<typeof makeFakeVtiger>, dryRun = false) {
  return new VtigerClient({
    url: 'https://crm.test',
    username: 'u',
    accessKey: 'k',
    fetchImpl: fake.fetchImpl,
    sleep: () => Promise.resolve(),
    retries: 1,
    dryRun,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  })
}

async function loadRoute() {
  vi.resetModules()
  return (await import('./route')).POST
}

describe('POST /api/leads/retry', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    process.env.N8N_WEBHOOK_SECRET = SECRET
    delete process.env.INTERNAL_WEBHOOK_SECRET
    delete process.env.LEADS_AUTOMATION
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
    delete process.env.N8N_WEBHOOK_SECRET
    delete process.env.INTERNAL_WEBHOOK_SECRET
    delete process.env.LEADS_AUTOMATION
  })

  it('401 without the right secret', async () => {
    const POST = await loadRoute()
    expect((await POST(req({}, null))).status).toBe(401)
    expect((await POST(req({}, 'wrong'))).status).toBe(401)
  })

  it('500 when no secret is configured', async () => {
    delete process.env.N8N_WEBHOOK_SECRET
    const POST = await loadRoute()
    expect((await POST(req({}))).status).toBe(500)
  })

  it('prefers INTERNAL_WEBHOOK_SECRET when set', async () => {
    process.env.INTERNAL_WEBHOOK_SECRET = 'internal'
    const db = makeFakeSupabase()
    h.supabase = db.client
    h.vtiger = client(makeFakeVtiger())
    const POST = await loadRoute()
    expect((await POST(req({}, SECRET))).status).toBe(401)
    expect((await POST(req({}, 'internal'))).status).toBe(200)
  })

  it('409 while LEADS_AUTOMATION is not code, so it can never race n8n', async () => {
    process.env.LEADS_AUTOMATION = 'n8n'
    const POST = await loadRoute()
    const res = await POST(req({}))
    expect(res.status).toBe(409)
  })

  it('resends pending and failed rows, marks them synced, leaves synced rows alone', async () => {
    const db = makeFakeSupabase({
      rows: [row('a', 'failed'), row('b', 'pending', { sync_attempts: 0 }), row('c', 'synced'), row('d', 'n8n')],
    })
    const fake = makeFakeVtiger()
    h.supabase = db.client
    h.vtiger = client(fake)
    const POST = await loadRoute()

    const res = await POST(req({}))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ ok: true, processed: 2, synced: 2, failed: 0, dryRun: false })
    expect(db.rows.find((r) => r.id === 'a')).toMatchObject({ vtiger_status: 'synced', sync_attempts: 2 })
    expect(db.rows.find((r) => r.id === 'b')).toMatchObject({ vtiger_status: 'synced', sync_attempts: 1 })
    expect(db.updates.map((u) => u.id).sort()).toEqual(['a', 'b'])
    expect(fake.created.filter((c) => c.elementType === 'Contacts')).toHaveLength(2)
  })

  it('a row whose email is already in Vtiger updates that contact (dedupe)', async () => {
    const db = makeFakeSupabase({ rows: [row('a', 'failed')] })
    const fake = makeFakeVtiger({ contacts: [{ id: '12x188', email: 'a@example.com', lastname: 'X', firstname: 'A' }] })
    h.supabase = db.client
    h.vtiger = client(fake)
    const POST = await loadRoute()

    await POST(req({}))
    expect(fake.ops()).toContain('revise')
    expect(db.rows[0]).toMatchObject({ vtiger_status: 'synced', vtiger_contact_id: '12x188' })
  })

  it('keeps a row failed (attempts + 1) when Vtiger is still down', async () => {
    const db = makeFakeSupabase({ rows: [row('a', 'failed', { sync_attempts: 3 })] })
    const err = new TypeError('fetch failed')
    h.supabase = db.client
    h.vtiger = client(makeFakeVtiger({ failures: { getchallenge: [err, err, err, err] } }))
    const POST = await loadRoute()

    const json = await (await POST(req({}))).json()
    expect(json).toMatchObject({ processed: 1, synced: 0, failed: 1 })
    expect(db.rows[0]).toMatchObject({ vtiger_status: 'failed', sync_attempts: 4 })
  })

  it('honours the limit in the body', async () => {
    const rows = Array.from({ length: 5 }, (_, i) => row(`r${i}`, 'pending'))
    const db = makeFakeSupabase({ rows })
    h.supabase = db.client
    h.vtiger = client(makeFakeVtiger())
    const POST = await loadRoute()

    const json = await (await POST(req({ limit: 2 }))).json()
    expect(json.processed).toBe(2)
  })

  it('dry run: nothing reaches Vtiger and rows stay unsynced', async () => {
    const db = makeFakeSupabase({ rows: [row('a', 'pending')] })
    const fake = makeFakeVtiger()
    h.supabase = db.client
    h.vtiger = client(fake, true)
    const POST = await loadRoute()

    const json = await (await POST(req({}))).json()
    expect(json).toMatchObject({ dryRun: true, processed: 1 })
    expect(fake.calls).toHaveLength(0)
    expect(db.rows[0]).toMatchObject({ vtiger_status: 'pending' })
  })

  it('500 when Supabase is not configured', async () => {
    h.supabase = null
    h.vtiger = client(makeFakeVtiger())
    const POST = await loadRoute()
    expect((await POST(req({}))).status).toBe(500)
  })
})
