import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Signed unsubscribe tokens for marketing emails (POPIA opt-out).
 *
 * Token format: base64url(email) + '.' + HMAC-SHA256(base64url(email), secret)
 * The email itself is the payload (no DB lookup needed to render the link);
 * the HMAC prevents anyone from forging a token to unsubscribe someone else.
 *
 * Secret: EMAIL_UNSUBSCRIBE_SECRET (generate with `openssl rand -hex 32`).
 * Sending a marketing email without the secret configured throws, matching
 * the repo convention of failing loudly on missing server config.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://suzanneravenall.com'

function getSecret(): string {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET
  if (!secret) throw new Error('EMAIL_UNSUBSCRIBE_SECRET is not configured')
  return secret
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function createUnsubscribeToken(email: string): string {
  const secret = getSecret()
  const payload = Buffer.from(email.trim().toLowerCase(), 'utf8').toString('base64url')
  return `${payload}.${sign(payload, secret)}`
}

/**
 * Returns the verified email address, or null for a missing/tampered/garbled
 * token. Never throws — verification failures are indistinguishable from a
 * bad link to the caller.
 */
export function verifyUnsubscribeToken(token: string | null | undefined): string | null {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET
  if (!secret || !token) return null

  const parts = token.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  const [payload, providedSig] = parts

  const expected = Buffer.from(sign(payload, secret))
  const provided = Buffer.from(providedSig)
  if (provided.length !== expected.length) return null
  if (!timingSafeEqual(provided, expected)) return null

  try {
    const email = Buffer.from(payload, 'base64url').toString('utf8')
    return email.includes('@') ? email : null
  } catch {
    return null
  }
}

/** Link for the human-facing confirmation page, embedded in email footers. */
export function buildUnsubscribeUrl(email: string): string {
  return `${SITE_URL}/unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(email))}`
}

/**
 * RFC 8058 one-click unsubscribe headers for Resend's `headers` option.
 * Mail clients (Gmail, Outlook) POST straight to the API route with the
 * token in the query string — no page visit involved.
 */
export function buildListUnsubscribeHeaders(email: string): Record<string, string> {
  const token = encodeURIComponent(createUnsubscribeToken(email))
  return {
    'List-Unsubscribe': `<${SITE_URL}/api/email/unsubscribe?token=${token}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}
