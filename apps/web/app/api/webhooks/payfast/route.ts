import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

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
    console.error('[PayFast ITN] completeCart network error', { cartId, err })
    return false
  }
}

// PayFast requires HTTP 200 for ALL ITN responses — even on error.
// If we return anything other than 200, PayFast retries the ITN.
export async function POST(req: NextRequest) {
  const passphrase = process.env.PAYFAST_PASSPHRASE ?? ''
  const isSandbox = process.env.NODE_ENV !== 'production'

  // 1. IP allowlist check
  const clientIP = getClientIP(req)
  if (!getAllowedIPs().has(clientIP)) {
    console.warn('[PayFast ITN] Rejected request from untrusted IP', { clientIP })
    // Still return 200 — we don't want PayFast to retry a forged request
    return new NextResponse('OK', { status: 200 })
  }

  // 2. Parse form body (PayFast sends application/x-www-form-urlencoded)
  let itn: Record<string, string>
  try {
    const text = await req.text()
    itn = Object.fromEntries(new URLSearchParams(text).entries())
  } catch {
    console.error('[PayFast ITN] Failed to parse body')
    return new NextResponse('OK', { status: 200 })
  }

  const { signature, ...itnWithoutSig } = itn

  // 3. Signature verification
  const expectedSignature = buildSignature(itnWithoutSig, passphrase)
  if (signature !== expectedSignature) {
    console.error('[PayFast ITN] Signature mismatch', {
      received: signature,
      expected: expectedSignature,
      m_payment_id: itn.m_payment_id,
    })
    return new NextResponse('OK', { status: 200 })
  }

  const cartId = itn.m_payment_id ?? ''
  const pfPaymentId = itn.pf_payment_id ?? ''
  const paymentStatus = itn.payment_status ?? ''
  const amountGross = itn.amount_gross ?? '0.00'

  // 4. Log ITN in sandbox mode (Sentry integration deferred to Phase 5 — KI001)
  if (isSandbox) {
    console.info('[PayFast ITN] Received (sandbox)', {
      cartId,
      pfPaymentId,
      paymentStatus,
      amountGross,
    })
  }

  // 5. Process payment status
  if (paymentStatus === 'COMPLETE') {
    console.info('[PayFast ITN] Payment COMPLETE', { cartId, pfPaymentId, amountGross })
    await completeCart(cartId)
  } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
    console.warn('[PayFast ITN] Payment not completed', {
      cartId,
      paymentStatus,
    })
    // TODO (Phase 5): log to Sentry when KI001 is resolved
  }

  // PayFast spec: always respond 200
  return new NextResponse('OK', { status: 200 })
}
