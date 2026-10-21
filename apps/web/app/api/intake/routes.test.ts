import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/log', () => ({ logError: vi.fn(), logWarn: vi.fn() }))
vi.mock('@/lib/intake/service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/intake/service')>()
  return {
    ...actual,
    submitIntake: vi.fn(),
    createIntakesForOrder: vi.fn(),
    runIntakeReminders: vi.fn(),
    cancelIntakesForOrder: vi.fn(),
  }
})

import { POST as submit } from './submit/route'
import { POST as orders } from './orders/route'
import { POST as reminders } from './reminders/route'
import { POST as cancel } from './cancel/route'
import { cancelIntakesForOrder, createIntakesForOrder, runIntakeReminders, submitIntake } from '@/lib/intake/service'
import { IntakeStoreError } from '@/lib/intake/store'

const TOKEN = 'a'.repeat(43)
const env = { ...process.env }

function req(path: string, body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.INTERNAL_WEBHOOK_SECRET = 'secret-1'
  process.env.BREVO_API_KEY = 'test'
})
afterEach(() => {
  process.env = { ...env }
})

describe('POST /api/intake/submit', () => {
  it('answers 200 on a completed form', async () => {
    vi.mocked(submitIntake).mockResolvedValue({ status: 'completed' })
    const res = await submit(req('/api/intake/submit', { token: TOKEN, acknowledged: true, answers: { a: { value: 'x' } } }))
    expect(res.status).toBe(200)
    expect(vi.mocked(submitIntake).mock.calls[0]![0]).toBe(TOKEN)
  })

  it('answers 422 with the question errors', async () => {
    vi.mocked(submitIntake).mockResolvedValue({ status: 'invalid', errors: { a: 'This question is required.' } })
    const res = await submit(req('/api/intake/submit', { token: TOKEN, answers: {} }))
    expect(res.status).toBe(422)
    expect((await res.json()).errors.a).toBeDefined()
  })

  it.each([
    ['already_completed', 409],
    ['expired', 410],
    ['not_found', 404],
    ['unavailable', 503],
  ] as const)('answers %s with %i', async (status, code) => {
    vi.mocked(submitIntake).mockResolvedValue({ status })
    expect((await submit(req('/api/intake/submit', { token: TOKEN, answers: {} }))).status).toBe(code)
  })

  it('rejects a malformed token or body before touching the database (Zod)', async () => {
    expect((await submit(req('/api/intake/submit', { token: 'short', answers: {} }))).status).toBe(400)
    expect((await submit(req('/api/intake/submit', { token: TOKEN, answers: { a: { value: 5 } } }))).status).toBe(400)
    expect((await submit(req('/api/intake/submit', 'not json'))).status).toBe(400)
    expect(submitIntake).not.toHaveBeenCalled()
  })

  it('refuses an oversized body', async () => {
    const res = await submit(req('/api/intake/submit', { token: TOKEN, answers: { a: { value: 'x'.repeat(300_000) } } }))
    expect(res.status).toBe(413)
  })

  it('answers 503 when the store throws, without details', async () => {
    vi.mocked(submitIntake).mockRejectedValue(new Error('db down: secret detail'))
    const res = await submit(req('/api/intake/submit', { token: TOKEN, answers: {} }))
    expect(res.status).toBe(503)
    expect(JSON.stringify(await res.json())).not.toContain('secret detail')
  })
})

describe('internal routes need the webhook secret', () => {
  const ORDER = { orderId: 'o1', displayId: 5, email: 'a@b.co', firstName: 'A', lines: [{ handle: 'h', title: 't', session: true }] }

  it('refuses a missing or wrong secret with 401', async () => {
    expect((await orders(req('/api/intake/orders', ORDER))).status).toBe(401)
    expect((await reminders(req('/api/intake/reminders', {}, { 'x-webhook-secret': 'wrong' }))).status).toBe(401)
    expect((await cancel(req('/api/intake/cancel', { orderId: 'o1' }, { 'x-webhook-secret': 'nope' }))).status).toBe(401)
    expect(createIntakesForOrder).not.toHaveBeenCalled()
  })

  it('fails closed with 500 when no secret is configured', async () => {
    delete process.env.INTERNAL_WEBHOOK_SECRET
    delete process.env.N8N_WEBHOOK_SECRET
    expect((await orders(req('/api/intake/orders', ORDER, { 'x-webhook-secret': '' }))).status).toBe(500)
  })

  it('creates the intake records for an order with the right secret', async () => {
    vi.mocked(createIntakesForOrder).mockResolvedValue({ records: [], failed: 0 })
    const res = await orders(req('/api/intake/orders', ORDER, { 'x-webhook-secret': 'secret-1' }))
    expect(res.status).toBe(200)
    expect(vi.mocked(createIntakesForOrder).mock.calls[0]![0]).toMatchObject({ orderId: 'o1', displayId: '5', lastName: null })
  })

  it('answers 500 when an intake mail failed, so Medusa retries', async () => {
    vi.mocked(createIntakesForOrder).mockResolvedValue({ records: [], failed: 1 })
    expect((await orders(req('/api/intake/orders', ORDER, { 'x-webhook-secret': 'secret-1' }))).status).toBe(500)
  })

  it('answers 503 when the table is missing', async () => {
    vi.mocked(runIntakeReminders).mockRejectedValue(new IntakeStoreError('missing', true))
    expect((await reminders(req('/api/intake/reminders', {}, { 'x-webhook-secret': 'secret-1' }))).status).toBe(503)
  })

  it('rejects a bad order body with 422', async () => {
    const res = await orders(req('/api/intake/orders', { ...ORDER, email: 'nope' }, { 'x-webhook-secret': 'secret-1' }))
    expect(res.status).toBe(422)
  })

  it('closes a cancelled order', async () => {
    vi.mocked(cancelIntakesForOrder).mockResolvedValue(2)
    const res = await cancel(req('/api/intake/cancel', { orderId: 'o1' }, { 'x-webhook-secret': 'secret-1' }))
    expect(await res.json()).toEqual({ closed: 2 })
  })
})
