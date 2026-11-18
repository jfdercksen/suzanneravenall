import { NextRequest, NextResponse } from 'next/server'
import { isEmailConfigured, sendEmail } from '@/lib/email/send'
import { logError } from '@/lib/log'
import { createRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import {
  enquiryLabel,
  firstNameOf,
  sendContactAcknowledgementEmail,
} from '@/lib/email/contact-acknowledgement'
import { marketingRecord, marketingSummary, type MarketingChoice } from '@/lib/consent/marketing'
import { MarketingChoiceSchema } from '@/lib/consent/schema'
import { getLeadsClient, saveLead } from '@/lib/leads/store'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Public contact address: https://suzanneravenall.com/contact/ (Johan's decision 10, 6 Oct).
const DELIVERY_FAILED =
  'We could not send your message right now. Please email sravenall@suzanneravenall.com directly.'

type ContactBody = {
  name: string
  email: string
  phone?: string
  enquiry?: string
  message: string
  /** POPIA marketing opt-in; absent from pages cached before it existed. */
  marketing?: MarketingChoice
}

function isValidBody(value: unknown): value is ContactBody {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.name === 'string' &&
    v.name.trim().length > 0 &&
    typeof v.email === 'string' &&
    EMAIL_RE.test(v.email.trim()) &&
    typeof v.message === 'string' &&
    v.message.trim().length > 0
  )
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// The visitor acknowledgement echoes the message to the address typed in the
// form, so cap how often one IP, and one recipient, can trigger it.
const ipGuard = createRateLimiter({ limit: 5, windowMs: 600_000 })
const recipientLimiter = createRateLimiter({ limit: 3, windowMs: 3_600_000 })

export async function POST(request: NextRequest) {
  const ipCheck = ipGuard.check(getClientIp(request.headers))
  if (ipCheck.limited) return rateLimitResponse(ipCheck.retryAfterSeconds)
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!isValidBody(body)) {
    return NextResponse.json(
      { error: 'Name, a valid email address, and a message are required.' },
      { status: 400 }
    )
  }

  const { name, email, phone, enquiry, message, marketing } = body
  if (marketing !== undefined && !MarketingChoiceSchema.safeParse(marketing).success) {
    return NextResponse.json({ error: 'Choose at least one: email, WhatsApp or SMS, or untick the box.' }, { status: 400 })
  }
  const marketingChoice = marketingRecord(marketing, new Date())

  const recipientCheck = recipientLimiter.check(email.toLowerCase().trim())
  if (recipientCheck.limited) return rateLimitResponse(recipientCheck.retryAfterSeconds)

  // KI035: a send failure used to be swallowed behind {"success":true}. Fail loudly
  // instead, so the visitor knows to email directly and nothing is silently lost.
  if (!isEmailConfigured()) {
    logError('[contact] BREVO_API_KEY not set - contact form message not delivered')
    return NextResponse.json({ error: DELIVERY_FAILED }, { status: 500 })
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a1a">
      <h2 style="margin-top:0">New contact form submission</h2>
      <table cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse">
        <tr><td style="font-weight:bold;width:120px">Name</td><td>${escapeHtml(name)}</td></tr>
        <tr><td style="font-weight:bold">Email</td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        ${phone ? `<tr><td style="font-weight:bold">Phone</td><td>${escapeHtml(phone)}</td></tr>` : ''}
        ${enquiry ? `<tr><td style="font-weight:bold">Enquiry</td><td>${escapeHtml(enquiry)}</td></tr>` : ''}
        <tr><td style="font-weight:bold">Marketing</td><td>${escapeHtml(marketing ? marketingSummary(marketing) : 'No choice recorded')}</td></tr>
      </table>
      <hr style="margin:16px 0;border:none;border-top:1px solid #e5e5e5" />
      <p style="font-weight:bold;margin-bottom:8px">Message</p>
      <p style="white-space:pre-wrap;background:#f9f9f9;padding:16px;border-radius:6px">${escapeHtml(message)}</p>
      <hr style="margin:16px 0;border:none;border-top:1px solid #e5e5e5" />
      <p style="color:#888;font-size:12px">Sent from suzanneravenall.com contact form</p>
    </div>
  `

  try {
    await sendEmail({
      // Read at call time, like the key, so a container env change needs no rebuild.
      // `||`, not `??`: docker-compose passes an unset variable as an empty string,
      // which `??` kept, and Brevo then refused the send ("email is missing in to").
      to: [process.env.CONTACT_NOTIFY_EMAIL || 'hello@suzanneravenall.com'],
      replyTo: email,
      subject: `New contact message from ${name}`,
      html,
    })
  } catch (err) {
    logError('[contact] delivery error:', err)
    return NextResponse.json({ error: DELIVERY_FAILED }, { status: 500 })
  }

  // The form stores nothing else, so a sender who opted in to marketing is
  // kept in leads with their choice (POPIA, Johan 18 Nov). 'skipped': the
  // enquiry itself is not a CRM lead, so the Vtiger retry leaves the row
  // alone. saveLead never throws; a failure only loses the opt-in row.
  if (marketingChoice.marketing_opt_in) {
    const saved = await saveLead(
      getLeadsClient(),
      { email, firstName: firstNameOf(name), source: 'contact', quizResult: null, marketing: marketingChoice },
      'skipped',
    )
    if (!saved.ok) logError('[contact] marketing opt-in not saved to leads', new Error(saved.message), { reason: saved.reason })
  }

  // Acknowledge the visitor only once staff really have the message. Not
  // awaited: a failure here is logged and never changes the response.
  void sendContactAcknowledgementEmail({
    email: email.trim(),
    firstName: firstNameOf(name),
    enquiry: enquiryLabel(enquiry),
    message: message.trim(),
  }).catch((err: unknown) => {
    // No address in the log context (POPIA).
    logError('[contact] acknowledgement email to the visitor failed', err, { enquiry: enquiry ?? null })
  })

  return NextResponse.json({ success: true }, { status: 200 })
}
