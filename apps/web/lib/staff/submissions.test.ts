import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  PAGE_SIZE,
  VIEW_LOG_TABLE,
  isSubmissionId,
  listSubmissions,
  logSubmissionView,
  openSubmission,
  pageNumber,
  searchTerms,
  termFilter,
} from './submissions'
import type { StaffViewer } from './payload-session'

type Result = { data?: unknown; error: { message: string } | null; count?: number }

interface Call {
  table: string
  method: string
  args: unknown[]
}

/** A Supabase stand-in that records every builder call and answers per table. */
function fakeSupabase(answers: { read?: Result; insert?: Result }) {
  const calls: Call[] = []
  const from = (table: string) => {
    const builder: Record<string, unknown> = {}
    const chain = (method: string) => (...args: unknown[]) => {
      calls.push({ table, method, args })
      return builder
    }
    for (const method of ['select', 'eq', 'or', 'order', 'range']) builder[method] = chain(method)
    builder.maybeSingle = (...args: unknown[]) => {
      calls.push({ table, method: 'maybeSingle', args })
      return Promise.resolve(answers.read ?? { data: null, error: null })
    }
    builder.then = (resolve: (v: Result) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve(answers.read ?? { data: [], error: null, count: 0 }).then(resolve, reject)
    builder.insert = (row: unknown) => {
      calls.push({ table, method: 'insert', args: [row] })
      return Promise.resolve(answers.insert ?? { error: null })
    }
    return builder
  }
  return { client: { from } as unknown as SupabaseClient, calls }
}

const VIEWER: StaffViewer = { id: '7', email: 'team@ravenallinstitute.com', name: 'Team Member', role: 'staff' }
const ID = '6f1c2a4e-1b2c-4d3e-8f90-123456789abc'

describe('searchTerms', () => {
  it('splits words and drops characters that could change a PostgREST filter or LIKE pattern', () => {
    expect(searchTerms('  Jane   Smith ')).toEqual(['Jane', 'Smith'])
    expect(searchTerms('jane@example.com')).toEqual(['jane@example.com'])
    expect(searchTerms('a,b),email.eq.x"%_*\\:')).toEqual(['a', 'b', 'email.eq.x'])
    expect(searchTerms('one two three four five')).toHaveLength(4)
    expect(searchTerms(undefined)).toEqual([])
    expect(searchTerms('%%%')).toEqual([])
  })

  it('quotes each value so a dot in an email stays part of the value', () => {
    expect(termFilter('jane@example.com', ['first_name', 'email'])).toBe(
      'first_name.ilike."%jane@example.com%",email.ilike."%jane@example.com%"',
    )
  })
})

describe('pageNumber and isSubmissionId', () => {
  it('accepts only sane values', () => {
    expect(pageNumber('3')).toBe(3)
    expect(pageNumber('0')).toBe(1)
    expect(pageNumber('-2')).toBe(1)
    expect(pageNumber('1.5')).toBe(1)
    expect(pageNumber('abc')).toBe(1)
    expect(pageNumber(undefined)).toBe(1)
    expect(isSubmissionId(ID)).toBe(true)
    expect(isSubmissionId('1')).toBe(false)
    expect(isSubmissionId(`${ID}' or 1=1`)).toBe(false)
  })
})

describe('listSubmissions', () => {
  it('lists completed submissions newest first, one page, without secrets', async () => {
    const { client, calls } = fakeSupabase({ read: { data: [{ id: ID }], error: null, count: 51 } })
    const list = await listSubmissions(client, 'quiz', 'Jane', 2)
    expect(list).toEqual({ rows: [{ id: ID }], total: 51, page: 2 })
    const select = calls.find((c) => c.method === 'select')!
    expect(select.table).toBe('quiz_subscribers')
    expect(String(select.args[0])).not.toContain('access_token')
    expect(calls).toContainEqual({ table: 'quiz_subscribers', method: 'eq', args: ['status', 'completed'] })
    expect(calls).toContainEqual({
      table: 'quiz_subscribers',
      method: 'or',
      args: ['first_name.ilike."%Jane%",last_name.ilike."%Jane%",email.ilike."%Jane%"'],
    })
    expect(calls).toContainEqual({
      table: 'quiz_subscribers',
      method: 'order',
      args: ['completed_at', { ascending: false, nullsFirst: false }],
    })
    expect(calls).toContainEqual({ table: 'quiz_subscribers', method: 'range', args: [PAGE_SIZE, 2 * PAGE_SIZE - 1] })
  })

  it('searches intake rows on the customer email and never selects the link token', async () => {
    const { client, calls } = fakeSupabase({})
    await listSubmissions(client, 'intake', 'a b', 1)
    const select = calls.find((c) => c.method === 'select')!
    expect(select.table).toBe('intake_submissions')
    expect(String(select.args[0])).not.toMatch(/\btoken\b/)
    expect(calls.filter((c) => c.method === 'or')).toHaveLength(2)
    expect(String(calls.find((c) => c.method === 'or')!.args[0])).toContain('customer_email.ilike')
  })

  it('falls back to the first page when the page asked for is past the end (PostgREST 416)', async () => {
    let call = 0
    const from = () => {
      const builder: Record<string, unknown> = {}
      for (const m of ['select', 'eq', 'or', 'order', 'range']) builder[m] = () => builder
      builder.then = (resolve: (v: unknown) => unknown) => {
        call += 1
        return Promise.resolve(
          call === 1
            ? { data: null, error: { code: 'PGRST103', message: 'Requested range not satisfiable' } }
            : { data: [{ id: ID }], error: null, count: 1 },
        ).then(resolve)
      }
      return builder
    }
    const list = await listSubmissions({ from } as unknown as SupabaseClient, 'quiz', '', 9999)
    expect(list).toEqual({ rows: [{ id: ID }], total: 1, page: 1 })
  })

  it('throws on a database error', async () => {
    const { client } = fakeSupabase({ read: { data: null, error: { message: 'boom' } } })
    await expect(listSubmissions(client, 'quiz', '', 1)).rejects.toThrow('quiz list failed: boom')
  })
})

describe('the access log (POPIA)', () => {
  it('records who opened which submission', async () => {
    const { client, calls } = fakeSupabase({})
    await logSubmissionView(client, VIEWER, 'intake', ID)
    expect(calls).toEqual([
      {
        table: VIEW_LOG_TABLE,
        method: 'insert',
        args: [
          {
            viewer_id: '7',
            viewer_email: 'team@ravenallinstitute.com',
            viewer_role: 'staff',
            submission_type: 'intake',
            submission_id: ID,
          },
        ],
      },
    ])
  })

  it('openSubmission logs the view before handing back the row', async () => {
    const row = { id: ID, answers: { '1': 3 } }
    const { client, calls } = fakeSupabase({ read: { data: row, error: null } })
    const opened = await openSubmission(client, VIEWER, 'quiz', ID)
    expect(opened).toEqual({ status: 'ok', row })
    expect(calls).toContainEqual({ table: 'quiz_subscribers', method: 'eq', args: ['id', ID] })
    expect(calls).toContainEqual({ table: 'quiz_subscribers', method: 'eq', args: ['status', 'completed'] })
    expect(calls.filter((c) => c.table === VIEW_LOG_TABLE && c.method === 'insert')).toHaveLength(1)
    const detailColumns = String(calls.find((c) => c.method === 'select')!.args[0])
    expect(detailColumns).toContain('consented_at')
    expect(detailColumns).toContain('marketing_channels')
    expect(detailColumns).not.toContain('access_token')
  })

  it('returns no row when the log write fails (fail closed)', async () => {
    const { client } = fakeSupabase({
      read: { data: { id: ID, answers: { '1': 3 } }, error: null },
      insert: { error: { message: 'relation "staff_submission_views" does not exist' } },
    })
    const opened = await openSubmission(client, VIEWER, 'quiz', ID)
    expect(opened.status).toBe('log-failed')
    expect(opened).not.toHaveProperty('row')
  })

  it('logs nothing for an unknown or malformed id', async () => {
    const { client, calls } = fakeSupabase({ read: { data: null, error: null } })
    expect(await openSubmission(client, VIEWER, 'intake', ID)).toEqual({ status: 'not-found' })
    expect(await openSubmission(client, VIEWER, 'intake', 'nope')).toEqual({ status: 'not-found' })
    expect(calls.some((c) => c.method === 'insert')).toBe(false)
  })
})
