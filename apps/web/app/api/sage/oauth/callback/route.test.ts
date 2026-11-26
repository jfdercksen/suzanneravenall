import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/log', () => ({ logError: vi.fn(), logWarn: vi.fn() }))

import { logError } from '@/lib/log'
import { GET } from './route'

const STATE = 'abcdefghijklmnopqrstuvwxyz012345'

const call = (qs: string) => GET(new Request(`http://localhost/api/sage/oauth/callback${qs}`))

describe('GET /api/sage/oauth/callback', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('INTERNAL_WEBHOOK_SECRET', 's3cret')
    vi.stubEnv('N8N_WEBHOOK_SECRET', '')
    vi.stubEnv('MEDUSA_BACKEND_URL', 'http://medusa-test:9000')
    fetchMock = vi.fn(async () => new Response(JSON.stringify({ status: 'connected' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('relays code and state to Medusa with the shared secret and answers 200', async () => {
    const res = await call(`?code=CODE123&state=${STATE}`)
    expect(res.status).toBe(200)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://medusa-test:9000/hooks/sage/oauth')
    expect((init.headers as Record<string, string>)['x-webhook-secret']).toBe('s3cret')
    expect(JSON.parse(String(init.body))).toEqual({ code: 'CODE123', state: STATE })
    expect(res.headers.get('referrer-policy')).toBe('no-referrer')
  })

  it('answers 400 and does not call Medusa when code or state is missing or too short', async () => {
    for (const qs of ['', '?code=x', `?state=${STATE}`, '?code=x&state=short', `?code=&state=${STATE}`]) {
      expect((await call(qs)).status).toBe(400)
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('answers 500 when the shared secret is not configured', async () => {
    vi.stubEnv('INTERNAL_WEBHOOK_SECRET', '')
    const res = await call(`?code=CODE123&state=${STATE}`)
    expect(res.status).toBe(500)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('tells the user to start again when Medusa says the state is invalid', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 400 }))
    const res = await call(`?code=CODE123&state=${STATE}`)
    expect(res.status).toBe(400)
    expect(await res.text()).toContain('Start the connection again')
  })

  it('answers 502 when Medusa fails or is unreachable', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 502 }))
    expect((await call(`?code=CODE123&state=${STATE}`)).status).toBe(502)
    fetchMock.mockRejectedValueOnce(new Error('connect ECONNREFUSED'))
    expect((await call(`?code=CODE123&state=${STATE}`)).status).toBe(502)
  })

  it('never logs or echoes the code or the state', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 502 }))
    const res = await call(`?code=SECRETCODE&state=${STATE}`)
    const body = await res.text()
    expect(body).not.toContain('SECRETCODE')
    expect(body).not.toContain(STATE)
    expect(JSON.stringify((logError as ReturnType<typeof vi.fn>).mock.calls)).not.toMatch(/SECRETCODE|abcdefghijkl/)
  })
})
