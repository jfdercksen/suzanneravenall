import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { StaffAccess } from '@/lib/staff/payload-session'

const { mockAccess, mockClient, mockLogError, calls, state } = vi.hoisted(() => {
  const calls: { table: string; method: string; args: unknown[] }[] = []
  const state: { row: unknown; insertError: { message: string } | null } = { row: null, insertError: null }
  const from = (table: string) => {
    const builder: Record<string, unknown> = {}
    for (const method of ['select', 'eq']) {
      builder[method] = (...args: unknown[]) => {
        calls.push({ table, method, args })
        return builder
      }
    }
    builder.maybeSingle = () => Promise.resolve({ data: state.row, error: null })
    builder.insert = (row: unknown) => {
      calls.push({ table, method: 'insert', args: [row] })
      return Promise.resolve({ error: state.insertError })
    }
    return builder
  }
  return {
    mockAccess: vi.fn<() => Promise<StaffAccess>>(),
    mockClient: vi.fn(() => ({ from })),
    mockLogError: vi.fn(),
    calls,
    state,
  }
})

vi.mock('@/lib/staff/current', () => ({ currentStaffAccess: mockAccess }))
vi.mock('@/lib/quiz/subscriber', () => ({ getServiceRoleClient: mockClient }))
vi.mock('@/lib/log', () => ({ logError: mockLogError }))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))
vi.mock('@/app/explore/quizzes', () => ({
  quizBySlug: (slug: string) =>
    slug === 'nervous-system'
      ? {
          title: 'Nervous System Pattern',
          questions: [
            { id: 1, text: 'I feel on edge', category: 'fight' },
            { id: 2, text: 'I overthink', category: 'flight' },
          ],
          results: { fight: { title: 'The Hyper-Alert Achiever', subtitle: 'Your Pattern' } },
        }
      : undefined,
}))

import StaffSubmissionDetail from './page'

const ID = '6f1c2a4e-1b2c-4d3e-8f90-123456789abc'
const STAFF = { id: '7', email: 'team@ravenallinstitute.com', name: 'Team Member', role: 'staff' }

const QUIZ_ROW = {
  id: ID,
  quiz_slug: 'nervous-system',
  first_name: 'Jane',
  last_name: 'Client',
  email: 'jane@example.com',
  answers: { '1': 4, '2': 1 },
  result_key: 'fight',
  completed_at: '2026-11-18T12:05:00Z',
  consented_at: '2026-11-18T12:00:00Z',
  consent_form_version: 'quiz-consent-interim-2026-11-18-pending-RI-F-POPIA-09-part-B',
  marketing_opt_in: true,
  marketing_channels: ['email', 'whatsapp'],
  marketing_choice_at: '2026-11-18T11:58:00Z',
  marketing_form_version: 'marketing-opt-in-v1-2026-11-18',
}

const INTAKE_ROW = {
  id: ID,
  order_id: 'order_01',
  order_display_id: '512',
  customer_email: 'jane@example.com',
  first_name: 'Jane',
  last_name: 'Client',
  service_name: 'Rapid Repatterning Session',
  form_key: 'standard',
  form_version: 'standard@2026-11-01T10:00:00.000Z',
  answers: {
    acknowledged: true,
    items: [{ fieldId: 'h', type: 'checkbox-group', label: 'Health information', value: ['Panic'], section: 'Health' }],
  },
  completed_at: '2026-11-18T12:05:00Z',
  marketing_opt_in: false,
  marketing_channels: [],
  marketing_choice_at: '2026-11-18T12:05:00Z',
  marketing_form_version: 'marketing-opt-in-v1-2026-11-18',
}

async function open(type: string, id = ID) {
  render(await StaffSubmissionDetail({ params: Promise.resolve({ type, id }) }))
}

const logInserts = () => calls.filter((c) => c.table === 'staff_submission_views' && c.method === 'insert')

describe('/staff/submissions/<type>/<id> (KI125)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // framer-motion's whileInView needs an IntersectionObserver; jsdom has none.
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    calls.length = 0
    state.row = QUIZ_ROW
    state.insertError = null
  })

  it.each<[string, StaffAccess]>([
    ['signed out', { status: 'signed-out' }],
    ['an editor', { status: 'forbidden', viewer: { ...STAFF, role: 'editor' } }],
    ['an admin', { status: 'forbidden', viewer: { ...STAFF, role: 'admin' } }],
    ['Payload down', { status: 'unavailable' }],
  ])('shows %s no submission data and reads nothing', async (_label, access) => {
    mockAccess.mockResolvedValue(access)
    await open('quiz')
    expect(screen.queryByText('jane@example.com')).not.toBeInTheDocument()
    expect(screen.queryByText('I feel on edge')).not.toBeInTheDocument()
    expect(mockClient).not.toHaveBeenCalled()
    expect(calls).toEqual([])
  })

  it('sends a signed-out visitor to the CMS login', async () => {
    mockAccess.mockResolvedValue({ status: 'signed-out' })
    await open('quiz')
    expect(screen.getByRole('link', { name: 'Log in to the CMS' })).toHaveAttribute('href', '/cms/admin/login')
  })

  it('tells a logged-in user without the role why they are refused', async () => {
    mockAccess.mockResolvedValue({ status: 'forbidden', viewer: { ...STAFF, role: 'editor' } })
    await open('intake')
    expect(screen.getByText(/does not have the Staff role/)).toBeInTheDocument()
  })

  it('shows staff every quiz answer with its question, the consent and marketing record, and logs the view', async () => {
    mockAccess.mockResolvedValue({ status: 'allowed', viewer: STAFF })
    await open('quiz')
    expect(screen.getByRole('heading', { level: 1, name: 'Jane Client' })).toBeInTheDocument()
    expect(screen.getByText('I feel on edge')).toBeInTheDocument()
    expect(screen.getByText('Almost Always (4 of 4)')).toBeInTheDocument()
    expect(screen.getByText('I overthink')).toBeInTheDocument()
    expect(screen.getByText('Rarely (1 of 4)')).toBeInTheDocument()
    expect(screen.getByText('The Hyper-Alert Achiever: Your Pattern')).toBeInTheDocument()
    expect(screen.getByText('quiz-consent-interim-2026-11-18-pending-RI-F-POPIA-09-part-B')).toBeInTheDocument()
    expect(screen.getByText('Opted in: Email, WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('marketing-opt-in-v1-2026-11-18')).toBeInTheDocument()
    expect(logInserts()).toEqual([
      {
        table: 'staff_submission_views',
        method: 'insert',
        args: [
          {
            viewer_id: '7',
            viewer_email: 'team@ravenallinstitute.com',
            viewer_role: 'staff',
            submission_type: 'quiz',
            submission_id: ID,
          },
        ],
      },
    ])
  })

  it('shows staff the intake answers grouped by heading, with the form version', async () => {
    state.row = INTAKE_ROW
    mockAccess.mockResolvedValue({ status: 'allowed', viewer: STAFF })
    await open('intake')
    expect(screen.getByText('Health information')).toBeInTheDocument()
    expect(screen.getByText('Panic')).toBeInTheDocument()
    expect(screen.getByText('standard@2026-11-01T10:00:00.000Z')).toBeInTheDocument()
    expect(screen.getByText('#512')).toBeInTheDocument()
    expect(screen.getByText('Not opted in')).toBeInTheDocument()
    expect(logInserts()[0]!.args[0]).toMatchObject({ submission_type: 'intake', submission_id: ID })
  })

  it('shows no answers when the access log cannot be written', async () => {
    state.insertError = { message: 'relation does not exist' }
    mockAccess.mockResolvedValue({ status: 'allowed', viewer: STAFF })
    await open('quiz')
    expect(screen.queryByText('I feel on edge')).not.toBeInTheDocument()
    expect(screen.getByText(/could not be opened just now/)).toBeInTheDocument()
    expect(mockLogError).toHaveBeenCalledWith(
      '[staff/submissions] access log write failed, answers not shown',
      expect.anything(),
      { type: 'quiz' },
    )
  })

  it('answers not found for an unknown id or type, without logging', async () => {
    mockAccess.mockResolvedValue({ status: 'allowed', viewer: STAFF })
    state.row = null
    await expect(open('quiz')).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(open('orders')).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(open('quiz', 'not-a-uuid')).rejects.toThrow('NEXT_NOT_FOUND')
    expect(logInserts()).toEqual([])
  })

  it('offers no export, edit or delete', async () => {
    mockAccess.mockResolvedValue({ status: 'allowed', viewer: STAFF })
    await open('quiz')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByText(/export|download|delete|edit/i)).not.toBeInTheDocument()
  })
})
