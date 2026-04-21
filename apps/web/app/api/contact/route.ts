import { NextRequest, NextResponse } from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  // TODO: Send via Resend in email setup task
  // Intentionally not logging email or name — they are PII (POPIA).
  void name
  void email
  void phone
  void enquiry
  void message

  return NextResponse.json({ success: true }, { status: 200 })
}
