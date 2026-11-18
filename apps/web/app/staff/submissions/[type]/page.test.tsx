import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { StaffAccess } from '@/lib/staff/payload-session'

const { mockAccess, mockClient, calls, state } = vi.hoisted(() => {
  const calls: { table: string; method: string; args: unknown[] }[] = []
  const state: { rows: unknown[] } = { rows: [] }
  const from = (table: string) => {
    const builder: Record<string, unknown> = {}
    for (const method of ['select', 'eq', 'or', 'order', 'range']) {
      builder[method] = (...args: unknown[]) => {
        calls.push({ table, method, args })
        return builder
      }
    }
    builder.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: state.rows, error: null, count: state.rows.length }).then(resolve)
    builder.insert = (row: unknown) => {
      calls.push({ table, method: 'insert', args: [row] })
      return Promise.resolve({ error: null })
    }
    return builder
  }
  return { mockAccess: vi.fn<() => Promise<StaffAccess>>(), mockClient: vi.fn(() => ({ from })), calls, state }
})

vi.mock('@/lib/staff/current', () => ({ currentStaffAccess: mockAccess }))
vi.mock('@/lib/quiz/subscriber', () => ({ getServiceRoleClient: mockClient }))
vi.mock('@/lib/log', () => ({ logError: vi.fn() }))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))
vi.mock('@/app/explore/quizzes', () => ({
  quizBySlug: (slug: string) => (slug === 'nervous-system' ? { title: 'Nervous System Pattern' } : undefined),
}))

import StaffSubmissionsList from './page'

const ID = '6f1c2a4e-1b2c-4d3e-8f90-123456789abc'
const STAFF = { id: '7', email: 'team@ravenallinstitute.com', name: null, role: 'staff' }

async function show(type: string, q?: string) {
  render(await StaffSubmissionsList({ params: Promise.resolve({ type }), searchParams: Promise.resolve({ q }) }))
}

describe('/staff/submissions/<type> list (KI125)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    calls.length = 0
    state.rows = [
      {
        id: ID,
        quiz_slug: 'nervous-system',
        first_name: 'Jane',
        last_name: 'Client',
        email: 'jane@example.com',
        completed_at: '2026-11-18T12:05:00Z',
      },
    ]
  })

  it('shows a non-staff visitor no names and reads nothing', async () => {
    mockAccess.mockResolvedValue({ status: 'forbidden', viewer: { ...STAFF, role: 'editor' } })
    await show('quiz')
    expect(screen.queryByText('Jane Client')).not.toBeInTheDocument()
    expect(mockClient).not.toHaveBeenCalled()
  })

  it('lists completed submissions for staff, linking each to its page, with the search applied', async () => {
    mockAccess.mockResolvedValue({ status: 'allowed', viewer: STAFF })
    await show('quiz', 'jane')
    expect(screen.getByRole('link', { name: /Jane Client/ })).toHaveAttribute('href', `/staff/submissions/quiz/${ID}`)
    expect(screen.getByText(/Nervous System Pattern/)).toBeInTheDocument()
    expect(calls.some((c) => c.method === 'or' && String(c.args[0]).includes('%jane%'))).toBe(true)
    // Listing shows no answers, so it writes no access-log row.
    expect(calls.some((c) => c.method === 'insert')).toBe(false)
    expect(screen.getByRole('link', { name: 'Intake forms' })).toHaveAttribute('href', '/staff/submissions/intake')
  })

  it('answers not found for any other type', async () => {
    mockAccess.mockResolvedValue({ status: 'allowed', viewer: STAFF })
    await expect(show('leads')).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
