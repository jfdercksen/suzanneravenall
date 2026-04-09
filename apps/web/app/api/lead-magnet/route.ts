import { NextResponse } from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('email' in body) ||
    typeof (body as Record<string, unknown>).email !== 'string' ||
    !EMAIL_RE.test((body as Record<string, unknown>).email as string)
  ) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 422 })
  }

  const { email } = body as { email: string }

  // TODO (Task 1.7): integrate with Resend once the account is verified.
  // The email is intentionally not logged here — email addresses are PII (POPIA).
  // Returning 202 Accepted to signal the request is queued but not yet processed.
  void email

  return NextResponse.json(
    { success: true, message: 'Received — integration pending.' },
    { status: 202 }
  )
}
