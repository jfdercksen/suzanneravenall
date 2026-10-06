import { describe, it, expect } from 'vitest'
import { PgJobStore, type RawSql } from '../pg-store'

/**
 * No database here: these tests pin the SQL the store sends (locking,
 * conflict handling, binding counts) and how rows are read back. The SQL
 * itself runs for real only on the box.
 */

type Call = { sql: string; bindings: unknown[] }

function fakeDb(responses: Array<Record<string, unknown>[]> = []) {
  const calls: Call[] = []
  const db: RawSql = {
    async raw(sql, bindings = []) {
      calls.push({ sql, bindings })
      const placeholders = (sql.match(/\?/g) ?? []).length
      if (placeholders !== bindings.length) {
        throw new Error(`placeholder/binding mismatch: ${placeholders} vs ${bindings.length} in ${sql}`)
      }
      return { rows: responses.shift() ?? [] }
    },
  }
  return { db, calls }
}

const row = {
  id: 'autjob_1',
  automation: 'vtiger_order',
  idempotency_key: 'vtiger_order:order_1',
  order_id: 'order_1',
  payload: { order: { id: 'order_1' } },
  state: '{"contactId":"12x1"}',
  result: null,
  status: 'running',
  attempts: '2',
  next_attempt_at: new Date('2026-10-06T10:00:00Z'),
  locked_until: '2026-10-06T10:10:00Z',
  last_error: null,
  created_at: new Date('2026-10-06T09:00:00Z'),
  updated_at: new Date('2026-10-06T10:00:00Z'),
}

describe('PgJobStore', () => {
  it('insert: ON CONFLICT (idempotency_key) DO NOTHING, payload as jsonb', async () => {
    const { db, calls } = fakeDb([[row]])
    const res = await new PgJobStore(db).insertIfAbsent({
      id: 'autjob_1', automation: 'vtiger_order', idempotencyKey: 'vtiger_order:order_1', orderId: 'order_1',
      payload: { order: { id: 'order_1' } }, nextAttemptAt: new Date(),
    })
    expect(res.created).toBe(true)
    expect(calls[0]!.sql).toContain('ON CONFLICT (idempotency_key) DO NOTHING RETURNING *')
    expect(calls[0]!.sql).toContain('?::jsonb')
    expect(calls[0]!.bindings[4]).toBe('{"order":{"id":"order_1"}}')
  })

  it('insert of an existing key returns the stored job, created false', async () => {
    const { db, calls } = fakeDb([[], [row]])
    const res = await new PgJobStore(db).insertIfAbsent({
      id: 'autjob_2', automation: 'vtiger_order', idempotencyKey: 'vtiger_order:order_1', orderId: 'order_1',
      payload: {}, nextAttemptAt: new Date(),
    })
    expect(res).toMatchObject({ created: false, job: { id: 'autjob_1' } })
    expect(calls[1]!.sql).toContain('WHERE idempotency_key = ?')
  })

  it('claims lock with FOR UPDATE SKIP LOCKED and take due or lease-expired rows only', async () => {
    const { db, calls } = fakeDb([[row], [row]])
    const store = new PgJobStore(db)
    const now = new Date('2026-10-06T10:00:00Z')
    await store.claim('autjob_1', now, new Date(now.getTime() + 1))
    await store.claimDue(['thinkific_enrolment', 'vtiger_order'], now, new Date(now.getTime() + 1), 25)
    for (const c of calls) {
      expect(c.sql).toContain('FOR UPDATE SKIP LOCKED')
      expect(c.sql).toContain("status = 'running', attempts = attempts + 1")
      expect(c.sql).toContain("(status = 'pending' AND next_attempt_at <= ?) OR (status = 'running' AND locked_until < ?)")
    }
    expect(calls[1]!.sql).toContain('automation IN (?, ?)')
    expect(calls[1]!.bindings.at(-1)).toBe(25)
  })

  it('claimDue with no automations sends no SQL', async () => {
    const { db, calls } = fakeDb()
    expect(await new PgJobStore(db).claimDue([], new Date(), new Date(), 5)).toEqual([])
    expect(calls).toHaveLength(0)
  })

  it('reads rows back with dates, numbers and JSON parsed', async () => {
    const { db } = fakeDb([[row]])
    const job = await new PgJobStore(db).claim('autjob_1', new Date(), new Date())
    expect(job).toMatchObject({ attempts: 2, state: { contactId: '12x1' }, payload: { order: { id: 'order_1' } } })
    expect(job!.locked_until).toBeInstanceOf(Date)
  })

  it('complete / reschedule / kill / release / state / mode writes bind every value', async () => {
    const { db, calls } = fakeDb()
    const store = new PgJobStore(db)
    await store.saveState('a', { x: 1 })
    await store.complete('a', { x: 1 }, { ok: true })
    await store.reschedule('a', null, 'err', new Date())
    await store.kill('a', null, 'err')
    await store.release('a', new Date())
    await store.setModeState({ automation: 'vtiger_order', mode: 'code', since: new Date() })
    await store.getModeState('vtiger_order')
    expect(calls).toHaveLength(7)
    expect(calls[1]!.sql).toContain("status = 'done'")
    expect(calls[2]!.sql).toContain("status = 'pending'")
    expect(calls[3]!.sql).toContain("status = 'dead'")
    expect(calls[4]!.sql).toContain('attempts = GREATEST(attempts - 1, 0)')
    expect(calls[5]!.sql).toContain('ON CONFLICT (automation) DO UPDATE')
  })
})
