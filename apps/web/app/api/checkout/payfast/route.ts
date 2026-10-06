import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Builds the signed PayFast form for a cart. Guest checkout, like
// /api/checkout/free: the buyer does not need a portal account. The amount and
// email are read from the Medusa cart on the server, never from the request
// body, so a tampered client cannot sign a form for less than the cart total.
// The ITN webhook re-checks amount_gross against the cart before completing.

const bodySchema = z.object({
  // Accepted for backwards compatibility with the current client and ignored.
  amountInCents: z.number().optional(),
  itemName: z.string().min(1).max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  // Accepted and ignored: cart.email is the source of truth.
  email: z.string().max(200).optional(),
  cartId: z.string().min(1).max(100),
})

interface StoreCart {
  id: string
  email: string | null
  total: number
  currency_code?: string | null
  items?: unknown[]
  completed_at?: string | null
}

function medusaBase(): string {
  return (
    process.env.MEDUSA_BACKEND_URL ??
    process.env.NEXT_PUBLIC_MEDUSA_URL ??
    'http://medusa:9000'
  ).replace(/\/$/, '')
}

// PayFast signature: MD5 of URL-encoded, alpha-sorted key=value pairs + passphrase
function buildSignature(params: Record<string, string>, passphrase: string): string {
  const queryString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([, v]) => v !== '' && v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`)
    .join('&')

  const stringToHash = passphrase
    ? `${queryString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
    : queryString

  return createHash('md5').update(stringToHash).digest('hex')
}

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await req.json())
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const merchantId = process.env.PAYFAST_MERCHANT_ID ?? ''
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY ?? ''
  const passphrase = process.env.PAYFAST_PASSPHRASE ?? ''
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://suzanneravenall.com'

  if (!merchantId || !merchantKey) {
    return NextResponse.json(
      { error: 'Payment configuration missing' },
      { status: 500 }
    )
  }

  const { cartId } = parsed
  let cart: StoreCart
  try {
    const cartRes = await fetch(`${medusaBase()}/store/carts/${encodeURIComponent(cartId)}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '',
      },
    })
    if (cartRes.status === 404) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }
    if (!cartRes.ok) {
      return NextResponse.json({ error: 'Could not load cart' }, { status: 502 })
    }
    cart = ((await cartRes.json()) as { cart: StoreCart }).cart
  } catch (err) {
    console.error('[checkout/payfast] cart load error', {
      cartId,
      message: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Could not load cart' }, { status: 502 })
  }

  if (cart.completed_at) {
    return NextResponse.json(
      { error: 'This order has already been placed', alreadyPlaced: true },
      { status: 409 }
    )
  }
  if (!cart.items || cart.items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }
  if (!cart.email) {
    return NextResponse.json({ error: 'Add your email address first' }, { status: 400 })
  }
  // PayFast settles in ZAR only. A cart in another currency belongs on PayPal.
  if (cart.currency_code && cart.currency_code.toLowerCase() !== 'zar') {
    return NextResponse.json({ error: 'PayFast only accepts ZAR carts' }, { status: 400 })
  }
  const totalCents = Number(cart.total)
  if (!Number.isFinite(totalCents) || totalCents <= 0) {
    return NextResponse.json({ error: 'This cart has nothing to pay' }, { status: 400 })
  }

  // PayFast expects amount as decimal string with exactly 2 decimal places
  const amount = (totalCents / 100).toFixed(2)

  const params: Record<string, string> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    // The cart id lets the confirmation page check with Medusa that the ITN
    // has turned the cart into an order. PayFast adds nothing to return_url.
    return_url: `${siteUrl}/checkout/confirmation?gateway=payfast&m_payment_id=${encodeURIComponent(cartId)}`,
    cancel_url: `${siteUrl}/cart`,
    notify_url: `${siteUrl}/api/webhooks/payfast`,
    name_first: parsed.firstName,
    name_last: parsed.lastName,
    email_address: cart.email,
    m_payment_id: cartId,
    amount,
    item_name: parsed.itemName,
  }

  const signature = buildSignature(params, passphrase)
  const isSandbox = process.env.PAYFAST_SANDBOX === 'true'

  return NextResponse.json({
    params: { ...params, signature },
    endpoint: isSandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process',
  })
}
