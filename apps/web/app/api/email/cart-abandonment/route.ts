import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual, createHash } from 'crypto'
import { sendCartAbandonmentEmail1 } from '@/lib/email/cart-abandonment-1'
import { sendCartAbandonmentEmail2 } from '@/lib/email/cart-abandonment-2'
import { sendCartAbandonmentEmail3 } from '@/lib/email/cart-abandonment-3'
import { isEmailUnsubscribed } from '@/lib/email/suppression'
import type { CartEmailData, CartItem } from '@/lib/email/types'
import { logError } from '@/lib/log'

function verifySecret(provided: string, expected: string): boolean {
  try {
    const a = createHash('sha256').update(provided).digest()
    const b = createHash('sha256').update(expected).digest()
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function isValidTemplate(v: unknown): v is 1 | 2 | 3 {
  return v === 1 || v === 2 || v === 3
}

function parseItems(raw: unknown[]): CartItem[] {
  return raw
    .filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object' &&
        typeof (item as Record<string, unknown>).id === 'string' &&
        typeof (item as Record<string, unknown>).title === 'string' &&
        typeof (item as Record<string, unknown>).quantity === 'number' &&
        typeof (item as Record<string, unknown>).unit_price === 'number'
    )
    .map((item) => ({
      id: item.id as string,
      title: item.title as string,
      variant_title: typeof item.variant_title === 'string' ? item.variant_title : undefined,
      quantity: item.quantity as number,
      unit_price: item.unit_price as number,
      thumbnail: typeof item.thumbnail === 'string' ? item.thumbnail : undefined,
    }))
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET
  if (!webhookSecret) {
    logError('[email/cart-abandonment] N8N_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  const provided = req.headers.get('x-webhook-secret') ?? ''
  if (!provided || !verifySecret(provided, webhookSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    logError('[email/cart-abandonment] RESEND_API_KEY is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  let body: {
    template?: unknown
    cartId?: unknown
    email?: unknown
    firstName?: unknown
    items?: unknown
    total?: unknown
    currency?: unknown
    cartUrl?: unknown
  }

  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { template, cartId, email, firstName, items, total, currency, cartUrl } = body

  if (!isValidTemplate(template)) {
    return NextResponse.json({ error: 'template must be 1, 2, or 3' }, { status: 400 })
  }
  if (!cartId || typeof cartId !== 'string') {
    return NextResponse.json({ error: 'cartId is required' }, { status: 400 })
  }
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: 'items must be an array' }, { status: 400 })
  }

  const parsedItems = parseItems(items)
  if (parsedItems.length === 0 && items.length > 0) {
    return NextResponse.json({ error: 'items contains no valid line items' }, { status: 400 })
  }

  // POPIA: cart-abandonment emails are marketing — honour the suppression list.
  if (await isEmailUnsubscribed(email)) {
    return NextResponse.json({ skipped: true, reason: 'unsubscribed' })
  }

  const data: CartEmailData = {
    cartId,
    email,
    firstName: typeof firstName === 'string' ? firstName : undefined,
    items: parsedItems,
    total: typeof total === 'number' ? total : 0,
    currency: typeof currency === 'string' ? currency : 'ZAR',
    cartUrl: typeof cartUrl === 'string' ? cartUrl : '',
  }

  try {
    let emailId: string
    if (template === 1) {
      emailId = await sendCartAbandonmentEmail1(data)
    } else if (template === 2) {
      emailId = await sendCartAbandonmentEmail2(data)
    } else {
      emailId = await sendCartAbandonmentEmail3(data)
    }
    return NextResponse.json({ emailId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logError(`[email/cart-abandonment] send failed (template ${template}, cart ${cartId}): ${msg}`, err, { template, cartId })
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
