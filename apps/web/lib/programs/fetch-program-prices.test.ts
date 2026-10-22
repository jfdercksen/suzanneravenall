import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Program } from '@/data/programs'
import { getProgramPriceTexts, getVariantsByHandle } from './fetch-program-prices'
import { PRICE_ON_REQUEST } from './program-prices'

const logWarn = vi.fn()
vi.mock('@/lib/log', () => ({ logWarn: (...args: unknown[]) => logWarn(...args) }))

const fetchMock = vi.fn()

function program(slug: string, shopHandle: string | undefined, priceZar: number): Program {
  return {
    slug,
    shopHandle,
    priceZar,
    image: '/x.jpg',
    name: slug,
    category: 'group',
    shortDescription: '',
    description: '',
    features: [],
    isPublished: true,
    isFeatured: false,
  }
}

function medusaAnswer(products: unknown[]) {
  return { ok: true, json: async () => ({ products }) }
}

beforeEach(() => {
  vi.stubEnv('MEDUSA_BACKEND_URL', 'http://medusa:9000')
  vi.stubEnv('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY', 'pk_test')
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  logWarn.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('getVariantsByHandle', () => {
  it('reads every handle in one store request and keys the variants by handle', async () => {
    fetchMock.mockResolvedValue(
      medusaAnswer([{ handle: 'a', variants: [{ id: 'v1', title: 'Self Study', prices: [{ currency_code: 'usd', amount: 22000 }] }] }]),
    )
    const result = await getVariantsByHandle(['a', 'b', 'a', ''])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(url.origin + url.pathname).toBe('http://medusa:9000/store/products')
    expect(url.searchParams.getAll('handle[]')).toEqual(['a', 'b'])
    expect(result?.get('a')?.[0]?.prices).toEqual([{ currency_code: 'usd', amount: 22000 }])
    expect(result?.has('b')).toBe(false)
  })

  it('returns null when Medusa answers with an error', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) })
    expect(await getVariantsByHandle(['a'])).toBeNull()
  })

  it('returns null when Medusa cannot be reached', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'))
    expect(await getVariantsByHandle(['a'])).toBeNull()
    expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('unreachable'), expect.any(Error))
  })

  it('makes no request without a handle', async () => {
    expect(await getVariantsByHandle([])).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('getProgramPriceTexts', () => {
  it('maps each programme to its product by handle, "Price on request" where it has none', async () => {
    fetchMock.mockResolvedValue(
      medusaAnswer([
        {
          handle: 'money',
          variants: [{ id: 'v', title: 'Live', prices: [{ currency_code: 'zar', amount: 150000 }, { currency_code: 'usd', amount: 30000 }] }],
        },
      ]),
    )
    const texts = await getProgramPriceTexts([program('money-mastery', 'money', 1500), program('fix-others', undefined, 1500)])
    expect(texts['money-mastery']).toMatchObject({ zar: 'R1,500', usd: '$300' })
    expect(texts['fix-others']).toMatchObject({ zar: 'R1,500', usd: PRICE_ON_REQUEST })
    expect(logWarn).not.toHaveBeenCalled()
  })

  it('warns when Medusa answers but no variant carries the programme rand price', async () => {
    fetchMock.mockResolvedValue(
      medusaAnswer([{ handle: 'money', variants: [{ id: 'v', title: 'Live', prices: [{ currency_code: 'zar', amount: 199900 }] }] }]),
    )
    const texts = await getProgramPriceTexts([program('money-mastery', 'money', 1500)])
    expect(texts['money-mastery']?.usd).toBe(PRICE_ON_REQUEST)
    expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('No Medusa dollar price'), undefined, expect.objectContaining({ slug: 'money-mastery' }))
  })

  it('keeps the rand prices when Medusa is down', async () => {
    fetchMock.mockRejectedValue(new Error('down'))
    const texts = await getProgramPriceTexts([program('money-mastery', 'money', 1500)])
    expect(texts['money-mastery']).toMatchObject({ zar: 'R1,500', usd: PRICE_ON_REQUEST })
  })
})
