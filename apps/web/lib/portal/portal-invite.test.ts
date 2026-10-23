import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/log', () => ({ logError: vi.fn() }))
vi.mock('@/lib/quiz/subscriber', () => ({ getServiceRoleClient: () => null }))

import { portalInviteFor } from './portal-invite'

const EMAIL = 'johan+limit1023@aiautomations.co.za'

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = 'http://169.239.180.49'
})

describe('portalInviteFor', () => {
  it('invites a buyer without an account to sign up, email filled in', async () => {
    await expect(portalInviteFor(EMAIL, async () => false)).resolves.toEqual({
      kind: 'signup',
      url: 'http://169.239.180.49/portal/signup?email=johan%2Blimit1023%40aiautomations.co.za',
    })
  })

  it('sends a buyer who has an account to the login page', async () => {
    await expect(portalInviteFor(EMAIL, async () => true)).resolves.toEqual({
      kind: 'login',
      url: 'http://169.239.180.49/portal/login?email=johan%2Blimit1023%40aiautomations.co.za',
    })
  })

  it('falls back to signup when the account lookup cannot answer', async () => {
    await expect(portalInviteFor(EMAIL, async () => null)).resolves.toMatchObject({ kind: 'signup' })
    await expect(portalInviteFor(EMAIL, async () => Promise.reject(new Error('down')))).resolves.toMatchObject({ kind: 'signup' })
  })

  it('falls back to signup without a service-role client', async () => {
    await expect(portalInviteFor(EMAIL)).resolves.toMatchObject({ kind: 'signup' })
  })
})
