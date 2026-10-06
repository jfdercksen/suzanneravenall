/**
 * In-memory fake of the Thinkific public API for unit tests. Never used at
 * runtime. Records every call so tests can assert on the exact requests.
 */

export type ThinkificCall = { method: string; path: string; query: Record<string, string>; body: unknown; auth: string }

export type FakeThinkificOptions = {
  users?: Array<{ id: number; email: string; first_name?: string; last_name?: string }>
  enrolments?: Array<{ id: number; user_id: number; course_id: number; expired?: boolean }>
  /** Queued responses per "METHOD /path" (counted down per call), e.g. a 503 or a thrown error. */
  failures?: Partial<Record<string, Array<Response | Error>>>
  /** Course ids Thinkific rejects with 422 on enrol. */
  badCourses?: number[]
  /** Return users whose email only contains the query (Thinkific search is fuzzy). */
  fuzzyUserSearch?: boolean
}

export function makeFakeThinkific(opts: FakeThinkificOptions = {}) {
  const calls: ThinkificCall[] = []
  const users = [...(opts.users ?? [])]
  const enrolments = [...(opts.enrolments ?? [])]
  let nextId = 9000

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

  const fetchImpl = async (input: string, init?: RequestInit): Promise<Response> => {
    const url = new URL(input)
    const method = init?.method ?? 'GET'
    const path = url.pathname.replace('/api/public/v1', '')
    const query: Record<string, string> = {}
    url.searchParams.forEach((v, k) => {
      query[k] = v
    })
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    const auth = new Headers(init?.headers).get('authorization') ?? ''
    calls.push({ method, path, query, body, auth })

    const queued = opts.failures?.[`${method} ${path}`]
    if (queued && queued.length > 0) {
      const next = queued.shift() as Response | Error
      if (next instanceof Error) throw next
      return next
    }

    if (method === 'GET' && path === '/users') {
      const q = (query['query[email]'] ?? '').toLowerCase()
      const items = users.filter((u) => (opts.fuzzyUserSearch ? u.email.toLowerCase().includes(q) : u.email.toLowerCase() === q))
      return json({ items, meta: { pagination: { total_items: items.length } } })
    }
    if (method === 'POST' && path === '/users') {
      const b = body as { email: string; first_name: string; last_name: string }
      if (users.some((u) => u.email.toLowerCase() === b.email.toLowerCase())) {
        return json({ errors: { email: ['has already been taken'] } }, 422)
      }
      if (!b.last_name) return json({ errors: { last_name: ["can't be blank"] } }, 422)
      const user = { id: nextId++, email: b.email, first_name: b.first_name, last_name: b.last_name }
      users.push(user)
      return json(user, 201)
    }
    if (method === 'GET' && path === '/enrollments') {
      const uid = Number(query['query[user_id]'])
      const cid = Number(query['query[course_id]'])
      const items = enrolments.filter((e) => e.user_id === uid && e.course_id === cid)
      return json({ items, meta: {} })
    }
    if (method === 'POST' && path === '/enrollments') {
      const b = body as { course_id: number; user_id: number; activated_at: string }
      if (opts.badCourses?.includes(b.course_id)) return json({ error: 'Course not found' }, 422)
      const e = { id: nextId++, user_id: b.user_id, course_id: b.course_id, expired: false, activated_at: b.activated_at }
      enrolments.push(e)
      return json(e, 201)
    }
    return json({ error: 'not found' }, 404)
  }

  return {
    fetchImpl,
    calls,
    users,
    enrolments,
    writes: () => calls.filter((c) => c.method === 'POST'),
  }
}
