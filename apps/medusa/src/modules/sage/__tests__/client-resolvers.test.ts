import { describe, it, expect, vi } from 'vitest'
import { BasicAuth, type SageAuth } from '../auth'
import { SageClient, odataString } from '../client'
import { sageConfigFromEnv, requireCashCustomerId, requireTaxTypeId } from '../config'
import { SageApiError, SageHold } from '../errors'
import { ItemResolver, resolveCustomerId } from '../resolvers'
import { MemoryCustomerMapStore, MemoryItemCacheStore } from '../store'

const config = sageConfigFromEnv({ SAGE_API_KEY: 'KEY', SAGE_COMPANY_ID: '77', SAGE_API_URL: 'https://sage.test/api/2.0.0/' })
const auth = new BasicAuth({ email: 'a@b.co', password: 'pw' })

// shape to be replaced by a recorded sandbox answer: { TotalResults, ReturnedResults, Results: [...] }
const page = <T,>(results: T[], total = results.length) =>
  new Response(JSON.stringify({ TotalResults: total, ReturnedResults: results.length, Results: results }), { status: 200 })

type Call = { path: string; params: URLSearchParams; method: string; body?: string }
function fake(handler: (c: Call) => Response | Promise<Response>) {
  const calls: Call[] = []
  const fetchImpl = vi.fn(async (input: string, init?: RequestInit) => {
    const u = new URL(input)
    const call = { path: u.pathname.replace('/api/2.0.0', ''), params: u.searchParams, method: init?.method ?? 'GET', body: init?.body as string | undefined }
    calls.push(call)
    return handler(call)
  })
  return { calls, client: new SageClient(config, auth, { fetchImpl }) }
}

describe('SageClient requests', () => {
  it('adds apikey and companyid and the auth header', async () => {
    const f = fake(() => page([]))
    await f.client.findCustomerByEmail('x@y.co')
    expect(f.calls[0].params.get('apikey')).toBe('KEY')
    expect(f.calls[0].params.get('companyid')).toBe('77')
    const headers = (f.client as unknown as { fetchImpl: ReturnType<typeof vi.fn> }).fetchImpl.mock.calls[0][1].headers as Record<string, string>
    expect(headers.Authorization).toMatch(/^Basic /)
  })

  it('turns an error status into SageApiError (4xx permanent, 5xx retriable)', async () => {
    const f4 = fake(() => new Response('bad', { status: 422 }))
    const e4 = await f4.client.saveTaxInvoice({} as never).catch((e: unknown) => e)
    expect(e4).toBeInstanceOf(SageApiError)
    expect((e4 as SageApiError).retriable).toBe(false)
    const f5 = fake(() => new Response('down', { status: 503 }))
    expect(((await f5.client.saveTaxInvoice({} as never).catch((e: unknown) => e)) as SageApiError).retriable).toBe(true)
  })

  it('retries once after a 401 when the auth can refresh', async () => {
    let n = 0
    const refreshing: SageAuth = { headers: async () => ({}), refreshAfterUnauthorized: vi.fn(async () => true) }
    const fetchImpl = vi.fn(async () => (n++ === 0 ? new Response('no', { status: 401 }) : page([])))
    const client = new SageClient(config, refreshing, { fetchImpl })
    await expect(client.findCustomerByEmail('x@y.co')).resolves.toBeNull()
    expect(refreshing.refreshAfterUnauthorized).toHaveBeenCalledTimes(1)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('quotes OData strings', () => {
    expect(odataString("O'Neil")).toBe("'O''Neil'")
  })
})

describe('find by $filter with paging fallback', () => {
  const cust = (id: number, email: string) => ({ ID: id, Name: `C${id}`, Email: email })

  it('uses the $filter and makes one call when Sage supports it', async () => {
    const f = fake(() => page([cust(5, 'Ann@Example.com')]))
    expect((await f.client.findCustomerByEmail('ann@example.com'))?.ID).toBe(5)
    expect(f.calls).toHaveLength(1)
    expect(f.calls[0].params.get('$filter')).toBe("Email eq 'ann@example.com'")
  })

  it('a supported filter with no rows means not found, without paging', async () => {
    const f = fake(() => page([]))
    expect(await f.client.findCustomerByEmail('none@example.com')).toBeNull()
    expect(f.calls).toHaveLength(1)
  })

  it('falls back to paging when Sage rejects the filter (400) and stops at the first match', async () => {
    const f = fake((c) => {
      if (c.params.has('$filter')) return new Response('invalid filter', { status: 400 })
      const skip = Number(c.params.get('$skip'))
      if (skip === 0) return page(Array.from({ length: 100 }, (_, i) => cust(i + 1, `u${i}@x.co`)), 350)
      if (skip === 100) return page([cust(101, 'target@x.co'), ...Array.from({ length: 99 }, (_, i) => cust(102 + i, `v${i}@x.co`))], 350)
      throw new Error('paged past the match')
    })
    expect((await f.client.findCustomerByEmail('Target@X.co'))?.ID).toBe(101)
    expect(f.calls.map((c) => c.params.get('$skip'))).toEqual([null, '0', '100'])
  })

  it('falls back to paging when Sage ignores the filter (unrelated rows come back)', async () => {
    const f = fake((c) => {
      if (c.params.has('$filter')) return page([cust(1, 'other@x.co')], 1)
      return page([cust(1, 'other@x.co'), cust(2, 'target@x.co')], 2)
    })
    expect((await f.client.findCustomerByEmail('target@x.co'))?.ID).toBe(2)
  })

  it('without TotalResults keeps paging while pages come back full and stops on a short page (L1)', async () => {
    const noTotal = (rows: unknown[]) => new Response(JSON.stringify({ Results: rows }), { status: 200 })
    const f = fake((c) => {
      if (c.params.has('$filter')) return new Response('x', { status: 400 })
      const skip = Number(c.params.get('$skip'))
      if (skip === 0) return noTotal(Array.from({ length: 100 }, (_, i) => cust(i + 1, `u${i}@x.co`)))
      if (skip === 100) return noTotal([cust(101, 'a@x.co'), cust(102, 'target@x.co')])
      throw new Error('paged past the short page')
    })
    expect((await f.client.findCustomerByEmail('target@x.co'))?.ID).toBe(102)
    const g = fake((c) => (c.params.has('$filter') ? new Response('x', { status: 400 }) : noTotal([cust(1, 'a@x.co')])))
    expect(await g.client.findCustomerByEmail('b@x.co')).toBeNull()
    expect(g.calls).toHaveLength(2)
  })

  it('returns null at the end of the pages', async () => {
    const f = fake((c) => (c.params.has('$filter') ? new Response('x', { status: 400 }) : page([cust(1, 'a@x.co')], 1)))
    expect(await f.client.findCustomerByEmail('b@x.co')).toBeNull()
  })

  it('does not hide a real failure behind the fallback', async () => {
    const f = fake(() => new Response('server', { status: 500 }))
    await expect(f.client.findCustomerByEmail('a@x.co')).rejects.toBeInstanceOf(SageApiError)
    expect(f.calls).toHaveLength(1)
  })

  it('finds a tax invoice by SR- reference (newest first when paging)', async () => {
    const f = fake((c) => (c.params.has('$filter') ? new Response('x', { status: 400 }) : page([{ ID: 9, DocumentNumber: 'INV0009', Reference: 'sr-00012' }], 1)))
    expect((await f.client.findTaxInvoiceByReference('SR-00012'))?.DocumentNumber).toBe('INV0009')
    expect(f.calls[1].params.get('$orderby')).toBe('ID desc')
    expect(f.calls[0].params.get('$filter')).toBe("Reference eq 'SR-00012'")
  })

  it('finds an item by code', async () => {
    const f = fake(() => page([{ ID: 31, Code: 'COURSE-1' }]))
    expect((await f.client.findItemByCode('course-1'))?.ID).toBe(31)
  })

  it('posts a customer with a lower-case email', async () => {
    const f = fake(() => new Response(JSON.stringify({ ID: 12, Name: 'N' }), { status: 200 }))
    await f.client.createCustomer('Ann Lee', 'Ann@Example.com')
    expect(f.calls[0].method).toBe('POST')
    expect(JSON.parse(f.calls[0].body!)).toMatchObject({ ID: 0, Name: 'Ann Lee', Email: 'ann@example.com' })
  })
})

describe('settings guards', () => {
  it('tax type must be set and numeric', () => {
    expect(() => requireTaxTypeId(sageConfigFromEnv({}))).toThrow(/will not guess/)
    expect(() => sageConfigFromEnv({ SAGE_TAX_TYPE_ID: 'abc' })).toThrow(/whole number/)
    expect(requireTaxTypeId(sageConfigFromEnv({ SAGE_TAX_TYPE_ID: '4' }))).toBe(4)
  })
  it('cash mode needs its customer', () => {
    expect(() => requireCashCustomerId(sageConfigFromEnv({ SAGE_CUSTOMER_MODE: 'cash' }))).toThrow(/SAGE_CASH_CUSTOMER_ID/)
    expect(requireCashCustomerId(sageConfigFromEnv({}))).toBeNull()
    expect(() => sageConfigFromEnv({ SAGE_CUSTOMER_MODE: 'weird' })).toThrow()
  })
})

describe('resolveCustomerId', () => {
  const found = { ID: 40, Name: 'Ann' }
  const mk = () => ({
    client: { findCustomerByEmail: vi.fn(async () => null as typeof found | null), createCustomer: vi.fn(async () => ({ ID: 41, Name: 'Ann' })) },
    map: new MemoryCustomerMapStore(),
  })

  it('map first: a known buyer never touches Sage', async () => {
    const d = mk()
    await d.map.put('Ann@Example.com', 7)
    expect(await resolveCustomerId({ ...d, config, email: 'ann@example.com', name: 'Ann' })).toBe(7)
    expect(d.client.findCustomerByEmail).not.toHaveBeenCalled()
  })

  it('on a miss searches once, uses the Sage customer and remembers it', async () => {
    const d = mk()
    d.client.findCustomerByEmail.mockResolvedValue(found)
    expect(await resolveCustomerId({ ...d, config, email: 'Ann@Example.com', name: 'Ann' })).toBe(40)
    expect(await resolveCustomerId({ ...d, config, email: 'ann@example.com', name: 'Ann' })).toBe(40)
    expect(d.client.findCustomerByEmail).toHaveBeenCalledTimes(1)
    expect(d.client.createCustomer).not.toHaveBeenCalled()
  })

  it('creates the customer when Sage has none, then stores it', async () => {
    const d = mk()
    expect(await resolveCustomerId({ ...d, config, email: 'new@x.co', name: 'New Buyer' })).toBe(41)
    expect(d.client.createCustomer).toHaveBeenCalledWith('New Buyer', 'new@x.co')
    expect(await d.map.get('new@x.co')).toBe(41)
  })

  it('cash mode uses the cash customer and no lookup', async () => {
    const d = mk()
    const cash = sageConfigFromEnv({ SAGE_CUSTOMER_MODE: 'cash', SAGE_CASH_CUSTOMER_ID: '99' })
    expect(await resolveCustomerId({ ...d, config: cash, email: '', name: '' })).toBe(99)
    expect(d.client.findCustomerByEmail).not.toHaveBeenCalled()
  })

  it('cash mode without the id refuses; per_customer without an email holds', async () => {
    const d = mk()
    await expect(resolveCustomerId({ ...d, config: sageConfigFromEnv({ SAGE_CUSTOMER_MODE: 'cash' }), email: 'a@b.co', name: '' })).rejects.toBeInstanceOf(SageHold)
    await expect(resolveCustomerId({ ...d, config, email: ' ', name: '' })).rejects.toBeInstanceOf(SageHold)
  })
})

describe('ItemResolver', () => {
  it('asks Sage once per code, then uses memory and the cache table; unknown codes are not cached', async () => {
    const client = { findItemByCode: vi.fn(async (code: string) => (code === 'A' ? { ID: 1, Code: 'A' } : null)) }
    const store = new MemoryItemCacheStore()
    const r = new ItemResolver(client, store)
    expect(await r.resolve(['A', 'B', 'A'])).toEqual({ A: 1, B: null })
    expect(await r.resolve(['A', 'B'])).toEqual({ A: 1, B: null })
    expect(client.findItemByCode.mock.calls.map((c) => c[0])).toEqual(['A', 'B', 'B'])
    expect(store.map.get('A')).toBe(1)
    // a fresh process (empty memory) reads the table, not Sage
    const r2 = new ItemResolver(client, store)
    await r2.resolve(['A'])
    expect(client.findItemByCode).toHaveBeenCalledTimes(3)
  })
})
