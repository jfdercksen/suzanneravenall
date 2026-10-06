import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest'
import { VtigerClient, VtigerError } from '@suzanne/integrations'
import { makeFakeVtiger } from '../../../../../packages/integrations/src/test-utils'
import { makeFakeSupabase, MISSING_TABLE_ERROR } from '@/lib/leads/__fixtures__/fake-supabase'

// ---------------------------------------------------------------------------
// Hoisted mocks: Sentry, the Supabase service client, the Vtiger client and
// the mail sender. Nothing here ever reaches a real system.
// ---------------------------------------------------------------------------
const h = vi.hoisted(() => ({
  mockCaptureException: vi.fn(),
  mockCaptureMessage: vi.fn(),
  sendEmail: vi.fn(),
  welcome: vi.fn(),
  supabase: null as unknown,
  vtiger: null as unknown,
  vtigerThrows: null as Error | null,
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: h.mockCaptureException,
  captureMessage: h.mockCaptureMessage,
}))
vi.mock('@/lib/quiz/subscriber', () => ({ getServiceRoleClient: () => h.supabase }))
vi.mock('@/lib/integrations/vtiger', () => ({
  getVtigerClient: () => {
    if (h.vtigerThrows) throw h.vtigerThrows
    return h.vtiger
  },
}))
vi.mock('@/lib/email/send', () => ({ sendEmail: h.sendEmail }))
// The welcome email has its own tests (lib/leads/welcome.test.ts); here only
// the hand-off is checked, so h.sendEmail keeps counting staff alerts alone.
vi.mock('@/lib/leads/welcome', () => ({ sendLeadWelcomeIfDue: h.welcome }))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const N8N_URL = 'http://n8n.test:5678/webhook/lead-magnet-submission'
const VIBE_URL = 'https://vibe.example.com/webhook'
const ALERT_TO = 'alerts@example.test'

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/lead-magnet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeRawRequest(rawBody: string): Request {
  return new Request('http://localhost/api/lead-magnet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: rawBody,
  })
}

function okResponse(): Response {
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}

type FetchCall = [string, RequestInit]

function callsTo(spy: MockInstance<typeof fetch>, url: string): FetchCall[] {
  return (spy.mock.calls as unknown as FetchCall[]).filter(([calledUrl]) => calledUrl === url)
}

function onlyCallTo(spy: MockInstance<typeof fetch>, url: string): FetchCall {
  const calls = callsTo(spy, url)
  expect(calls).toHaveLength(1)
  return calls[0] as FetchCall
}

function sentBody(call: FetchCall): Record<string, unknown> {
  return JSON.parse(call[1].body as string) as Record<string, unknown>
}

function vtigerClient(fake: ReturnType<typeof makeFakeVtiger>, dryRun = false): VtigerClient {
  return new VtigerClient({
    url: 'https://crm.test',
    username: 'u',
    accessKey: 'k',
    fetchImpl: fake.fetchImpl,
    sleep: () => Promise.resolve(),
    retries: 2,
    dryRun,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  })
}

/** A Vtiger that is down: every request fails at the network level. */
function downVtiger() {
  const err = new TypeError('fetch failed: ECONNREFUSED')
  return makeFakeVtiger({ failures: { getchallenge: Array.from({ length: 30 }, () => err) } })
}

// The route reads VIBE_MARKETING_WEBHOOK_URL at load time, so each group
// re-imports it after setting env (this also resets the alert throttle).
async function loadRoute(): Promise<(req: Request) => Promise<Response>> {
  vi.resetModules()
  const mod = await import('./route')
  return mod.POST
}

const ENV_KEYS = [
  'VIBE_MARKETING_WEBHOOK_URL',
  'N8N_BASE_URL',
  'LEADS_AUTOMATION',
  'AUTOMATION_LEADS',
  'AUTOMATION_ALERT_EMAIL',
] as const

let fetchSpy: MockInstance<typeof fetch>
let errorSpy: MockInstance<typeof console.error>
let warnSpy: MockInstance<typeof console.warn>
let db: ReturnType<typeof makeFakeSupabase>
let crm: ReturnType<typeof makeFakeVtiger>

function setup(opts: { supabase?: ReturnType<typeof makeFakeSupabase> | null; crm?: ReturnType<typeof makeFakeVtiger> } = {}) {
  db = opts.supabase === undefined ? makeFakeSupabase() : (opts.supabase as ReturnType<typeof makeFakeSupabase>)
  h.supabase = opts.supabase === null ? null : db.client
  crm = opts.crm ?? makeFakeVtiger()
  h.vtiger = vtigerClient(crm)
}

beforeEach(() => {
  vi.clearAllMocks()
  for (const k of ENV_KEYS) delete process.env[k]
  process.env.N8N_BASE_URL = 'http://n8n.test:5678/'
  process.env.AUTOMATION_ALERT_EMAIL = ALERT_TO
  h.vtigerThrows = null
  h.sendEmail.mockResolvedValue('msg-1')
  h.welcome.mockResolvedValue('sent')
  setup()
  fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse())
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  fetchSpy.mockRestore()
  errorSpy.mockRestore()
  warnSpy.mockRestore()
  for (const k of ENV_KEYS) delete process.env[k]
})

// ---------------------------------------------------------------------------
// Group A - LEADS_AUTOMATION=code (the default): Supabase first, then Vtiger
// ---------------------------------------------------------------------------
describe('POST /api/lead-magnet - code path (default)', () => {
  let POST: (req: Request) => Promise<Response>
  beforeEach(async () => {
    POST = await loadRoute()
  })

  it('saves the lead in Supabase, creates it in Vtiger, marks the row synced, returns 200', async () => {
    const res = await POST(makeRequest({ email: 'User@Example.com', firstName: 'Alice', source: 'masterclass' }))

    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
    expect(db.inserts).toEqual([
      { email: 'user@example.com', first_name: 'Alice', last_name: null, source: 'masterclass', quiz_result: null, vtiger_status: 'pending' },
    ])
    expect(crm.created.map((c) => c.elementType)).toEqual(['Contacts', 'Events'])
    expect(crm.created[0]!.element).toMatchObject({ email: 'user@example.com', firstname: 'Alice', leadsource: 'Lead Magnet', cf_pipeline_stage: 'New Lead' })
    expect(db.rows[0]).toMatchObject({ vtiger_status: 'synced', sync_attempts: 1, last_sync_error: null })
    expect(db.rows[0]!.vtiger_contact_id).toMatch(/^12x/)
    expect(db.rows[0]!.vtiger_event_id).toMatch(/^18x/)
    expect(h.sendEmail).not.toHaveBeenCalled()
  })

  it('does not call n8n when the flag is code (never both)', async () => {
    await POST(makeRequest({ email: 'user@example.com' }))
    expect(callsTo(fetchSpy, N8N_URL)).toHaveLength(0)
  })

  it('falls back to the email local-part for firstName and "homepage" for source', async () => {
    await POST(makeRequest({ email: 'jane.doe@example.com' }))

    expect(db.inserts[0]).toMatchObject({ first_name: 'jane.doe', source: 'homepage' })
    expect(crm.created[0]!.element).toMatchObject({ firstname: 'jane.doe', lastname: 'jane.doe' })
    expect(crm.created[1]!.element).toMatchObject({ subject: 'Website form - homepage' })
  })

  it.each(['masterclass', 'community', 'newsletter', 'assessments-notify', 'relationship-patterns'])(
    'keeps the form source tag "%s" in Supabase and on the Vtiger Event',
    async (source) => {
      await POST(makeRequest({ email: 'user@example.com', source }))
      expect(db.inserts[0]!.source).toBe(source)
      expect(crm.created[1]!.element).toMatchObject({ subject: `Website form - ${source}`, description: `Source: ${source}. Email: user@example.com` })
    },
  )

  it('stores the quiz result and puts it on the Event', async () => {
    await POST(makeRequest({ email: 'user@example.com', source: 'freeze-quiz', quizResult: 'freeze' }))
    expect(db.inserts[0]!.quiz_result).toBe('freeze')
    expect(String(crm.created[1]!.element.description)).toContain('Quiz result: freeze')
  })

  it('dedupes by email: an existing Vtiger contact is updated, not created again', async () => {
    setup({ crm: makeFakeVtiger({ contacts: [{ id: '12x188', firstname: 'QA', lastname: 'SelfTest', email: 'qa@example.com', leadsource: 'Shop', assigned_user_id: '19x1' }] }) })

    const res = await POST(makeRequest({ email: 'QA@example.com', source: 'community' }))

    expect(res.status).toBe(200)
    expect(crm.ops()).toEqual(['getchallenge', 'login', 'query', 'revise', 'create'])
    expect(crm.contacts).toHaveLength(1)
    expect(crm.contacts[0]).toMatchObject({ leadsource: 'Shop' }) // only set when blank
    expect(db.rows[0]).toMatchObject({ vtiger_status: 'synced', vtiger_contact_id: '12x188' })
  })

  describe('Vtiger down', () => {
    beforeEach(() => setup({ crm: downVtiger() }))

    it('still returns 200: the lead is safe in Supabase', async () => {
      const res = await POST(makeRequest({ email: 'user@example.com', source: 'masterclass' }))
      expect(res.status).toBe(200)
      expect((await res.json()).success).toBe(true)
    })

    it('leaves the row failed (attempts 1, reason without the email) for the retry', async () => {
      await POST(makeRequest({ email: 'user@example.com', source: 'masterclass' }))
      expect(db.rows[0]).toMatchObject({ vtiger_status: 'failed', sync_attempts: 1 })
      expect(String(db.rows[0]!.last_sync_error)).toContain('network error')
      expect(String(db.rows[0]!.last_sync_error)).not.toContain('user@example.com')
    })

    it('sends one staff alert to AUTOMATION_ALERT_EMAIL, throttled across leads', async () => {
      await POST(makeRequest({ email: 'one@example.com', source: 'masterclass' }))
      await POST(makeRequest({ email: 'two@example.com', source: 'community' }))
      await POST(makeRequest({ email: 'three@example.com', source: 'homepage' }))

      expect(h.sendEmail).toHaveBeenCalledTimes(1)
      const mail = h.sendEmail.mock.calls[0]![0] as { to: string[]; subject: string; text: string }
      expect(mail.to).toEqual([ALERT_TO])
      expect(mail.subject).toBe('[ALERT] Website lead did not reach Vtiger')
      expect(mail.text).not.toContain('one@example.com')
      expect(mail.text).not.toMatch(/—/) // no em dashes in staff-facing text
    })

    it('sends no mail when AUTOMATION_ALERT_EMAIL is not set, but still answers 200', async () => {
      delete process.env.AUTOMATION_ALERT_EMAIL
      const res = await POST(makeRequest({ email: 'user@example.com' }))
      expect(res.status).toBe(200)
      expect(h.sendEmail).not.toHaveBeenCalled()
    })

    it('reports to Sentry without the email address (POPIA)', async () => {
      await POST(makeRequest({ email: 'user@example.com', source: 'footer' }))
      expect(h.mockCaptureException).toHaveBeenCalled()
      expect(JSON.stringify(h.mockCaptureException.mock.calls.map((c) => c[1]))).not.toContain('user@example.com')
    })
  })

  it('treats a missing Vtiger configuration like Vtiger being down', async () => {
    h.vtigerThrows = new VtigerError('Vtiger is not configured', 'NOT_CONFIGURED')
    const res = await POST(makeRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(200)
    expect(db.rows[0]).toMatchObject({ vtiger_status: 'failed' })
    expect(h.sendEmail).toHaveBeenCalledTimes(1)
  })

  describe('Supabase leads table missing (migration not applied yet)', () => {
    beforeEach(() => setup({ supabase: makeFakeSupabase({ insertError: MISSING_TABLE_ERROR }) }))

    it('logs a warning and still delivers the lead to Vtiger, 200', async () => {
      const res = await POST(makeRequest({ email: 'user@example.com', source: 'community' }))

      expect(res.status).toBe(200)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('lead not saved to Supabase (missing_table)'))
      expect(crm.created.map((c) => c.elementType)).toEqual(['Contacts', 'Events'])
      expect(db.updates).toHaveLength(0)
      expect(h.sendEmail).not.toHaveBeenCalled()
    })
  })

  it('works when Supabase is not configured at all (Vtiger holds the lead)', async () => {
    setup({ supabase: null })
    const res = await POST(makeRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(200)
    expect(crm.created).toHaveLength(2)
  })

  describe('Supabase and Vtiger both down', () => {
    beforeEach(() => setup({ supabase: makeFakeSupabase({ insertError: MISSING_TABLE_ERROR }), crm: downVtiger() }))

    it('returns 502 so the form asks the visitor to try again', async () => {
      const res = await POST(makeRequest({ email: 'user@example.com' }))
      const json = await res.json()
      expect(res.status).toBe(502)
      expect(json.success).toBeUndefined()
      expect(json.error).toBe('We could not save your details right now. Please try again in a moment.')
    })

    it('alerts staff that a lead was lost', async () => {
      await POST(makeRequest({ email: 'user@example.com' }))
      expect(h.sendEmail).toHaveBeenCalledTimes(1)
      expect((h.sendEmail.mock.calls[0]![0] as { subject: string }).subject).toBe(
        '[ALERT] Website lead LOST: Supabase and Vtiger both failed',
      )
    })

    it('a real Supabase error (not a missing table) is logged as an error', async () => {
      setup({ supabase: makeFakeSupabase({ insertError: { code: '57014', message: 'canceling statement due to statement timeout' } }), crm: downVtiger() })
      const res = await POST(makeRequest({ email: 'user@example.com' }))
      expect(res.status).toBe(502)
      expect(errorSpy).toHaveBeenCalledWith('[lead-magnet] could not save the lead to Supabase', expect.any(Error), { source: 'homepage' })
    })
  })

  it('dry run: Vtiger gets no request, the row stays pending, visitor gets 200', async () => {
    const fake = makeFakeVtiger()
    h.vtiger = vtigerClient(fake, true)
    const res = await POST(makeRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(200)
    expect(fake.calls).toHaveLength(0)
    expect(db.rows[0]).toMatchObject({ vtiger_status: 'pending' })
    expect(db.updates).toHaveLength(0)
  })

  it('an unknown flag value falls back to code', async () => {
    process.env.LEADS_AUTOMATION = 'both'
    await POST(makeRequest({ email: 'user@example.com' }))
    expect(callsTo(fetchSpy, N8N_URL)).toHaveLength(0)
    expect(crm.created).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Group B - LEADS_AUTOMATION=n8n: the old webhook, unchanged, plus our copy
// ---------------------------------------------------------------------------
describe('POST /api/lead-magnet - LEADS_AUTOMATION=n8n', () => {
  let POST: (req: Request) => Promise<Response>
  beforeEach(async () => {
    process.env.LEADS_AUTOMATION = 'n8n'
    POST = await loadRoute()
  })

  it('posts the lead to the n8n webhook (trailing slash stripped) and never calls Vtiger', async () => {
    const res = await POST(makeRequest({ email: 'user@example.com', firstName: 'Alice', source: 'newsletter' }))

    expect(res.status).toBe(200)
    const body = sentBody(onlyCallTo(fetchSpy, N8N_URL))
    expect(body).toMatchObject({ email: 'user@example.com', firstName: 'Alice', source: 'newsletter', quizResult: null })
    expect(typeof body.timestamp).toBe('string')
    expect(crm.calls).toHaveLength(0)
    expect(db.inserts[0]).toMatchObject({ vtiger_status: 'n8n' })
  })

  it('sends the same fallbacks to n8n as before (local-part, "homepage") and forwards quizResult', async () => {
    await POST(makeRequest({ email: 'jane.doe@example.com', quizResult: 'freeze' }))
    expect(sentBody(onlyCallTo(fetchSpy, N8N_URL))).toMatchObject({ firstName: 'jane.doe', source: 'homepage', quizResult: 'freeze' })
  })

  it('AUTOMATION_LEADS (the plan spelling) is accepted too', async () => {
    delete process.env.LEADS_AUTOMATION
    process.env.AUTOMATION_LEADS = 'n8n'
    await POST(makeRequest({ email: 'user@example.com' }))
    expect(callsTo(fetchSpy, N8N_URL)).toHaveLength(1)
    expect(crm.calls).toHaveLength(0)
  })

  it('n8n fails but the row is saved: 200, row left failed for the retry, one alert', async () => {
    fetchSpy.mockResolvedValue(new Response('error', { status: 500 }))
    const res = await POST(makeRequest({ email: 'user@example.com', source: 'footer' }))

    expect(res.status).toBe(200)
    expect(db.rows[0]).toMatchObject({ vtiger_status: 'failed' })
    expect(h.sendEmail).toHaveBeenCalledTimes(1)
  })

  describe('n8n fails and Supabase has no table (nothing stored, B13)', () => {
    beforeEach(() => setup({ supabase: makeFakeSupabase({ insertError: MISSING_TABLE_ERROR }) }))

    it('returns 502 when n8n responds non-2xx', async () => {
      fetchSpy.mockResolvedValue(new Response('not found', { status: 404 }))
      const res = await POST(makeRequest({ email: 'user@example.com' }))
      expect(res.status).toBe(502)
    })

    it('returns 502 when the n8n request throws, and reports it to Sentry without the email', async () => {
      const networkError = new Error('ECONNREFUSED')
      fetchSpy.mockRejectedValue(networkError)

      const res = await POST(makeRequest({ email: 'user@example.com', source: 'footer' }))

      expect(res.status).toBe(502)
      expect(h.mockCaptureException).toHaveBeenCalledWith(networkError, { extra: { source: 'footer' } })
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[lead-magnet] n8n webhook failed: ECONNREFUSED'))
    })

    it('handles a non-Error rejection value', async () => {
      fetchSpy.mockRejectedValue('string error')
      const res = await POST(makeRequest({ email: 'user@example.com' }))
      expect(res.status).toBe(502)
    })
  })
})

// ---------------------------------------------------------------------------
// Group C - LEADS_AUTOMATION=off: our copy only
// ---------------------------------------------------------------------------
describe('POST /api/lead-magnet - LEADS_AUTOMATION=off', () => {
  let POST: (req: Request) => Promise<Response>
  beforeEach(async () => {
    process.env.LEADS_AUTOMATION = 'off'
    POST = await loadRoute()
  })

  it('saves the row as skipped and calls neither n8n nor Vtiger', async () => {
    const res = await POST(makeRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(200)
    expect(db.inserts[0]).toMatchObject({ vtiger_status: 'skipped' })
    expect(callsTo(fetchSpy, N8N_URL)).toHaveLength(0)
    expect(crm.calls).toHaveLength(0)
  })

  it('returns 502 when Supabase cannot save it either', async () => {
    setup({ supabase: makeFakeSupabase({ insertError: MISSING_TABLE_ERROR }) })
    const res = await POST(makeRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(502)
  })
})

// ---------------------------------------------------------------------------
// Group D - request validation (nothing is stored or sent)
// ---------------------------------------------------------------------------
describe('POST /api/lead-magnet - validation', () => {
  let POST: (req: Request) => Promise<Response>
  beforeEach(async () => {
    POST = await loadRoute()
  })

  it.each([
    ['missing', { firstName: 'Alice' }],
    ['without @', { email: 'notanemail' }],
    ['without a domain', { email: 'user@' }],
    ['without a local part', { email: '@example.com' }],
    ['with spaces', { email: 'user @example.com' }],
    ['a number', { email: 42 }],
    ['null', { email: null }],
    ['an empty body', {}],
  ])('returns 422 when the email is %s', async (_label, body) => {
    const res = await POST(makeRequest(body))

    expect(res.status).toBe(422)
    expect((await res.json()).error).toBe('Please enter a valid email address.')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(db.inserts).toHaveLength(0)
    expect(crm.calls).toHaveLength(0)
  })

  it('accepts subdomains and plus addressing', async () => {
    const res = await POST(makeRequest({ email: 'user+tag@mail.example.co.za' }))
    expect(res.status).toBe(200)
  })

  it.each([
    ['invalid JSON', '{not valid json'],
    ['plain text', 'hello world'],
    ['empty', ''],
  ])('returns 400 when the body is %s', async (_label, raw) => {
    const res = await POST(makeRawRequest(raw))

    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Invalid request body.')
    expect(db.inserts).toHaveLength(0)
    expect(crm.calls).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Group E - VIBE_MARKETING_WEBHOOK_URL set (secondary, fire-and-forget copy)
// ---------------------------------------------------------------------------
describe('POST /api/lead-magnet - Vibe Marketing forwarding', () => {
  let POST: (req: Request) => Promise<Response>
  beforeEach(async () => {
    process.env.VIBE_MARKETING_WEBHOOK_URL = `${VIBE_URL}/`
    POST = await loadRoute()
  })

  it('does NOT call Vibe when VIBE_MARKETING_WEBHOOK_URL is not set', async () => {
    delete process.env.VIBE_MARKETING_WEBHOOK_URL
    const route = await loadRoute()
    await route(makeRequest({ email: 'user@example.com' }))
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('sends the lead to Vibe (trailing slash stripped) with the expected payload', async () => {
    const res = await POST(makeRequest({ email: 'user@example.com', firstName: 'Alice', source: 'homepage' }))

    expect(res.status).toBe(200)
    await vi.waitFor(() => expect(callsTo(fetchSpy, VIBE_URL)).toHaveLength(1))
    const call = onlyCallTo(fetchSpy, VIBE_URL)
    expect(call[1].method).toBe('POST')
    expect(call[1].headers).toMatchObject({ 'Content-Type': 'application/json' })
    const body = sentBody(call)
    expect(body).toMatchObject({ email: 'user@example.com', firstName: 'Alice', source: 'homepage', platform: 'suzanneravenall' })
    expect(typeof body.timestamp).toBe('string')
  })

  it('sends null firstName and source to Vibe when they are not provided', async () => {
    await POST(makeRequest({ email: 'user@example.com' }))
    await vi.waitFor(() => expect(callsTo(fetchSpy, VIBE_URL)).toHaveLength(1))
    const body = sentBody(onlyCallTo(fetchSpy, VIBE_URL))
    expect(body.firstName).toBeNull()
    expect(body.source).toBeNull()
  })

  it('still calls Vibe when Vtiger is down but the lead is saved', async () => {
    setup({ crm: downVtiger() })
    const res = await POST(makeRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(200)
    await vi.waitFor(() => expect(callsTo(fetchSpy, VIBE_URL)).toHaveLength(1))
  })

  it('still returns 200 when only the Vibe call fails, and reports it to Sentry', async () => {
    const vibeError = new Error('timeout')
    fetchSpy.mockImplementation(async (url) => (String(url) === VIBE_URL ? Promise.reject(vibeError) : okResponse()))

    const res = await POST(makeRequest({ email: 'user@example.com', source: 'footer' }))

    expect(res.status).toBe(200)
    await vi.waitFor(() => expect(h.mockCaptureException).toHaveBeenCalledWith(vibeError, { extra: { source: 'footer' } }))
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[lead-magnet] Vibe Marketing webhook failed: timeout'))
  })

  it('does not call Vibe when the lead could not be stored anywhere', async () => {
    setup({ supabase: makeFakeSupabase({ insertError: MISSING_TABLE_ERROR }), crm: downVtiger() })
    const res = await POST(makeRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(502)
    expect(callsTo(fetchSpy, VIBE_URL)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Group F - welcome email hand-off
// ---------------------------------------------------------------------------
describe('POST /api/lead-magnet - welcome email', () => {
  let POST: (req: Request) => Promise<Response>
  beforeEach(async () => {
    POST = await loadRoute()
  })

  it('hands the stored lead to the welcome email once, with the row id', async () => {
    const res = await POST(makeRequest({ email: 'user@example.com', firstName: 'Alice', source: 'masterclass' }))

    expect(res.status).toBe(200)
    expect(h.welcome).toHaveBeenCalledTimes(1)
    expect(h.welcome).toHaveBeenCalledWith({
      email: 'user@example.com',
      firstName: 'Alice',
      source: 'masterclass',
      leadId: 'lead-1',
    })
  })

  it('passes "homepage" and no first name for the homepage form (not the CRM local-part fallback)', async () => {
    await POST(makeRequest({ email: 'jane.doe@example.com' }))
    expect(h.welcome).toHaveBeenCalledWith({ email: 'jane.doe@example.com', firstName: null, source: 'homepage', leadId: 'lead-1' })
  })

  it('does not wait for the welcome email before answering', async () => {
    h.welcome.mockReturnValue(new Promise(() => {}))
    const res = await POST(makeRequest({ email: 'user@example.com', source: 'newsletter' }))
    expect(res.status).toBe(200)
  })

  it('sends no welcome when the lead could not be stored anywhere', async () => {
    setup({ supabase: makeFakeSupabase({ insertError: MISSING_TABLE_ERROR }), crm: downVtiger() })
    const res = await POST(makeRequest({ email: 'user@example.com', source: 'community' }))
    expect(res.status).toBe(502)
    expect(h.welcome).not.toHaveBeenCalled()
  })

  it('passes a null lead id when only Vtiger holds the lead', async () => {
    setup({ supabase: null })
    await POST(makeRequest({ email: 'user@example.com', source: 'community' }))
    expect(h.welcome).toHaveBeenCalledWith(expect.objectContaining({ leadId: null, source: 'community' }))
  })
})
