import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

interface CompleteRequest {
  cartId: string
}

interface MedusaCompleteResponse {
  type: 'order' | 'cart' | 'swap'
  order?: { id: string; display_id: number; status: string }
  cart?: { id: string }
}

export async function POST(req: NextRequest) {
  // Require an authenticated Supabase session — cart completion must be
  // tied to a real user, not triggered anonymously.
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: CompleteRequest
  try {
    body = (await req.json()) as CompleteRequest
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

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
