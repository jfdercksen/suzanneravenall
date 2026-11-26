import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const completeConnect = vi.fn()
vi.mock('../../../../../modules/sage/factory', () => ({ sageOAuth: () => ({ auth: { a: 1 }, store: { s: 1 } }) }))
vi.mock('../../../../../modules/sage/oauth-flow', async (orig) => ({
  ...(await orig<typeof import('../../../../../modules/sage/oauth-flow')>()),
  completeConnect: (...a: unknown[]) => completeConnect(...a),
}))

import { OAuthStateError } from '../../../../../modules/sage/oauth-flow'
import { SageConfigError } from '../../../../../modules/sage/errors'
import { POST } from '../route'

const STATE = 'abcdefghijklmnopqrstuvwxyz012345'

function call(headers: Record<string, string>, body: unknown) {
  const json = vi.fn()
  const status = vi.fn((_code: number) => ({ json }))
  return { req: { headers, body, scope: {} }, res: { status, json }, json, status }
}

describe('POST /hooks/sage/oauth', () => {
  const saved = { ...process.env }
  beforeEach(() => {
    process.env.INTERNAL_WEBHOOK_SECRET = 's3cret'
    completeConnect.mockReset().mockResolvedValue(undefined)
  })
  afterEach(() => {
    process.env = { ...saved }
  })

  it('connects with a valid secret, code and state', async () => {
    const c = call({ 'x-webhook-secret': 's3cret' }, { code: 'C', state: STATE })
    await POST(c.req as never, c.res as never)
    expect(c.json).toHaveBeenCalledWith({ status: 'connected' })
    expect(completeConnect.mock.calls[0][1]).toEqual({ code: 'C', state: STATE })
  })

  it('answers 500 when no shared secret is configured, even for a caller sending one', async () => {
    delete process.env.INTERNAL_WEBHOOK_SECRET
    delete process.env.N8N_WEBHOOK_SECRET
    const c = call({ 'x-webhook-secret': 'anything' }, { code: 'C', state: STATE })
    await POST(c.req as never, c.res as never)
    expect(c.status).toHaveBeenCalledWith(500)
    expect(completeConnect).not.toHaveBeenCalled()
  })

  it('accepts the legacy N8N_WEBHOOK_SECRET name', async () => {
    delete process.env.INTERNAL_WEBHOOK_SECRET
    process.env.N8N_WEBHOOK_SECRET = 'legacy'
    const c = call({ 'x-webhook-secret': 'legacy' }, { code: 'C', state: STATE })
    await POST(c.req as never, c.res as never)
    expect(c.json).toHaveBeenCalledWith({ status: 'connected' })
  })

  it('answers 401 for a missing or wrong secret', async () => {
    for (const headers of [{}, { 'x-webhook-secret': 'wrong' }, { 'x-webhook-secret': 's3cret!' }]) {
      const c = call(headers, { code: 'C', state: STATE })
      await POST(c.req as never, c.res as never)
      expect(c.status).toHaveBeenCalledWith(401)
    }
    expect(completeConnect).not.toHaveBeenCalled()
  })

  it('answers 400 for a bad body', async () => {
    for (const body of [undefined, {}, { code: 'C' }, { code: '', state: STATE }, { code: 'C', state: 'short' }, { code: 5, state: STATE }]) {
      const c = call({ 'x-webhook-secret': 's3cret' }, body)
      await POST(c.req as never, c.res as never)
      expect(c.status).toHaveBeenCalledWith(400)
    }
  })

  it('answers 400 for a bad state, 409 when OAuth is not configured, 502 otherwise, never echoing code or state', async () => {
    const run = async (err: Error) => {
      completeConnect.mockRejectedValueOnce(err)
      const c = call({ 'x-webhook-secret': 's3cret' }, { code: 'SECRETCODE', state: STATE })
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      await POST(c.req as never, c.res as never)
      const logged = JSON.stringify(spy.mock.calls)
      spy.mockRestore()
      expect(logged + JSON.stringify(c.json.mock.calls)).not.toMatch(/SECRETCODE|abcdefghijkl/)
      return c.status.mock.calls[0][0]
    }
    expect(await run(new OAuthStateError())).toBe(400)
    expect(await run(new SageConfigError('Sage OAuth is not configured: X not set'))).toBe(409)
    expect(await run(new Error('token endpoint said SECRETCODE'))).toBe(502)
  })
})
