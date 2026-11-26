import { describe, it, expect, vi } from 'vitest'
import { randomBytes } from 'node:crypto'
import { BasicAuth, OAuth2Auth, oauthConfigFromEnv, sageAuthFromConfig, TOKEN_MARGIN_MS, type OAuthConfig } from '../auth'
import { decryptSecret, encryptSecret, encryptionKey } from '../crypto'
import { SageConfigError } from '../errors'
import { completeConnect, OAuthStateError, startConnect } from '../oauth-flow'
import { MemorySageTokenStore, PgSageTokenStore, type SageTokens } from '../store'
import { sageConfigFromEnv } from '../config'

const KEY = randomBytes(32).toString('base64')
const ENV = { SAGE_TOKEN_ENCRYPTION_KEY: KEY }
const CONFIG: OAuthConfig = {
  authorizeUrl: 'https://sage.test/authorize',
  tokenUrl: 'https://sage.test/token',
  clientId: 'client-1',
  clientSecret: 'shh-secret',
  redirectUri: 'https://suzanneravenall.com/api/sage/oauth/callback',
  scope: 'full_access',
}
const T0 = new Date('2026-11-26T10:00:00Z')

// shape to be replaced by a recorded sandbox answer (token endpoint)
const tokenAnswer = (over: Record<string, unknown> = {}) =>
  new Response(JSON.stringify({ access_token: 'AT-1', refresh_token: 'RT-1', expires_in: 3600, token_type: 'bearer', ...over }), { status: 200 })

describe('encryption at rest', () => {
  it('round trips and never repeats a ciphertext', () => {
    const key = encryptionKey(ENV)
    const a = encryptSecret('token-value', key)
    expect(a).not.toContain('token-value')
    expect(encryptSecret('token-value', key)).not.toBe(a)
    expect(decryptSecret(a, key)).toBe('token-value')
  })

  it('fails to decrypt with another key or a tampered value', () => {
    const a = encryptSecret('x', encryptionKey(ENV))
    expect(() => decryptSecret(a, randomBytes(32))).toThrow()
    expect(() => decryptSecret(a.slice(0, -4) + 'AAAA', encryptionKey(ENV))).toThrow()
  })

  it('refuses a missing or short key', () => {
    expect(() => encryptionKey({})).toThrow(SageConfigError)
    expect(() => encryptionKey({ SAGE_TOKEN_ENCRYPTION_KEY: Buffer.from('short').toString('base64') })).toThrow(/32 bytes/)
  })
})

describe('PgSageTokenStore', () => {
  const tokens: SageTokens = { accessToken: 'PLAIN-ACCESS', refreshToken: 'PLAIN-REFRESH', expiresAt: T0, scope: 'full_access' }

  it('writes only ciphertext and reads it back', async () => {
    let stored: unknown[] = []
    const db = {
      raw: vi.fn(async (sql: string, b: unknown[] = []) => {
        if (sql.startsWith('INSERT INTO sage_oauth_token')) stored = b
        if (sql.startsWith('SELECT * FROM sage_oauth_token')) {
          return { rows: [{ access_token: stored[0], refresh_token: stored[1], expires_at: T0, scope: 'full_access' }] }
        }
        return { rows: [] }
      }),
    }
    const store = new PgSageTokenStore(db, ENV)
    await store.save(tokens)
    expect(JSON.stringify(stored)).not.toMatch(/PLAIN-/)
    expect(await store.load()).toEqual(tokens)
  })

  it('refuses to store without the encryption key and writes nothing', async () => {
    const db = { raw: vi.fn(async () => ({ rows: [] })) }
    await expect(new PgSageTokenStore(db, {}).save(tokens)).rejects.toThrow(SageConfigError)
    expect(db.raw).not.toHaveBeenCalled()
  })

  it('stores only a hash of the state and consumes it atomically', async () => {
    const db = { raw: vi.fn(async (sql: string) => (sql.startsWith('UPDATE sage_oauth_state') ? { rows: [{ id: 'x' }] } : { rows: [] })) }
    const store = new PgSageTokenStore(db, ENV)
    await store.saveState('state-value-123456', T0)
    expect(JSON.stringify(db.raw.mock.calls)).not.toContain('state-value-123456')
    expect(await store.consumeState('state-value-123456', T0)).toBe(true)
    const update = db.raw.mock.calls.find((c) => String(c[0]).startsWith('UPDATE'))!
    expect(String(update[0])).toContain('consumed_at IS NULL AND expires_at > ?')
  })
})

describe('BasicAuth', () => {
  it('sends the Basic header from email and password', async () => {
    const h = await new BasicAuth({ email: 'a@b.co', password: 'pw' }).headers()
    expect(h.Authorization).toBe(`Basic ${Buffer.from('a@b.co:pw').toString('base64')}`)
  })
  it('refuses when credentials are missing', async () => {
    await expect(new BasicAuth({ email: '', password: '' }).headers()).rejects.toThrow(SageConfigError)
  })
  it('selected by SAGE_AUTH, default basic; oauth refuses without its settings', () => {
    expect(sageConfigFromEnv({}).authMode).toBe('basic')
    expect(() => sageConfigFromEnv({ SAGE_AUTH: 'saml' })).toThrow(SageConfigError)
    const oauthCfg = sageConfigFromEnv({ SAGE_AUTH: 'oauth' })
    expect(() => sageAuthFromConfig(oauthCfg, { store: () => new MemorySageTokenStore(ENV), env: {} })).toThrow(/SAGE_OAUTH_AUTHORIZE_URL/)
  })
})

describe('OAuth settings', () => {
  it('names every unset variable and never a value', () => {
    expect(() => oauthConfigFromEnv({ SAGE_OAUTH_CLIENT_SECRET: 'abc' })).toThrow(
      'Sage OAuth is not configured: SAGE_OAUTH_AUTHORIZE_URL, SAGE_OAUTH_TOKEN_URL, SAGE_OAUTH_CLIENT_ID not set',
    )
  })
  it('uses the callback address already given to Sage by default', () => {
    const c = oauthConfigFromEnv({
      SAGE_OAUTH_AUTHORIZE_URL: 'https://a', SAGE_OAUTH_TOKEN_URL: 'https://t', SAGE_OAUTH_CLIENT_ID: 'i', SAGE_OAUTH_CLIENT_SECRET: 's',
    })
    expect(c.redirectUri).toBe('https://suzanneravenall.com/api/sage/oauth/callback')
  })
})

describe('OAuth2Auth', () => {
  function setup(fetchImpl: (u: string, i?: RequestInit) => Promise<Response>, now = { t: T0 }) {
    const store = new MemorySageTokenStore(ENV)
    const auth = new OAuth2Auth(CONFIG, store, { fetchImpl, now: () => now.t })
    return { store, auth, now }
  }

  it('builds the authorize URL with the state', () => {
    const { auth } = setup(vi.fn())
    const url = new URL(auth.buildAuthorizeUrl('STATE-1'))
    expect(url.origin + url.pathname).toBe('https://sage.test/authorize')
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      response_type: 'code', client_id: 'client-1', state: 'STATE-1', redirect_uri: CONFIG.redirectUri, scope: 'full_access',
    })
    expect(url.search).not.toContain('shh-secret')
  })

  it('exchanges the code and stores the tokens with their expiry', async () => {
    const fetchImpl = vi.fn(async () => tokenAnswer())
    const { auth, store } = setup(fetchImpl)
    await auth.exchangeCode('CODE-1')
    const body = new URLSearchParams(String((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body))
    expect(Object.fromEntries(body)).toMatchObject({ grant_type: 'authorization_code', code: 'CODE-1', client_secret: 'shh-secret' })
    expect(store.tokens).toEqual({ accessToken: 'AT-1', refreshToken: 'RT-1', expiresAt: new Date(T0.getTime() + 3600_000), scope: null })
  })

  it('uses the stored token while it has more than 60 s left', async () => {
    const fetchImpl = vi.fn()
    const { auth, store } = setup(fetchImpl)
    store.tokens = { accessToken: 'AT-OLD', refreshToken: 'RT', expiresAt: new Date(T0.getTime() + TOKEN_MARGIN_MS + 1000), scope: null }
    expect((await auth.headers()).Authorization).toBe('Bearer AT-OLD')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('refreshes inside the 60 s margin, keeps a refresh token the answer omits, and refreshes once for concurrent calls', async () => {
    const fetchImpl = vi.fn(async () => tokenAnswer({ access_token: 'AT-NEW', refresh_token: undefined }))
    const { auth, store } = setup(fetchImpl)
    store.tokens = { accessToken: 'AT-OLD', refreshToken: 'RT-OLD', expiresAt: new Date(T0.getTime() + TOKEN_MARGIN_MS - 1000), scope: 'full_access' }
    const [a, b] = await Promise.all([auth.headers(), auth.headers()])
    expect(a.Authorization).toBe('Bearer AT-NEW')
    expect(b.Authorization).toBe('Bearer AT-NEW')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const body = new URLSearchParams(String((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body))
    expect(body.get('grant_type')).toBe('refresh_token')
    expect(body.get('refresh_token')).toBe('RT-OLD')
    expect(store.tokens?.refreshToken).toBe('RT-OLD')
    expect(store.tokens?.scope).toBe('full_access')
  })

  it('says to connect again when Sage refuses the refresh (revoked or expired refresh token)', async () => {
    const { auth, store } = setup(vi.fn(async () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 })))
    store.tokens = { accessToken: 'A', refreshToken: 'R', expiresAt: T0, scope: null }
    await expect(auth.headers()).rejects.toThrow(/connect Sage again/)
  })

  it('treats a token endpoint 5xx as retriable and does not put the answer body in the error', async () => {
    const { auth } = setup(vi.fn(async () => new Response('{"error":"boom","access_token":"LEAK"}', { status: 503 })))
    const err = await auth.exchangeCode('c').catch((e: unknown) => e as Error & { retriable: boolean })
    expect((err as { retriable: boolean }).retriable).toBe(true)
    expect(String((err as Error).message)).not.toContain('LEAK')
  })

  it('refuses when not connected yet', async () => {
    const { auth } = setup(vi.fn())
    await expect(auth.headers()).rejects.toThrow(/not connected/)
  })

  it('refuses to store tokens without SAGE_TOKEN_ENCRYPTION_KEY', async () => {
    const auth = new OAuth2Auth(CONFIG, new MemorySageTokenStore({}), { fetchImpl: vi.fn(async () => tokenAnswer()) })
    await expect(auth.exchangeCode('c')).rejects.toThrow(/SAGE_TOKEN_ENCRYPTION_KEY/)
  })
})

describe('connect flow', () => {
  it('start stores a state that works once; a replay or an unknown state never reaches the token endpoint', async () => {
    const fetchImpl = vi.fn(async () => tokenAnswer())
    const store = new MemorySageTokenStore(ENV)
    const auth = new OAuth2Auth(CONFIG, store, { fetchImpl, now: () => T0 })
    const { url, expiresAt } = await startConnect({ auth, store, now: () => T0 })
    expect(expiresAt.getTime() - T0.getTime()).toBe(10 * 60_000)
    const state = new URL(url).searchParams.get('state')!
    expect(state.length).toBeGreaterThanOrEqual(32)

    await completeConnect({ auth, store, now: () => T0 }, { code: 'C', state })
    expect(store.tokens?.accessToken).toBe('AT-1')
    await expect(completeConnect({ auth, store, now: () => T0 }, { code: 'C', state })).rejects.toThrow(OAuthStateError)
    await expect(completeConnect({ auth, store, now: () => T0 }, { code: 'C', state: 'never-issued-state-value' })).rejects.toThrow(OAuthStateError)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('an expired state is refused', async () => {
    const store = new MemorySageTokenStore(ENV)
    const auth = new OAuth2Auth(CONFIG, store, { fetchImpl: vi.fn(), now: () => T0 })
    const { url } = await startConnect({ auth, store, now: () => T0 })
    const state = new URL(url).searchParams.get('state')!
    const later = new Date(T0.getTime() + 10 * 60_000 + 1)
    await expect(completeConnect({ auth, store, now: () => later }, { code: 'C', state })).rejects.toThrow(OAuthStateError)
  })
})
