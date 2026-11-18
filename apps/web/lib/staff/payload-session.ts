import { payloadBaseUrl } from '@/lib/intake/forms'

/**
 * Who is looking at /staff/submissions (KI125). The login is the Payload CMS
 * one the team already uses for the intake forms: Payload sets its
 * `payload-token` cookie on Path=/ of the same site, so the web server reads
 * it and asks Payload who it belongs to (GET /cms/api/users/me with the token
 * as `Authorization: JWT`). Payload checks the signature, the expiry and the
 * session, so a logged-out token is refused. No second password system.
 *
 * Only the Staff role may read the answers (POPIA, Suzanne's rules of 8 Nov
 * 2026: role-based access). Admins and editors are refused on purpose: the
 * role is given per person in the CMS, Users, by an admin.
 */

export const PAYLOAD_TOKEN_COOKIE = 'payload-token'

/** The Payload role that may read quiz and intake answers. */
export const SUBMISSIONS_ROLE = 'staff'

/** The CMS login page (Payload runs under /cms on the same site). */
export const STAFF_LOGIN_PATH = '/cms/admin/login'
export const STAFF_LOGOUT_PATH = '/cms/admin/logout'

export interface StaffViewer {
  id: string
  email: string
  name: string | null
  role: string
}

export type StaffAccess =
  | { status: 'allowed'; viewer: StaffViewer }
  | { status: 'forbidden'; viewer: StaffViewer }
  | { status: 'signed-out' }
  | { status: 'unavailable' }

// A JWT: three base64url parts. Anything else never goes to Payload.
const JWT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
const MAX_TOKEN_LENGTH = 4096
const TIMEOUT_MS = 5000

function toViewer(raw: unknown): StaffViewer | null {
  if (!raw || typeof raw !== 'object') return null
  const user = raw as Record<string, unknown>
  const id = typeof user.id === 'number' || typeof user.id === 'string' ? String(user.id) : ''
  const email = typeof user.email === 'string' ? user.email.trim() : ''
  const role = typeof user.role === 'string' ? user.role : ''
  if (!id || !email || !role) return null
  const name = typeof user.name === 'string' && user.name.trim() !== '' ? user.name.trim() : null
  return { id, email, name, role }
}

export async function checkStaffAccess(
  token: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<StaffAccess> {
  if (!token || token.length > MAX_TOKEN_LENGTH || !JWT_RE.test(token)) return { status: 'signed-out' }

  let response: Response
  try {
    response = await fetchImpl(`${payloadBaseUrl()}/api/users/me`, {
      headers: { Authorization: `JWT ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    return { status: 'unavailable' }
  }

  if (response.status === 401 || response.status === 403) return { status: 'signed-out' }
  if (!response.ok) return { status: 'unavailable' }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    return { status: 'unavailable' }
  }

  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  // Payload answers 200 { user: null } for a bad, expired or logged-out token.
  if (record.collection !== undefined && record.collection !== 'users') return { status: 'signed-out' }
  const viewer = toViewer(record.user)
  if (!viewer) return { status: 'signed-out' }
  if (viewer.role !== SUBMISSIONS_ROLE) return { status: 'forbidden', viewer }
  return { status: 'allowed', viewer }
}
