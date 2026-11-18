import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkStaffAccess, SUBMISSIONS_ROLE } from './payload-session'

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MX0.c2lnbmF0dXJl'

function payloadAnswers(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

function user(role: string) {
  return { collection: 'users', user: { id: 7, email: 'team@ravenallinstitute.com', name: 'Team Member', role } }
}

describe('checkStaffAccess (KI125)', () => {
  beforeEach(() => {
    vi.stubEnv('PAYLOAD_INTERNAL_URL', 'http://payload:3001/cms')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('lets a CMS user with the Staff role through', async () => {
    const fetchImpl = payloadAnswers(user('staff'))
    const access = await checkStaffAccess(TOKEN, fetchImpl)
    expect(SUBMISSIONS_ROLE).toBe('staff')
    expect(access).toEqual({
      status: 'allowed',
      viewer: { id: '7', email: 'team@ravenallinstitute.com', name: 'Team Member', role: 'staff' },
    })
  })

  it('asks Payload who the token belongs to, server to server, with the token as a JWT header', async () => {
    const fetchImpl = payloadAnswers(user('staff'))
    await checkStaffAccess(TOKEN, fetchImpl)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0]!
    expect(url).toBe('http://payload:3001/cms/api/users/me')
    expect((init as RequestInit).headers).toMatchObject({ Authorization: `JWT ${TOKEN}` })
    expect((init as RequestInit).cache).toBe('no-store')
  })

  it.each(['admin', 'editor'])('refuses a logged-in %s: only the Staff role reads answers', async (role) => {
    const access = await checkStaffAccess(TOKEN, payloadAnswers(user(role)))
    expect(access.status).toBe('forbidden')
  })

  it('treats no cookie, or a value that is not a JWT, as signed out without calling Payload', async () => {
    const fetchImpl = payloadAnswers(user('staff'))
    expect(await checkStaffAccess(undefined, fetchImpl)).toEqual({ status: 'signed-out' })
    expect(await checkStaffAccess('', fetchImpl)).toEqual({ status: 'signed-out' })
    expect(await checkStaffAccess('not a token', fetchImpl)).toEqual({ status: 'signed-out' })
    expect(await checkStaffAccess(`${TOKEN}\r\nX-Injected: 1`, fetchImpl)).toEqual({ status: 'signed-out' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('treats an expired or logged-out token as signed out (Payload answers user null)', async () => {
    expect(await checkStaffAccess(TOKEN, payloadAnswers({ user: null }))).toEqual({ status: 'signed-out' })
    expect(await checkStaffAccess(TOKEN, payloadAnswers({ errors: [] }, 401))).toEqual({ status: 'signed-out' })
  })

  it('refuses a user from another auth collection, or one without a role', async () => {
    expect(
      await checkStaffAccess(TOKEN, payloadAnswers({ collection: 'customers', user: { id: 1, email: 'a@b.c', role: 'staff' } })),
    ).toEqual({ status: 'signed-out' })
    expect(await checkStaffAccess(TOKEN, payloadAnswers({ user: { id: 1, email: 'a@b.c' } }))).toEqual({
      status: 'signed-out',
    })
  })

  it('says unavailable when Payload is down or answers garbage, never allowed', async () => {
    expect(await checkStaffAccess(TOKEN, vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))).toEqual({
      status: 'unavailable',
    })
    expect(await checkStaffAccess(TOKEN, payloadAnswers({}, 502))).toEqual({ status: 'unavailable' })
    expect(
      await checkStaffAccess(TOKEN, vi.fn().mockResolvedValue(new Response('<html>', { status: 200 }))),
    ).toEqual({ status: 'unavailable' })
  })
})
