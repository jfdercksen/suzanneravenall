import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { ADDON_HANDLES, fetchAddOnProducts, isAddOnHandle } from './addons'

const product = (handle: string) => ({
  id: `prod_${handle}`,
  handle,
  title: handle,
  description: null,
  thumbnail: null,
  metadata: null,
  variants: [{ id: `v_${handle}`, title: 'Per month', prices: [{ currency_code: 'zar', amount: 20000 }] }],
  categories: [],
  collection: null,
})

const json = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response

describe('shop add-ons (17 Nov)', () => {
  beforeEach(() => vi.stubEnv('MEDUSA_BACKEND_URL', 'http://medusa.test'))
  afterEach(() => vi.unstubAllEnvs())

  it('knows the five add-on products and nothing else', () => {
    expect(ADDON_HANDLES).toHaveLength(5)
    expect(isAddOnHandle('bonus-lifetime-access-self-study-online')).toBe(true)
    expect(isAddOnHandle('email-support')).toBe(true)
    expect(isAddOnHandle('getting-unstuck-self-study')).toBe(false)
    expect(isAddOnHandle(null)).toBe(false)
  })

  it('asks the store for the five handles in one call and keeps the section order', async () => {
    const fetchImpl = vi.fn(async () =>
      json({ products: [product('vip-package'), product('email-support'), product('bonus-lifetime-access-self-study-online')] }),
    )
    const list = await fetchAddOnProducts(fetchImpl as unknown as typeof fetch)
    expect(list.map((p) => p.handle)).toEqual(['bonus-lifetime-access-self-study-online', 'email-support', 'vip-package'])
    const url = new URL(String((fetchImpl.mock.calls[0] as unknown[])[0]))
    expect(url.origin + url.pathname).toBe('http://medusa.test/store/products')
    expect(url.searchParams.getAll('handle[]')).toEqual([...ADDON_HANDLES])
  })

  it('gives an empty list when the store fails, so the section hides', async () => {
    expect(await fetchAddOnProducts((async () => json({}, false)) as unknown as typeof fetch)).toEqual([])
    expect(await fetchAddOnProducts((async () => { throw new Error('down') }) as unknown as typeof fetch)).toEqual([])
  })

  it('reads nothing without a Medusa URL', async () => {
    vi.stubEnv('MEDUSA_BACKEND_URL', '')
    vi.stubEnv('NEXT_PUBLIC_MEDUSA_URL', '')
    const fetchImpl = vi.fn()
    expect(await fetchAddOnProducts(fetchImpl as unknown as typeof fetch)).toEqual([])
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
