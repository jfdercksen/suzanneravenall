import { describe, expect, it, vi } from 'vitest'

const startConnect = vi.fn()
const sageOAuth = vi.fn()
vi.mock('../../../../../modules/sage/factory', () => ({ sageOAuth: (...a: unknown[]) => sageOAuth(...a) }))
vi.mock('../../../../../modules/sage/oauth-flow', () => ({ startConnect: (...a: unknown[]) => startConnect(...a) }))

import { SageConfigError } from '../../../../../modules/sage/errors'
import { POST } from '../route'

function call() {
  const json = vi.fn()
  const status = vi.fn(() => ({ json }))
  return { req: { scope: {} }, res: { status, json }, json, status }
}

describe('POST /admin/sage/connect', () => {
  it('returns the authorize URL and when it expires', async () => {
    sageOAuth.mockReturnValue({ auth: {}, store: {} })
    startConnect.mockResolvedValue({ url: 'https://sage.test/authorize?state=S', expiresAt: new Date('2026-11-26T10:10:00Z') })
    const c = call()
    await POST(c.req as never, c.res as never)
    expect(c.json).toHaveBeenCalledWith({ url: 'https://sage.test/authorize?state=S', expires_at: '2026-11-26T10:10:00.000Z' })
  })

  it('answers 409 with the reason when OAuth is not configured', async () => {
    sageOAuth.mockImplementation(() => {
      throw new SageConfigError('Sage OAuth is not configured: SAGE_OAUTH_CLIENT_ID not set')
    })
    const c = call()
    await POST(c.req as never, c.res as never)
    expect(c.status).toHaveBeenCalledWith(409)
    expect(c.json).toHaveBeenCalledWith({ message: expect.stringContaining('SAGE_OAUTH_CLIENT_ID') })
  })

  it('answers 500 without details on an unexpected failure', async () => {
    sageOAuth.mockReturnValue({ auth: {}, store: {} })
    startConnect.mockRejectedValue(new Error('db password=hunter2'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const c = call()
    await POST(c.req as never, c.res as never)
    spy.mockRestore()
    expect(c.status).toHaveBeenCalledWith(500)
    expect(JSON.stringify(c.json.mock.calls)).not.toContain('hunter2')
  })
})
