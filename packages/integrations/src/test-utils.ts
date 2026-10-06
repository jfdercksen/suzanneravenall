/**
 * In-memory fake of the Vtiger webservice for unit tests. Never used at
 * runtime. Records every call so tests can assert on the exact payloads.
 */

export type FakeCall = { method: string; operation: string; params: Record<string, string> }

export type FakeVtigerOptions = {
  contacts?: Array<Record<string, unknown> & { id: string }>
  /** Return this for the given operation (count down per call), e.g. a 503 or a thrown error. */
  failures?: Partial<Record<string, Array<Response | Error>>>
  token?: string
  sessionName?: string
  userId?: string
  /** Operations the instance does not know (to simulate a missing `revise`). */
  unknownOperations?: string[]
}

export function makeFakeVtiger(opts: FakeVtigerOptions = {}) {
  const calls: FakeCall[] = []
  const contacts = [...(opts.contacts ?? [])]
  const created: Array<{ elementType: string; element: Record<string, unknown> }> = []
  let nextId = 500
  let sessionCounter = 0
  const validSessions = new Set<string>()

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  const fail = (code: string, message = code) => json({ success: false, error: { code, message } })

  const fetchImpl = async (input: string, init?: RequestInit): Promise<Response> => {
    const method = init?.method ?? 'GET'
    const params: Record<string, string> = {}
    const source = method === 'GET' ? new URL(input).searchParams : new URLSearchParams(String(init?.body ?? ''))
    source.forEach((v, k) => {
      params[k] = v
    })
    const operation = params.operation ?? ''
    calls.push({ method, operation, params })

    const queued = opts.failures?.[operation]
    if (queued && queued.length > 0) {
      const next = queued.shift() as Response | Error
      if (next instanceof Error) throw next
      return next
    }

    if (opts.unknownOperations?.includes(operation)) return fail('UNKNOWN_OPERATION', 'Unknown operation requested')

    switch (operation) {
      case 'getchallenge':
        return json({ success: true, result: { token: opts.token ?? 'tok123', serverTime: 0, expireTime: 0 } })
      case 'login': {
        sessionCounter += 1
        const sessionName = `${opts.sessionName ?? 'sess'}${sessionCounter}`
        validSessions.add(sessionName)
        return json({ success: true, result: { sessionName, userId: opts.userId ?? '19x1' } })
      }
      default:
        break
    }

    if (!validSessions.has(params.sessionName ?? '')) return fail('INVALID_SESSIONID', 'Session Identifier provided is Invalid')

    switch (operation) {
      case 'query': {
        const m = /email='((?:[^'\\]|\\.)*)'/.exec(params.query ?? '')
        const email = m?.[1]?.replace(/\\(.)/g, '$1')
        const rows = contacts.filter((c) => c.email === email).slice(0, 1)
        return json({ success: true, result: rows })
      }
      case 'create': {
        const element = JSON.parse(params.element ?? '{}') as Record<string, unknown>
        const prefix = params.elementType === 'Contacts' ? '12' : '18'
        const id = `${prefix}x${nextId++}`
        created.push({ elementType: params.elementType ?? '', element })
        if (params.elementType === 'Contacts') contacts.push({ ...element, id })
        return json({ success: true, result: { ...element, id } })
      }
      case 'revise':
      case 'update': {
        const element = JSON.parse(params.element ?? '{}') as Record<string, unknown> & { id: string }
        const idx = contacts.findIndex((c) => c.id === element.id)
        if (idx < 0) return fail('RECORD_NOT_FOUND')
        contacts[idx] = operation === 'revise' ? { ...contacts[idx], ...element } : element
        return json({ success: true, result: contacts[idx] })
      }
      default:
        return fail('UNKNOWN_OPERATION')
    }
  }

  return {
    fetchImpl,
    calls,
    contacts,
    created,
    ops: () => calls.map((c) => c.operation),
    expireSessions: () => validSessions.clear(),
  }
}
