import { NextRequest, NextResponse } from 'next/server'
import { isEmailConfigured, sendEmail } from '@/lib/email/send'
import { logError } from '@/lib/log'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DELIVERY_FAILED =
  'We could not send your message right now. Please email hello@suzanneravenall.com directly.'

type ContactBody = {
  name: string
  email: string
  phone?: string
  enquiry?: string
  message: string
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

export async function POST(request: NextRequest) {
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

  const { name, email, phone, enquiry, message } = body

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
      to: [process.env.CONTACT_NOTIFY_EMAIL ?? 'hello@suzanneravenall.com'],
      replyTo: email,
      subject: `New contact message from ${name}`,
      html,
    })
  } catch (err) {
    logError('[contact] delivery error:', err)
    return NextResponse.json({ error: DELIVERY_FAILED }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
