import type { ReactElement } from 'react'
import { render } from '@react-email/components'

/**
 * One door for every transactional email the web app sends.
 *
 * Provider: Brevo transactional API (v3). Chosen 2026-09-25 when the
 * suzanneravenall.com sending domain was verified in Brevo (KI035); Resend
 * never had a verified domain and every send was refused. Plain fetch, no SDK.
 *
 * The key is read at call time, not module load, so a route that starts
 * without it still fails loudly on the first send rather than silently.
 */

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'
const DEFAULT_FROM = 'Dr Suzanne Ravenall <hello@suzanneravenall.com>'

export type SendEmailInput = {
  /** "Name <address>" or a bare address. Defaults to EMAIL_FROM_ADDRESS. */
  from?: string
  to: string[]
  replyTo?: string
  subject: string
  /** A React Email element; rendered to HTML here. */
  react?: ReactElement
  /** Pre-built HTML, used when there is no React template. */
  html?: string
  text?: string
  headers?: Record<string, string>
}

export type MailAddress = { email: string; name?: string }

/** True when the app can send mail at all. Routes use it to fail fast. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY)
}

/** Default sender, "Name <address>" form, from the environment. */
export function defaultFromAddress(): string {
  return process.env.EMAIL_FROM_ADDRESS ?? DEFAULT_FROM
}

/** "Dr Suzanne Ravenall <hello@x.com>" -> { name, email }; a bare address -> { email }. */
export function parseAddress(value: string): MailAddress {
  const match = value.trim().match(/^(.*?)\s*<([^<>]+)>$/)
  if (!match) return { email: value.trim() }
  const [, rawName = '', address = ''] = match
  const name = rawName.replace(/^"|"$/g, '').trim()
  return name ? { name, email: address.trim() } : { email: address.trim() }
}

/**
 * Sends one email and returns the provider message id.
 * Throws on a missing key, a non-2xx response, or an empty response body,
 * so callers can decide whether the failure blocks their own flow.
 */
export async function sendEmail(input: SendEmailInput): Promise<string> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) throw new Error('BREVO_API_KEY is not configured')

  const html = input.html ?? (input.react ? await render(input.react) : undefined)
  if (!html && !input.text) throw new Error('Email needs html, react or text content')

  const payload: Record<string, unknown> = {
    sender: parseAddress(input.from ?? defaultFromAddress()),
    to: input.to.map(parseAddress),
    subject: input.subject,
  }
  if (html) payload.htmlContent = html
  if (input.text) payload.textContent = input.text
  if (input.replyTo) payload.replyTo = parseAddress(input.replyTo)
  if (input.headers && Object.keys(input.headers).length > 0) payload.headers = input.headers

  const res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const body = (await res.json().catch(() => ({}))) as {
    messageId?: string
    message?: string
    code?: string
  }

  if (!res.ok) {
    const detail = body.message
      ? `${body.code ? `${body.code}: ` : ''}${body.message}`
      : `HTTP ${res.status}`
    throw new Error(`Brevo error: ${detail}`)
  }
  if (!body.messageId) throw new Error('Brevo returned no message id')

  return body.messageId
}
