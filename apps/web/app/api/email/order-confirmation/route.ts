import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual, createHash } from 'crypto'
import { sendOrderConfirmationEmail } from '@/lib/email/order-confirmation'
import type { OrderEmailData, OrderProductType } from '@/lib/email/types'

interface MedusaOrderItem {
  id: string
  title: string
  variant?: { title?: string }
  quantity: number
  unit_price: number
}

interface MedusaAdminOrder {
  id: string
  display_id: number
  created_at: string
  currency_code: string
  customer?: {
    first_name?: string
    last_name?: string
    email: string
  }
  items: MedusaOrderItem[]
  subtotal: number
  tax_total: number
  total: number
}

function verifySecret(provided: string, expected: string): boolean {
  try {
    const a = createHash('sha256').update(provided).digest()
    const b = createHash('sha256').update(expected).digest()
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[email/order-confirmation] N8N_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const provided = req.headers.get('x-webhook-secret') ?? ''
  if (!provided || !verifySecret(provided, webhookSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const medusaBase = process.env.MEDUSA_BACKEND_URL ?? 'http://medusa:9000'
  const medusaToken = process.env.MEDUSA_API_TOKEN
  if (!medusaToken) {
    console.error('[email/order-confirmation] MEDUSA_API_TOKEN is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  let orderId: string
  let invoiceUrl: string | null
  let productType: OrderProductType | undefined
  let calBookingUrl: string | null
  try {
    const body = (await req.json()) as {
      orderId?: unknown
      invoiceUrl?: unknown
      productType?: unknown
      calBookingUrl?: unknown
    }
    if (!body.orderId || typeof body.orderId !== 'string') {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }
    orderId = body.orderId
    invoiceUrl = typeof body.invoiceUrl === 'string' ? body.invoiceUrl : null
    const VALID_PRODUCT_TYPES: OrderProductType[] = ['session', 'self-paced', 'live', 'group', 'other']
    productType =
      typeof body.productType === 'string' && VALID_PRODUCT_TYPES.includes(body.productType as OrderProductType)
        ? (body.productType as OrderProductType)
        : undefined
    calBookingUrl = typeof body.calBookingUrl === 'string' ? body.calBookingUrl : null
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Fetch order from Medusa admin API
  let order: MedusaAdminOrder
  try {
    const fields = ['*items', '*items.variant', '*customer'].join(',')
    const res = await fetch(
      `${medusaBase}/admin/orders/${orderId}?fields=${encodeURIComponent(fields)}`,
      {
        headers: {
          Authorization: `Bearer ${medusaToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (res.status === 404) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(
        `[email/order-confirmation] Medusa fetch failed for ${orderId}: ${res.status} ${detail.slice(0, 200)}`
      )
      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 502 })
    }

    const data = (await res.json()) as { order: MedusaAdminOrder }
    order = data.order
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[email/order-confirmation] Medusa request error: ${msg}`)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 502 })
  }

  const customerEmail = order.customer?.email
  if (!customerEmail) {
    console.error(`[email/order-confirmation] order ${orderId} has no customer email — cannot send`)
    return NextResponse.json({ error: 'Order has no customer email' }, { status: 422 })
  }

  const emailOrder: OrderEmailData = {
    id: order.id,
    displayId: order.display_id,
    createdAt: order.created_at,
    currency: order.currency_code,
    firstName: order.customer?.first_name ?? null,
    email: customerEmail,
    items: order.items.map((item) => ({
      id: item.id,
      title: item.title,
      variantTitle: item.variant?.title ?? null,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    })),
    subtotal: order.subtotal,
    taxTotal: order.tax_total,
    total: order.total,
    productType,
    calBookingUrl,
  }

  try {
    const emailId = await sendOrderConfirmationEmail({ order: emailOrder, invoiceUrl })
    return NextResponse.json({ emailId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[email/order-confirmation] send failed for ${orderId}: ${msg}`)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
