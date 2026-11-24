import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const getUser = vi.fn()
let pathname = ''
let tierRow: { name: string; slug: string } | null = null
const orders: string[] = []
const navProps = vi.fn()

vi.mock('next/headers', () => ({
  cookies: async () => ({}),
  headers: async () => new Headers(pathname ? { 'x-pathname': pathname } : {}),
}))
vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser },
    from: () => {
      const chain = { select: () => chain, eq: () => chain, order: (col: string) => { orders.push(col); return chain }, limit: () => chain, maybeSingle: async () => ({ data: tierRow ? { membership_tiers: tierRow } : null }) }
      return chain
    },
  }),
}))
vi.mock('@/lib/access/memberships', () => ({ membershipsEnabled: () => false }))
vi.mock('@/components/portal/PortalNav', () => ({
  default: (props: Record<string, unknown>) => {
    navProps(props)
    return <nav aria-label="Portal sidebar" />
  },
}))
vi.mock('@/components/portal/AuthOverlay', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-overlay">{children}</div>,
}))

import PortalLayout from './layout'

async function renderAt(path: string) {
  pathname = path
  render(await PortalLayout({ children: <p>page</p> }))
}

describe('PortalLayout (KI084)', () => {
  beforeEach(() => {
    getUser.mockReset()
  })

  it('puts a signed-in member on the reset-password page on the plain auth layout', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    await renderAt('/portal/reset-password')
    expect(screen.getByTestId('auth-overlay')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Portal sidebar' })).not.toBeInTheDocument()
  })

  it('gives a signed-in member the sidebar on the dashboard', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    await renderAt('/portal/dashboard')
    expect(screen.getByRole('navigation', { name: 'Portal sidebar' })).toBeInTheDocument()
    expect(screen.queryByTestId('auth-overlay')).not.toBeInTheDocument()
  })

  it('does not treat a look-alike path as an auth page', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    await renderAt('/portal/login-history')
    expect(screen.getByRole('navigation', { name: 'Portal sidebar' })).toBeInTheDocument()
  })

  it('keeps a signed-out visitor on the auth layout', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    await renderAt('/portal/login')
    expect(screen.getByTestId('auth-overlay')).toBeInTheDocument()
  })

  it('falls back to the member layout when the path header is missing', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    await renderAt('')
    expect(screen.getByRole('navigation', { name: 'Portal sidebar' })).toBeInTheDocument()
  })

  it('reads the highest level first and passes its name, so Lifestyle is not shown as Guest (KI136)', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    tierRow = { name: 'Lifestyle Membership', slug: 's0212' }
    orders.length = 0
    navProps.mockClear()
    await renderAt('/portal/dashboard')
    expect(orders[0]).toBe('access_level')
    expect(navProps).toHaveBeenCalledWith(expect.objectContaining({ tier: 'free', tierName: 'Lifestyle Membership' }))
    tierRow = null
  })
})
