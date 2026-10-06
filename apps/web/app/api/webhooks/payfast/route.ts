import { NextRequest, NextResponse } from 'next/server'
import { logError, logWarn } from '@/lib/log'
import { payfastSignature } from '@/lib/payfast-signature'

// PayFast's published ITN source ranges (developers.payfast.co.za, "Confirm
// payment", step 2: valid hosts / IP ranges). Sandbox ITNs come from the same
// ranges. The old hand-picked list missed most of them, so real ITNs would
// have been dropped. Signature, server-side validation and the amount check
// still apply after this.
const PAYFAST_CIDRS = [
  '197.97.145.144/28',
  '41.74.179.192/27',
  '102.216.36.0/28',
  '102.216.36.128/28',
  '144.126.193.139/32',
]

function ipv4ToInt(ip: string): number | null {
  const m = ip.replace(/^::ffff:/, '').match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (!m) return null
  const parts = m.slice(1).map(Number)
  if (parts.some((n) => n > 255)) return null
  return parts.reduce((acc, n) => acc * 256 + n, 0)
}

function isPayFastIP(ip: string): boolean {
  const n = ipv4ToInt(ip)
  if (n === null) return false
  return PAYFAST_CIDRS.some((cidr) => {
    const [base = '', bits = '32'] = cidr.split('/')
    const b = ipv4ToInt(base)
    if (b === null) return false
    const mask = Number(bits) === 0 ? 0 : (~0 << (32 - Number(bits))) >>> 0
    return (n & mask) === (b & mask)
  })
}

function isAllowedIP(ip: string): boolean {
  if (isPayFastIP(ip)) return true
  // Local calls only outside production builds (unit tests, dev).
  return process.env.NODE_ENV !== 'production' && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip)
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

function medusaBase(): string {
  return (
    process.env.MEDUSA_BACKEND_URL ??
    process.env.NEXT_PUBLIC_MEDUSA_URL ??
    'http://medusa:9000'
  ).replace(/\/$/, '')
}

interface StoreCart {
  id: string
  total: number
  currency_code?: string | null
}

// Loads the cart so the ITN amount can be compared with what Medusa says the
// buyer owes. Returns null on any failure; the caller then refuses to complete.
async function loadCart(cartId: string): Promise<StoreCart | null> {
  try {
    const res = await fetch(`${medusaBase()}/store/carts/${encodeURIComponent(cartId)}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '',
      },
    })
    if (!res.ok) {
      logError('[PayFast ITN] Cart load returned non-OK', undefined, { cartId, status: res.status })
      return null
    }
    const data = (await res.json()) as { cart?: StoreCart }
    return data.cart ?? null
  } catch (err) {
    logError('[PayFast ITN] Cart load network error', err, { cartId })
    return null
  }
}

async function completeCart(cartId: string): Promise<boolean> {
  const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

  try {
    const res = await fetch(`${medusaBase()}/store/carts/${cartId}/complete`, {
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

  // Same switch as /api/checkout/payfast, so a sandbox payment is validated
  // against the sandbox and a live one against live.
  const isSandbox = process.env.PAYFAST_SANDBOX === 'true'

  // 1. IP allowlist check
  const clientIP = getClientIP(req)
  if (!isAllowedIP(clientIP)) {
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
  // PayFast's ITN sample signs every posted field, empty ones included; the
  // form rule skips them. Accept either, both are full signature checks.
  const expectedSignature = payfastSignature(itnWithoutSig, passphrase, { includeEmpty: true })
  const expectedSkipEmpty = payfastSignature(itnWithoutSig, passphrase)
  if (signature !== expectedSignature && signature !== expectedSkipEmpty) {
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
    // Only complete when PayFast collected exactly what the cart costs. The
    // form amount is signed server side, but a cart can change after the form
    // was built, and the ITN is the last point where an underpayment can be
    // stopped before an order exists.
    const cart = cartId ? await loadCart(cartId) : null
    const receivedCents = Math.round(parseFloat(amountGross) * 100)
    if (!cart) {
      logError('[PayFast ITN] Cart could not be loaded, not completing', undefined, {
        cartId,
        expected: null,
        received: receivedCents,
        pfPaymentId,
      })
    } else if (
      receivedCents !== Number(cart.total) ||
      (cart.currency_code != null && cart.currency_code.toLowerCase() !== 'zar')
    ) {
      logError('[PayFast ITN] Amount mismatch, not completing cart', undefined, {
        cartId,
        expected: Number(cart.total),
        received: receivedCents,
        currency: cart.currency_code ?? null,
        pfPaymentId,
      })
    } else {
      await completeCart(cartId)
    }
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
