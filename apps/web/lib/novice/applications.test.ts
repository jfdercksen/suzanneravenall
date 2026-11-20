import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  addFile,
  nameMatchesType,
  canUpload,
  decideApplication,
  memberApplications,
  safeFileName,
  staffApplications,
  storagePathFor,
  submitApplication,
  type NoviceApplication,
} from './applications'

const APP_ID = '7f0c2d7e-1d5b-4c55-9a3c-2d7f3f0a9b11'
const USER = 'b6a2c0f4-9a51-4f3e-8d77-3b0d9c4e2a10'

function app(overrides: Partial<NoviceApplication> = {}): NoviceApplication {
  return {
    id: APP_ID,
    user_id: USER,
    email: 'member@example.com',
    first_name: 'Thandi',
    sku: 'S0214',
    medusa_order_id: 'order_01',
    status: 'awaiting_documents',
    files: [],
    submitted_at: null,
    reviewed_at: null,
    reviewer_email: null,
    reviewer_note: null,
    approved_at: null,
    created_at: '2026-11-20T08:00:00Z',
    ...overrides,
  }
}

type Call = { table: string; op: string; values?: unknown; filters: Array<[string, string, unknown]> }

/**
 * A chainable stand-in for the Supabase client: every builder call is
 * recorded; the result of each terminal step comes from `respond`.
 */
function fakeSupabase(respond: (call: Call) => { data?: unknown; error?: { message: string } | null } = () => ({ data: [{ id: APP_ID }], error: null }), storageList: Array<{ name: string }> = []) {
  const calls: Call[] = []
  const from = (table: string) => {
    const call: Call = { table, op: 'select', filters: [] }
    const builder: Record<string, unknown> = {}
    const chain = (name: string) => (...args: unknown[]) => {
      if (name === 'select' && call.op === 'select') call.op = 'select'
      if (['eq', 'is', 'ilike', 'in'].includes(name)) call.filters.push([name, String(args[0]), args[1]])
      return builder
    }
    for (const name of ['select', 'eq', 'is', 'ilike', 'in', 'order', 'limit']) builder[name] = chain(name)
    builder.update = (values: unknown) => {
      call.op = 'update'
      call.values = values
      return builder
    }
    builder.insert = (values: unknown) => {
      call.op = 'insert'
      call.values = values
      return builder
    }
    builder.maybeSingle = async () => {
      calls.push(call)
      return respond(call)
    }
    builder.then = (resolve: (v: unknown) => unknown) => {
      calls.push(call)
      return Promise.resolve(respond(call)).then(resolve)
    }
    return builder
  }
  const client = {
    from,
    storage: { from: () => ({ list: vi.fn(async () => ({ data: storageList, error: null })) }) },
  } as unknown as SupabaseClient
  return { client, calls }
}

describe('Novice application rules', () => {
  it('lets the member upload while waiting or after the team asked for more, not while it is with the team', () => {
    expect(canUpload(app())).toBe(true)
    expect(canUpload(app({ status: 'changes_requested' }))).toBe(true)
    expect(canUpload(app({ status: 'submitted' }))).toBe(false)
    expect(canUpload(app({ status: 'approved' }))).toBe(false)
  })

  it('makes a file name safe as a Storage key and keeps it under the application', () => {
    expect(safeFileName('Session Log (final) é.xlsx')).toBe('Session-Log-final-e.xlsx')
    expect(safeFileName('../../etc/passwd')).toBe('etc-passwd')
    expect(safeFileName('???')).toBe('file')
    expect(storagePathFor(APP_ID, 'notes.pdf', new Date(1000))).toBe(`${APP_ID}/1000-notes.pdf`)
  })
})

describe('memberApplications', () => {
  it('claims an application opened before sign-up only with a confirmed email', async () => {
    const confirmed = fakeSupabase(() => ({ data: [], error: null }))
    await memberApplications(confirmed.client, { id: USER, email: 'member@example.com', email_confirmed_at: '2026-11-20T08:00:00Z' })
    expect(confirmed.calls.some((c) => c.op === 'update' && (c.values as { user_id: string }).user_id === USER)).toBe(true)

    const unconfirmed = fakeSupabase(() => ({ data: [], error: null }))
    await memberApplications(unconfirmed.client, { id: USER, email: 'member@example.com', email_confirmed_at: null })
    expect(unconfirmed.calls.some((c) => c.op === 'update')).toBe(false)
  })
})

describe('addFile and submitApplication', () => {
  it('refuses a path outside the application and a file that is not in Storage', async () => {
    const { client } = fakeSupabase(undefined, [])
    expect(await addFile(client, app(), { path: 'other-app/1-x.pdf', name: 'x.pdf', size: 10, type: 'application/pdf' })).toEqual({ ok: false, reason: 'path' })
    expect(await addFile(client, app(), { path: `${APP_ID}/1-x.pdf`, name: 'x.pdf', size: 10, type: 'application/pdf' })).toEqual({ ok: false, reason: 'missing' })
  })

  it('refuses a file whose ending does not fit its type, or whose stored size or type differs from what the browser said', async () => {
    expect(nameMatchesType('AN1 certificate.pdf', 'application/pdf')).toBe(true)
    expect(nameMatchesType('AN1 certificate.pdf.exe', 'application/pdf')).toBe(false)
    expect(nameMatchesType('page.html', 'text/plain')).toBe(false)
    expect(nameMatchesType('noext', 'application/pdf')).toBe(false)
    const { client } = fakeSupabase(() => ({ error: null }), [{ name: '1-x.pdf', metadata: { size: 999, mimetype: 'application/pdf' } } as { name: string }])
    expect(await addFile(client, app(), { path: `${APP_ID}/1-x.pdf`, name: 'x.pdf', size: 10, type: 'application/pdf' })).toEqual({ ok: false, reason: 'mismatch' })
  })

  it('records a file that is in Storage, and refuses once the application is with the team', async () => {
    const { client, calls } = fakeSupabase(() => ({ error: null }), [{ name: '1-x.pdf' }])
    const result = await addFile(client, app(), { path: `${APP_ID}/1-x.pdf`, name: 'x.pdf', size: 10, type: 'application/pdf' })
    expect(result.ok).toBe(true)
    expect(calls[0]?.op).toBe('update')
    expect(await addFile(client, app({ status: 'submitted' }), { path: `${APP_ID}/2-y.pdf`, name: 'y.pdf', size: 1, type: 'application/pdf' })).toEqual({ ok: false, reason: 'closed' })
  })

  it('will not send an application with no files', async () => {
    const { client } = fakeSupabase()
    expect(await submitApplication(client, app())).toEqual({ ok: false, reason: 'no-files' })
    const file = { path: `${APP_ID}/1-x.pdf`, name: 'x.pdf', size: 1, type: 'application/pdf', uploaded_at: 'now' }
    expect(await submitApplication(client, app({ files: [file] }))).toEqual({ ok: true })
  })
})

describe('decideApplication', () => {
  const sent = app({ status: 'submitted', submitted_at: '2026-11-20T09:00:00Z' })
  const now = new Date('2026-11-21T10:00:00Z')

  it('approves: marks it approved and starts the Novice level for a year from the approval', async () => {
    const { client, calls } = fakeSupabase((call) => {
      if (call.table === 'membership_tiers') return { data: { id: 'tier-s0214' }, error: null }
      if (call.table === 'member_subscriptions' && call.op === 'select') return { data: null, error: null }
      return { data: [{ id: APP_ID }], error: null }
    })
    const result = await decideApplication(client, sent, 'approve', '', 'team@example.com', now)
    expect(result).toEqual({ ok: true, status: 'approved', endDate: '2027-11-21T10:00:00.000Z' })
    const insert = calls.find((c) => c.table === 'member_subscriptions' && c.op === 'insert')
    expect(insert?.values).toMatchObject({ user_id: USER, tier_id: 'tier-s0214', status: 'active', access_level: 4, track: 'akashic', sku: 'S0214' })
    const claim = calls.find((c) => c.table === 'novice_applications' && c.op === 'update')
    expect(claim?.filters).toContainEqual(['eq', 'status', 'submitted'])
  })

  it('reports a decision someone else made first', async () => {
    const { client } = fakeSupabase((call) => {
      if (call.table === 'membership_tiers') return { data: { id: 'tier-s0214' }, error: null }
      if (call.table === 'member_subscriptions' && call.op === 'select') return { data: null, error: null }
      if (call.table === 'novice_applications') return { data: [], error: null }
      return { data: [{ id: 'x' }], error: null }
    })
    expect(await decideApplication(client, sent, 'approve', '', 'team@example.com', now)).toEqual({ ok: false, reason: 'not-submitted' })
  })

  it('leaves the application waiting when the level cannot be started, so the team can approve again', async () => {
    const { client, calls } = fakeSupabase((call) => {
      if (call.table === 'membership_tiers') return { data: null, error: null }
      return { data: [{ id: APP_ID }], error: null }
    })
    const result = await decideApplication(client, sent, 'approve', '', 'team@example.com', now)
    expect(result).toMatchObject({ ok: false, reason: 'activation' })
    expect(calls.some((c) => c.table === 'novice_applications' && c.op === 'update')).toBe(false)
  })

  it('starts access before marking the application approved', async () => {
    const { client, calls } = fakeSupabase((call) => {
      if (call.table === 'membership_tiers') return { data: { id: 'tier-s0214' }, error: null }
      if (call.table === 'member_subscriptions' && call.op === 'select') return { data: null, error: null }
      return { data: [{ id: APP_ID }], error: null }
    })
    await decideApplication(client, sent, 'approve', '', 'team@example.com', now)
    const order = calls.filter((c) => c.op !== 'select').map((c) => c.table)
    expect(order).toEqual(['member_subscriptions', 'novice_applications'])
  })

  it('needs a portal account to approve, and a note to ask for more', async () => {
    const { client } = fakeSupabase()
    expect(await decideApplication(client, { ...sent, user_id: null }, 'approve', '', 't@example.com', now)).toEqual({ ok: false, reason: 'no-account' })
    expect(await decideApplication(client, sent, 'changes', '   ', 't@example.com', now)).toEqual({ ok: false, reason: 'note-required' })
    expect(await decideApplication(client, sent, 'changes', 'Please add your Session Log.', 't@example.com', now)).toEqual({ ok: true, status: 'changes_requested' })
  })

  it('only decides a sent application', async () => {
    const { client } = fakeSupabase()
    expect(await decideApplication(client, app(), 'approve', '', 't@example.com', now)).toEqual({ ok: false, reason: 'not-submitted' })
  })
})

describe('staffApplications', () => {
  it('lists sent applications before those still waiting on the member', async () => {
    const { client } = fakeSupabase(() => ({
      data: [app({ id: 'a', status: 'awaiting_documents' }), app({ id: 'b', status: 'submitted' }), app({ id: 'c', status: 'changes_requested' })],
      error: null,
    }))
    expect((await staffApplications(client)).map((a) => a.id)).toEqual(['b', 'a', 'c'])
  })
})
