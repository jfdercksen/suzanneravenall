import { NextRequest, NextResponse } from 'next/server'

// Read-only order status for the confirmation page. The page must not say
// "payment received" or empty the buyer's cart on the strength of the URL
// alone, so it asks here whether Medusa has actually turned the cart into an
// order (completed_at is set by cart completion, which the PayFast ITN, the
// PayPal capture and the free-order route all perform). Nothing is written.

// Medusa v2 cart ids: "cart_" plus a ULID. Also keeps the id path-safe.
const CART_ID_RE = /^cart_[A-Za-z0-9]{10,40}$/

function medusaBase(): string {
  return (
    process.env.MEDUSA_BACKEND_URL ??
    process.env.NEXT_PUBLIC_MEDUSA_URL ??
    'http://medusa:9000'
  ).replace(/\/$/, '')
}

export async function GET(req: NextRequest) {
  const cartId = req.nextUrl.searchParams.get('cartId') ?? ''
  if (!CART_ID_RE.test(cartId)) {
    return NextResponse.json({ status: 'not_found' }, { status: 404 })
  }

  try {
    const res = await fetch(`${medusaBase()}/store/carts/${cartId}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '',
      },
      cache: 'no-store',
    })
    if (res.status === 404) {
      return NextResponse.json({ status: 'not_found' }, { status: 404 })
    }
    if (!res.ok) {
      return NextResponse.json({ status: 'unknown' }, { status: 502 })
    }
    const { cart } = (await res.json()) as { cart?: { completed_at?: string | null } }
    if (!cart) {
      return NextResponse.json({ status: 'not_found' }, { status: 404 })
    }
    return NextResponse.json(
      { status: cart.completed_at ? 'completed' : 'pending' },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    console.error('[checkout/status] error', {
      cartId,
      message: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ status: 'unknown' }, { status: 502 })
  }
}
