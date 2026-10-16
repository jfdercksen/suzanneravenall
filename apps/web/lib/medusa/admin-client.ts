import { logError } from '@/lib/log'
import { medusaAdminAuthHeader } from './admin-auth'

// Server-to-server client for the Medusa v2 Admin API (KI078).
//
// The portal pages used to send the Medusa v1 header x-medusa-access-token,
// which v2 ignores, so every call answered 401 and the pages showed an empty
// list. v2 accepts, in the order we try them:
//
//   1. a secret API key (sk_...) as Basic auth, from MEDUSA_API_KEY or, for
//      the existing box config, MEDUSA_API_TOKEN when it holds an sk_ key
//   2. a user JWT from POST /auth/user/emailpass with MEDUSA_ADMIN_EMAIL and
//      MEDUSA_ADMIN_PASSWORD, cached for the process and refreshed once when a
//      call answers 401
//
// Failures are logged through logError so they reach Sentry; callers decide
// what the member sees.

const DEFAULT_BACKEND_URL = 'http://medusa:9000'

let cachedJwt: string | null = null
let loginInFlight: Promise<string | null> | null = null
// After a rejected login, hold off for a short while so a bad password does
// not hammer /auth/user/emailpass (and Sentry) on every portal page view.
let loginBlockedUntil = 0
const LOGIN_FAILURE_BACKOFF_MS = 30_000

export function medusaBackendUrl(): string {
  return (process.env.MEDUSA_BACKEND_URL ?? DEFAULT_BACKEND_URL).replace(/\/+$/, '')
}

function secretApiKey(): string | null {
  for (const name of ['MEDUSA_API_KEY', 'MEDUSA_API_TOKEN'] as const) {
    const value = process.env[name]?.trim()
    if (value && value.startsWith('sk_')) return value
  }
  return null
}

function hasAdminCredentials(): boolean {
  return Boolean(process.env.MEDUSA_ADMIN_EMAIL && process.env.MEDUSA_ADMIN_PASSWORD)
}

export function isMedusaAdminConfigured(): boolean {
  return secretApiKey() !== null || hasAdminCredentials()
}

async function loginWithPassword(): Promise<string | null> {
  const email = process.env.MEDUSA_ADMIN_EMAIL
  const password = process.env.MEDUSA_ADMIN_PASSWORD
  if (!email || !password) return null

  try {
    const res = await fetch(`${medusaBackendUrl()}/auth/user/emailpass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    })
    if (!res.ok) {
      logError('[medusa/admin-client] admin login failed', undefined, { status: res.status })
      return null
    }
    const body = (await res.json()) as { token?: unknown }
    if (typeof body.token !== 'string' || body.token.length === 0) {
      logError('[medusa/admin-client] admin login returned no token')
      return null
    }
    return body.token
  } catch (error) {
    logError('[medusa/admin-client] admin login threw', error)
    return null
  }
}

async function getJwt(staleToken: string | null): Promise<string | null> {
  // Only drop the cache if it still holds the token that just failed; a
  // concurrent caller may already have refreshed it.
  if (staleToken && cachedJwt === staleToken) cachedJwt = null
  if (cachedJwt) return cachedJwt
  if (Date.now() < loginBlockedUntil) return null
  if (!loginInFlight) {
    loginInFlight = loginWithPassword()
      .then((token) => {
        if (token) cachedJwt = token
        else loginBlockedUntil = Date.now() + LOGIN_FAILURE_BACKOFF_MS
        return token
      })
      .finally(() => {
        loginInFlight = null
      })
  }
  return loginInFlight
}

async function bearerToken(staleToken: string | null): Promise<string | null> {
  const key = secretApiKey()
  if (key) return key
  return getJwt(staleToken)
}

/**
 * Calls an Admin API path such as `/customers?email=...` with v2 auth.
 * Returns the Response, or null when the client has no credentials or the
 * login itself failed (already logged). A 401 with password auth triggers one
 * re-login and one retry.
 */
export async function medusaAdminFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response | null> {
  if (!isMedusaAdminConfigured()) {
    logError(
      '[medusa/admin-client] no admin credentials: set MEDUSA_API_KEY (sk_ key) or MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD',
    )
    return null
  }

  const url = `${medusaBackendUrl()}/admin${path.startsWith('/') ? path : `/${path}`}`

  const send = async (staleToken: string | null): Promise<{ res: Response; token: string } | null> => {
    const token = await bearerToken(staleToken)
    if (!token) return null
    const headers = new Headers(init.headers)
    headers.set('Authorization', medusaAdminAuthHeader(token))
    if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json')
    const res = await fetch(url, { cache: 'no-store', ...init, headers })
    return { res, token }
  }

  const first = await send(null)
  if (!first) return null
  if (first.res.status !== 401 || secretApiKey() !== null) return first.res

  // Cached JWT expired or was revoked: log in again and retry once.
  try {
    await first.res.body?.cancel()
  } catch {
    // nothing to release
  }
  const retried = await send(first.token)
  return retried?.res ?? first.res
}

/** Test hook: forget the cached login so each test starts cold. */
export function resetMedusaAdminAuthCache(): void {
  cachedJwt = null
  loginInFlight = null
  loginBlockedUntil = 0
}
