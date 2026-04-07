import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/server before importing the route
const mockJson = vi.fn()

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => {
      mockJson(body, init)
      return { body, init }
    },
  },
}))

import { GET } from './route'

describe('GET /api/health', () => {
  beforeEach(() => {
    mockJson.mockClear()
  })

  it('returns HTTP 200', async () => {
    const response = await GET()
    expect(mockJson).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 200 })
    )
  })

  it('returns { status: "ok" } in the JSON body', async () => {
    const response = await GET()
    expect(mockJson).toHaveBeenCalledWith(
      { status: 'ok' },
      expect.anything()
    )
  })

  it('returns both status ok and HTTP 200 in a single call', async () => {
    await GET()
    expect(mockJson).toHaveBeenCalledTimes(1)
    expect(mockJson).toHaveBeenCalledWith({ status: 'ok' }, { status: 200 })
  })
})

describe('HTTP method exports', () => {
  it('exports a GET handler', async () => {
    const routeModule = await import('./route')
    expect(typeof routeModule.GET).toBe('function')
  })

  it('does not export a POST handler', async () => {
    const routeModule = await import('./route')
    expect((routeModule as Record<string, unknown>).POST).toBeUndefined()
  })

  it('does not export a PUT handler', async () => {
    const routeModule = await import('./route')
    expect((routeModule as Record<string, unknown>).PUT).toBeUndefined()
  })

  it('does not export a DELETE handler', async () => {
    const routeModule = await import('./route')
    expect((routeModule as Record<string, unknown>).DELETE).toBeUndefined()
  })
})
