import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Completes a cart whose total is zero after a voucher, so the buyer never
// reaches a payment gateway. Guest checkout, like the PayFast ITN path: the
// only way a cart reaches a zero total is a valid promotion applied through
// Medusa, and Medusa re-checks the total on completion (validateCartPaymentsStep
// skips payment only when total <= 0), so this route cannot be used to take a
// paid cart for free.

const BodySchema = z.object({
  cartId: z.string().min(1).max(100),
})

interface StoreCart {
  id: string
  email: string | null
  total: number
  items?: unknown[]
  promotions?: { code: string | null }[]
  completed_at?: string | null
}

interface MedusaCompleteResponse {
  type: 'order' | 'cart'
  order?: { id: string; display_id: number; status: string }
  cart?: { id: string }
  error?: { message?: string }
  message?: string
}

function medusaBase(): string {
  return (
    process.env.MEDUSA_BACKEND_URL ??
    process.env.NEXT_PUBLIC_MEDUSA_URL ??
    'http://medusa:9000'
  ).replace(/\/$/, '')
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'cartId is required' }, { status: 400 })
  }
  const { cartId } = parsed.data

  const headers = {
    'Content-Type': 'application/json',
    'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '',
  }

  try {
    const cartRes = await fetch(`${medusaBase()}/store/carts/${encodeURIComponent(cartId)}`, { headers })
    if (cartRes.status === 404) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }
    if (!cartRes.ok) {
      return NextResponse.json({ error: 'Could not load cart' }, { status: 502 })
    }
    const { cart } = (await cartRes.json()) as { cart: StoreCart }

    if (cart.completed_at) {
      // Double submit or a retry after a dropped response: the order exists.
      return NextResponse.json({ error: 'This order has already been placed', alreadyPlaced: true }, { status: 409 })
    }
    if (!cart.items || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }
    if (!cart.email) {
      return NextResponse.json({ error: 'Add your email address first' }, { status: 400 })
    }
    if (!(cart.promotions ?? []).some((p) => p.code)) {
      return NextResponse.json({ error: 'No voucher on this cart' }, { status: 400 })
    }
    if (Number(cart.total) !== 0) {
      return NextResponse.json({ error: 'This cart still has an amount to pay' }, { status: 409 })
    }

    const res = await fetch(`${medusaBase()}/store/carts/${encodeURIComponent(cartId)}/complete`, {
      method: 'POST',
      headers,
    })
    const data = (await res.json()) as MedusaCompleteResponse

    if (!res.ok || data.type !== 'order' || !data.order) {
      console.error('[checkout/free] cart completion failed', {
        cartId,
        status: res.status,
        message: data.error?.message ?? data.message ?? null,
      })
      return NextResponse.json({ error: 'Could not place the order' }, { status: 502 })
    }

    return NextResponse.json({
      type: 'order',
      order: { id: data.order.id, display_id: data.order.display_id, status: data.order.status },
    })
  } catch (err) {
    console.error('[checkout/free] error', { cartId, message: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ error: 'Could not place the order' }, { status: 500 })
  }
}
