import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { logError, logWarn } from '@/lib/log'

// PayFast sandbox IP ranges (update with production IPs at DNS cutover)
// Ref: https://developers.payfast.co.za/docs#step_4_confirm_payment
const PAYFAST_SANDBOX_IPS = new Set([
  '197.242.141.6',
  '197.242.141.0',
  '197.242.141.8',
  '199.255.6.6',
])
const PAYFAST_PRODUCTION_IPS = new Set([
  '197.242.141.6',
  '197.242.141.0',
  '41.74.179.194',
])

function getAllowedIPs(): Set<string> {
  return process.env.NODE_ENV === 'production'
    ? PAYFAST_PRODUCTION_IPS
    : new Set([...PAYFAST_SANDBOX_IPS, ...PAYFAST_PRODUCTION_IPS, '127.0.0.1', '::1', '::ffff:127.0.0.1'])
}

// MD5 signature — same algorithm as /api/checkout/payfast
// Passphrase is required: if PAYFAST_PASSPHRASE is unset, we fail loudly
// rather than silently accepting passphrase-less signatures.
function buildSignature(params: Record<string, string>, passphrase: string): string {
  const queryString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`)
    .join('&')

  const withPassphrase = passphrase
    ? `${queryString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
    : queryString

  return createHash('md5').update(withPassphrase).digest('hex')
}

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

// Step 4 of PayFast ITN spec: validate the ITN against the PayFast server
// by POSTing the received params back to PayFast's validation endpoint.
// This is required by PayFast in addition to the MD5 signature check.
// Ref: https://developers.payfast.co.za/docs#step_4_confirm_payment
async function validateWithPayFast(
  itnBody: string,
  isSandbox: boolean,
): Promise<boolean> {
  const host = isSandbox
    ? 'sandbox.payfast.co.za'
    : 'www.payfast.co.za'
  const validateUrl = `https://${host}/eng/query/validate`

  try {
    const res = await fetch(validateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: itnBody,
    })
    const text = (await res.text()).trim()
    return res.ok && text === 'VALID'
  } catch (err) {
    logError('[PayFast ITN] Validation endpoint request failed', err)
    return false
  }
}

async function completeCart(cartId: string): Promise<boolean> {
  const medusaBase = process.env.MEDUSA_BACKEND_URL ?? 'http://medusa:9000'
  const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

  try {
    const res = await fetch(`${medusaBase}/store/carts/${cartId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': pubKey,
      },
    })

    if (res.ok) {
      const data = (await res.json()) as { type?: string; order?: { id: string } }
      if (data.type === 'order') {
        console.info('[PayFast ITN] Cart completed → order created', {
          cartId,
          orderId: data.order?.id,
        })
        return true
      }
    }

    const errorText = await res.text().catch(() => '')
    console.warn('[PayFast ITN] Cart complete returned non-OK', {
      cartId,
      status: res.status,
      body: errorText.slice(0, 200),
    })
    return false
  } catch (err) {
    logError('[PayFast ITN] completeCart network error', err, { cartId })
    return false
  }
}

// PayFast requires HTTP 200 for ALL ITN responses — even on error.
// If we return anything other than 200, PayFast retries the ITN.
export async function POST(req: NextRequest) {
  const passphrase = process.env.PAYFAST_PASSPHRASE

  // Fail loudly if passphrase env var is missing — an empty passphrase would
  // silently accept forged ITN requests signed without a passphrase.
  if (!passphrase) {
    logError('[PayFast ITN] PAYFAST_PASSPHRASE is not set — rejecting all ITN requests')
    return new NextResponse('OK', { status: 200 })
  }

  const isSandbox = process.env.NODE_ENV !== 'production'

  // 1. IP allowlist check
  const clientIP = getClientIP(req)
  if (!getAllowedIPs().has(clientIP)) {
    console.warn('[PayFast ITN] Rejected request from untrusted IP', { clientIP })
    // Still return 200 — we don't want PayFast to retry a forged request
    return new NextResponse('OK', { status: 200 })
  }

  // 2. Parse form body (PayFast sends application/x-www-form-urlencoded)
  let rawBody: string
  let itn: Record<string, string>
  try {
    rawBody = await req.text()
    itn = Object.fromEntries(new URLSearchParams(rawBody).entries())
  } catch {
    logError('[PayFast ITN] Failed to parse body')
    return new NextResponse('OK', { status: 200 })
  }

  const { signature, ...itnWithoutSig } = itn

  // 3. MD5 signature verification
  const expectedSignature = buildSignature(itnWithoutSig, passphrase)
  if (signature !== expectedSignature) {
    logError('[PayFast ITN] Signature mismatch', undefined, {
      received: signature,
      expected: expectedSignature,
      m_payment_id: itn.m_payment_id,
    })
    return new NextResponse('OK', { status: 200 })
  }

  // 4. PayFast server-side validation (required by PayFast ITN spec)
  const isValid = await validateWithPayFast(rawBody, isSandbox)
  if (!isValid) {
    logError('[PayFast ITN] Server-side validation failed', undefined, {
      m_payment_id: itn.m_payment_id,
    })
    return new NextResponse('OK', { status: 200 })
  }

  const cartId = itn.m_payment_id ?? ''
  const pfPaymentId = itn.pf_payment_id ?? ''
  const paymentStatus = itn.payment_status ?? ''
  const amountGross = itn.amount_gross ?? '0.00'

  // 5. Log ITN in sandbox mode (Sentry integration deferred to Phase 5 — KI001)
  if (isSandbox) {
    console.info('[PayFast ITN] Received (sandbox)', {
      cartId,
      pfPaymentId,
      paymentStatus,
      amountGross,
    })
  }

  // 6. Process payment status
  if (paymentStatus === 'COMPLETE') {
    console.info('[PayFast ITN] Payment COMPLETE', { cartId, pfPaymentId, amountGross })
    await completeCart(cartId)
  } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
    // Reaches Sentry once the DSN is set (KI001) — a failed payment is a lost sale.
    logWarn('[PayFast ITN] Payment not completed', undefined, {
      cartId,
      paymentStatus,
    })
  }

  // PayFast spec: always respond 200
  return new NextResponse('OK', { status: 200 })
}
