// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { fetchWithRetry, IntegrationError } from './http'

const noSleep = () => Promise.resolve()

describe('fetchWithRetry', () => {
  it('returns the first 2xx response without retrying', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))
    const res = await fetchWithRetry('http://x', {}, { fetchImpl, sleep: noSleep })
    expect(res.status).toBe(200)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('retries 5xx and 429, then succeeds', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))
    const sleep = vi.fn((_ms: number) => Promise.resolve())
    const res = await fetchWithRetry('http://x', {}, { fetchImpl, sleep, retries: 3, baseDelayMs: 100 })
    expect(res.status).toBe(200)
    expect(fetchImpl).toHaveBeenCalledTimes(3)
    // Exponential backoff: 100ms then 200ms, each plus up to 50% jitter.
    const [first, second] = sleep.mock.calls.map((c) => c[0])
    expect(first).toBeGreaterThanOrEqual(100)
    expect(first).toBeLessThan(150)
    expect(second).toBeGreaterThanOrEqual(200)
    expect(second).toBeLessThan(300)
  })

  it('retries network errors and throws a retriable IntegrationError when all attempts fail', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('fetch failed'))
    const err = await fetchWithRetry('http://x', {}, { fetchImpl, sleep: noSleep, retries: 2, system: 'vtiger' }).catch(
      (e: unknown) => e,
    )
    expect(err).toBeInstanceOf(IntegrationError)
    expect((err as IntegrationError).code).toBe('NETWORK')
    expect((err as IntegrationError).retriable).toBe(true)
    expect((err as IntegrationError).system).toBe('vtiger')
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('reports timeouts as TIMEOUT', async () => {
    const timeout = Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' })
    const fetchImpl = vi.fn().mockRejectedValue(timeout)
    const err = (await fetchWithRetry('http://x', {}, { fetchImpl, sleep: noSleep, retries: 1 }).catch((e) => e)) as IntegrationError
    expect(err.code).toBe('TIMEOUT')
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('does not retry a plain 4xx', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('forbidden', { status: 403 }))
    const res = await fetchWithRetry('http://x', {}, { fetchImpl, sleep: noSleep })
    expect(res.status).toBe(403)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('gives every attempt its own abort signal (per-attempt timeout)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('ok'))
    await fetchWithRetry('http://x', { method: 'POST' }, { fetchImpl, timeoutMs: 1234 })
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.signal).toBeDefined()
  })

  it('stops retrying once the outer budget signal is aborted', async () => {
    const ctrl = new AbortController()
    const fetchImpl = vi.fn().mockImplementation(async () => {
      ctrl.abort()
      return new Response('', { status: 502 })
    })
    const err = (await fetchWithRetry('http://x', {}, { fetchImpl, sleep: noSleep, retries: 5, signal: ctrl.signal }).catch(
      (e) => e,
    )) as IntegrationError
    expect(err.code).toBe('ABORTED')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
