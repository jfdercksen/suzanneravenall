// @vitest-environment node
import { createHash } from 'node:crypto'
import { describe, it, expect, vi } from 'vitest'
import { VtigerClient, VtigerError, vtqlString } from './vtiger'
import { makeFakeVtiger } from './test-utils'

const noSleep = () => Promise.resolve()

function client(fake: ReturnType<typeof makeFakeVtiger>, extra: Partial<ConstructorParameters<typeof VtigerClient>[0]> = {}) {
  return new VtigerClient({
    url: 'https://crm.test/',
    username: 'webservice',
    accessKey: 'KEY',
    fetchImpl: fake.fetchImpl,
    sleep: noSleep,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    ...extra,
  })
}

describe('VtigerClient login', () => {
  it('logs in with getchallenge then md5(token + accessKey), as username', async () => {
    const fake = makeFakeVtiger({ token: 'abc' })
    const userId = await client(fake).userId()

    expect(userId).toBe('19x1')
    expect(fake.ops()).toEqual(['getchallenge', 'login'])
    expect(fake.calls[0]).toMatchObject({ method: 'GET', params: { username: 'webservice' } })
    const login = fake.calls[1]!
    expect(login.method).toBe('POST')
    expect(login.params.username).toBe('webservice')
    expect(login.params.accessKey).toBe(createHash('md5').update('abcKEY').digest('hex'))
  })

  it('calls /webservice.php on the configured URL (trailing slash stripped)', async () => {
    const urls: string[] = []
    const fake = makeFakeVtiger()
    const c = client(fake, {
      fetchImpl: (u, i) => {
        urls.push(u)
        return fake.fetchImpl(u, i)
      },
    })
    await c.userId()
    expect(urls[0]).toMatch(/^https:\/\/crm\.test\/webservice\.php\?/)
  })

  it('caches the session across calls', async () => {
    const fake = makeFakeVtiger()
    const c = client(fake)
    await c.query("SELECT * FROM Contacts WHERE email='a@b.co'")
    await c.query("SELECT * FROM Contacts WHERE email='c@d.co'")
    expect(fake.ops()).toEqual(['getchallenge', 'login', 'query', 'query'])
  })

  it('shares one login between concurrent callers', async () => {
    const fake = makeFakeVtiger()
    const c = client(fake)
    await Promise.all([c.userId(), c.userId(), c.userId()])
    expect(fake.ops().filter((o) => o === 'login')).toHaveLength(1)
  })

  it('logs in again when the cached session expires (TTL)', async () => {
    let now = 1_000
    const fake = makeFakeVtiger()
    const c = client(fake, { now: () => now, sessionTtlMs: 60_000 })
    await c.userId()
    now += 61_000
    await c.userId()
    expect(fake.ops().filter((o) => o === 'login')).toHaveLength(2)
  })

  it('logs in again once on INVALID_SESSIONID and repeats the call', async () => {
    const fake = makeFakeVtiger()
    const c = client(fake)
    await c.userId()
    fake.expireSessions()
    const rows = await c.query("SELECT * FROM Contacts WHERE email='x@y.co'")
    expect(rows).toEqual([])
    expect(fake.ops()).toEqual(['getchallenge', 'login', 'query', 'getchallenge', 'login', 'query'])
  })

  it('throws VtigerError when login is refused', async () => {
    const fake = makeFakeVtiger({
      failures: {
        login: [new Response(JSON.stringify({ success: false, error: { code: 'INVALID_USER_CREDENTIALS', message: 'Invalid' } }))],
      },
    })
    const err = (await client(fake).userId().catch((e) => e)) as VtigerError
    expect(err).toBeInstanceOf(VtigerError)
    expect(err.code).toBe('INVALID_USER_CREDENTIALS')
  })
})

describe('VtigerClient retries and timeouts', () => {
  it('retries a 503 and a network error, then succeeds', async () => {
    const fake = makeFakeVtiger({
      failures: { getchallenge: [new Response('', { status: 503 }), new TypeError('fetch failed')] },
    })
    const userId = await client(fake, { retries: 3 }).userId()
    expect(userId).toBe('19x1')
    expect(fake.ops()).toEqual(['getchallenge', 'getchallenge', 'getchallenge', 'login'])
  })

  it('gives up after the configured retries', async () => {
    const fake = makeFakeVtiger({
      failures: { getchallenge: [new Response('', { status: 500 }), new Response('', { status: 500 }), new Response('', { status: 500 })] },
    })
    const err = (await client(fake, { retries: 2 }).userId().catch((e) => e)) as Error
    expect(err.message).toContain('HTTP 500')
    expect(fake.ops()).toEqual(['getchallenge', 'getchallenge', 'getchallenge'])
  })

  it('does not retry a WAF-style 403 and reports it', async () => {
    const fake = makeFakeVtiger({ failures: { getchallenge: [new Response('<html>Forbidden</html>', { status: 403 })] } })
    const err = (await client(fake).userId().catch((e) => e)) as VtigerError
    expect(err).toBeInstanceOf(VtigerError)
    expect(err.status).toBe(403)
    expect(fake.ops()).toEqual(['getchallenge'])
  })

  it('passes an abort signal to every request (timeout)', async () => {
    const seen: Array<AbortSignal | null | undefined> = []
    const fake = makeFakeVtiger()
    await client(fake, {
      fetchImpl: (u, i) => {
        seen.push(i?.signal)
        return fake.fetchImpl(u, i)
      },
    }).userId()
    expect(seen.every((s) => s instanceof AbortSignal)).toBe(true)
  })
})

describe('VtigerClient operations', () => {
  it('appends the trailing semicolon to queries (KI054 a)', async () => {
    const fake = makeFakeVtiger()
    await client(fake).query("SELECT * FROM Contacts WHERE email='a@b.co' LIMIT 1")
    expect(fake.calls.at(-1)?.params.query).toBe("SELECT * FROM Contacts WHERE email='a@b.co' LIMIT 1;")
  })

  it('create sends elementType and the JSON element as a form POST', async () => {
    const fake = makeFakeVtiger()
    const rec = await client(fake).create('Contacts', { lastname: 'X', email: 'x@y.co' })
    expect(rec.id).toMatch(/^12x/)
    const call = fake.calls.at(-1)!
    expect(call.method).toBe('POST')
    expect(call.params.elementType).toBe('Contacts')
    expect(JSON.parse(call.params.element!)).toEqual({ lastname: 'X', email: 'x@y.co' })
  })

  it('revise sends only the given fields', async () => {
    const fake = makeFakeVtiger({ contacts: [{ id: '12x1', email: 'a@b.co', lastname: 'A', mobile: '082' }] })
    const rec = await client(fake).revise({ id: '12x1', leadsource: 'Lead Magnet' })
    expect(JSON.parse(fake.calls.at(-1)!.params.element!)).toEqual({ id: '12x1', leadsource: 'Lead Magnet' })
    expect(rec.mobile).toBe('082')
  })

  it('escapes quotes and backslashes in VTQL strings', () => {
    expect(vtqlString("o'brien@x.co")).toBe("o\\'brien@x.co")
    expect(vtqlString('a\\b')).toBe('a\\\\b')
  })
})

describe('VtigerClient dry run', () => {
  it('makes no network call at all and returns fake ids', async () => {
    const fetchImpl = vi.fn()
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const c = new VtigerClient({ url: 'https://crm.test', username: 'u', accessKey: 'k', dryRun: true, fetchImpl, logger })

    expect(await c.query("SELECT * FROM Contacts WHERE email='a@b.co';")).toEqual([])
    const rec = await c.create('Contacts', { email: 'jane@example.com', lastname: 'J' })
    const rev = await c.revise({ id: '12x9', leadsource: 'Lead Magnet' })

    expect(fetchImpl).not.toHaveBeenCalled()
    expect(rec.id).toMatch(/^dryrun-Contacts-\d+$/)
    expect(rev.id).toBe('12x9')
    const logged = logger.info.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('[vtiger:dry-run] create Contacts')
    expect(logged).toContain('j***@example.com')
    expect(logged).not.toContain('jane@example.com')
  })

  it('fromEnv: AUTOMATION_DRY_RUN=true works without Vtiger env vars', () => {
    const c = VtigerClient.fromEnv({ AUTOMATION_DRY_RUN: 'true' })
    expect(c.dryRun).toBe(true)
  })

  it('fromEnv: throws NOT_CONFIGURED without Vtiger env vars outside dry run', () => {
    expect(() => VtigerClient.fromEnv({})).toThrowError(/not configured/)
  })

  it('fromEnv: reads the three Vtiger env vars', () => {
    const c = VtigerClient.fromEnv({ VTIGER_URL: 'https://crm.test/', VTIGER_USERNAME: 'u', VTIGER_ACCESS_KEY: 'k' })
    expect(c.dryRun).toBe(false)
  })
})
