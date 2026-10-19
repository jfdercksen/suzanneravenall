import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUser = vi.fn()
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: { getUser } }) }))

import { contactFromUser, readMemberContact } from './memberContact'

describe('contactFromUser (KI077)', () => {
  it('splits the full name the way the account page does and reads the phone', () => {
    expect(
      contactFromUser({ email: 'ann@example.com', user_metadata: { full_name: '  Ann  van Wyk ', phone: ' +27 82 555 1234 ' } })
    ).toEqual({ firstName: 'Ann', lastName: 'van Wyk', email: 'ann@example.com', phone: '+27 82 555 1234' })
  })

  it('gives empty strings when the metadata is missing or not text', () => {
    expect(contactFromUser({ email: null, user_metadata: { full_name: 42, phone: null } })).toEqual({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    })
  })
})

describe('readMemberContact', () => {
  beforeEach(() => {
    getUser.mockReset()
  })

  it('returns the member contact when signed in', async () => {
    getUser.mockResolvedValue({ data: { user: { email: 'a@b.co', user_metadata: { full_name: 'Ann', phone: '0825551234' } } } })
    expect(await readMemberContact()).toEqual({ firstName: 'Ann', lastName: '', email: 'a@b.co', phone: '0825551234' })
  })

  it('returns null for a guest', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    expect(await readMemberContact()).toBeNull()
  })

  it('returns null when the session cannot be read', async () => {
    getUser.mockRejectedValue(new Error('network'))
    expect(await readMemberContact()).toBeNull()
  })
})
