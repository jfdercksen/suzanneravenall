import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({}) }))

import { createClient } from './middleware'
import { PATHNAME_HEADER } from './pathname'

describe('createClient (middleware, KI084)', () => {
  it('passes the request path on to the app as a request header', () => {
    const { supabaseResponse } = createClient(new NextRequest('http://localhost/portal/reset-password?code=x'))
    expect(supabaseResponse.headers.get(`x-middleware-request-${PATHNAME_HEADER}`)).toBe('/portal/reset-password')
  })

  it('overwrites a path header sent by the client', () => {
    const request = new NextRequest('http://localhost/portal/dashboard', { headers: { [PATHNAME_HEADER]: '/portal/login' } })
    const { supabaseResponse } = createClient(request)
    expect(supabaseResponse.headers.get(`x-middleware-request-${PATHNAME_HEADER}`)).toBe('/portal/dashboard')
  })
})
