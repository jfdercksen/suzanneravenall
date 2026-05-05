import { NextRequest, NextResponse } from 'next/server'

interface CompleteRequest {
  cartId: string
}

interface MedusaCompleteResponse {
  type: 'order' | 'cart' | 'swap'
  order?: { id: string; display_id: number; status: string }
  cart?: { id: string }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CompleteRequest
  const { cartId } = body

  if (!cartId || typeof cartId !== 'string') {
    return NextResponse.json({ error: 'cartId is required' }, { status: 400 })
  }

  // Use the internal Docker hostname for server-to-server calls.
  // Falls back to the public URL for local dev without Docker.
  const medusaBase =
    process.env.MEDUSA_BACKEND_URL ??
    process.env.NEXT_PUBLIC_MEDUSA_URL ??
    'http://medusa:9000'

  const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

  try {
    const res = await fetch(`${medusaBase}/store/carts/${cartId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': pubKey,
      },
    })

    const data = (await res.json()) as MedusaCompleteResponse

    if (!res.ok) {
      // Cart may already be completed (idempotent) — not necessarily an error
      return NextResponse.json(
        { error: 'Cart completion failed', detail: data },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
