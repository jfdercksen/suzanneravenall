import { NextRequest, NextResponse } from 'next/server'
import { bookerName, sessionBookingUrl, type SessionLine } from '@suzanne/integrations'
import type { OrderProductType } from '@/lib/email/types'
import { orderProductType, type OrderCategoryForType, type OrderLineForType } from '@/lib/checkout/orderProductType'
import { isPreorder, variantLabel } from '@/lib/shop/lineItem'
import { orderGateLink } from '@/lib/booking/order-link'

// Read-only order status for the confirmation page. The page must not say
// "payment received" or empty the buyer's cart on the strength of the URL
// alone, so it asks here whether Medusa has actually turned the cart into an
// order (completed_at is set by cart completion, which the PayFast ITN, the
// PayPal capture and the free-order route all perform). The one write: a
// session order's /book link (J-07), issued idempotently, the same row the
// order mail links to.

// Medusa v2 cart ids: "cart_" plus a ULID. Also keeps the id path-safe.
const CART_ID_RE = /^cart_[A-Za-z0-9]{10,40}$/

function medusaBase(): string {
  return (
    process.env.MEDUSA_BACKEND_URL ??
    process.env.NEXT_PUBLIC_MEDUSA_URL ??
    'http://medusa:9000'
  ).replace(/\/$/, '')
}

function storeHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '',
  }
}

// The buyer-facing order number ("Order #70", as in the confirmation email),
// via our Medusa route over the order-cart link. Null when it cannot be read;
// the page then simply shows no number.
async function fetchOrderNumber(cartId: string): Promise<number | null> {
  try {
    const res = await fetch(`${medusaBase()}/store/order-by-cart/${cartId}`, {
      headers: storeHeaders(),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const { display_id } = (await res.json()) as { display_id?: number }
    return typeof display_id === 'number' ? display_id : null
  } catch {
    return null
  }
}

// The Cal.com user page the session event types hang off, as in the order mail
// (apps/medusa order-placed). Server-only: read per request so the box env wins.
function sessionBookingBase(): string {
  const calUrl = (process.env.NEXT_PUBLIC_CAL_URL || 'https://cal.suzanneravenall.com').replace(/\/$/, '')
  return process.env.CALCOM_SESSION_BOOKING_URL || `${calUrl}/suzanneravenall`
}

interface CartLine {
  title?: string | null
  product_title?: string | null
  variant_title?: string | null
  subtitle?: string | null
  quantity?: number | null
  product_id?: string | null
  product_handle?: string | null
  variant_id?: string | null
}

interface StoreProduct {
  id: string
  title?: string | null
  handle?: string | null
  metadata?: Record<string, unknown> | null
  categories?: OrderCategoryForType[] | null
  variants?: Array<{ id: string; metadata?: Record<string, unknown> | null }> | null
}

/** One line as the confirmation page shows it (KI060, KI067). */
export interface ConfirmationLine {
  title: string
  variant: string | null
  quantity: number
  preorder: boolean
}

// The products behind the order's lines, with the categories and metadata the
// order mail decides its wording from. Empty when they cannot be read: the
// page then still lists the lines and uses the neutral next steps.
async function fetchLineProducts(productIds: string[]): Promise<StoreProduct[]> {
  if (productIds.length === 0) return []
  try {
    const params = new URLSearchParams({
      limit: String(productIds.length),
      // Two parent levels cover the whole tree (three deep), so a product in a
      // sub-category resolves the way the order mail resolves it (KI082).
      fields:
        'id,title,handle,metadata,*categories,*variants,categories.parent_category.handle,categories.parent_category.parent_category.handle',
    })
    productIds.forEach((id) => params.append('id[]', id))
    const res = await fetch(`${medusaBase()}/store/products?${params.toString()}`, {
      headers: storeHeaders(),
      cache: 'no-store',
    })
    if (!res.ok) return []
    const { products } = (await res.json()) as { products?: StoreProduct[] }
    return Array.isArray(products) ? products : []
  } catch {
    return []
  }
}

interface CartBuyer {
  email?: string | null
  billing_address?: { first_name?: string | null; last_name?: string | null } | null
  customer?: { first_name?: string | null; last_name?: string | null } | null
}

interface DescribedOrder {
  items: ConfirmationLine[]
  productType: OrderProductType
  /** The session event to book on, with the buyer filled in; session orders only (KI079). */
  bookingUrl: string | null
  /** The session line and buyer the /book link is issued for (J-07); not sent to the browser */
  gate: { line: SessionLine & { quantity: number }; name: string | null; email: string | null } | null
}

async function describeOrder(lines: CartLine[], buyer: CartBuyer): Promise<DescribedOrder> {
  const productIds = [...new Set(lines.map((l) => l.product_id).filter((id): id is string => Boolean(id)))]
  const products = new Map((await fetchLineProducts(productIds)).map((p) => [p.id, p]))

  const typed: OrderLineForType[] = lines.map((line) => {
    const product = line.product_id ? products.get(line.product_id) : undefined
    const variant = product?.variants?.find((v) => v.id === line.variant_id)
    return {
      variant: {
        metadata: variant?.metadata ?? null,
        product: {
          handle: product?.handle ?? line.product_handle ?? null,
          metadata: product?.metadata ?? null,
          categories: product?.categories ?? [],
        },
      },
    }
  })

  const items = lines.map((line): ConfirmationLine => {
    const product = line.product_id ? products.get(line.product_id) : undefined
    return {
      title: line.title ?? '',
      variant: variantLabel(line),
      quantity: typeof line.quantity === 'number' ? line.quantity : 1,
      preorder: isPreorder(product?.handle ?? line.product_handle),
    }
  })

  const productType = orderProductType(typed)
  let bookingUrl: string | null = null
  let gate: DescribedOrder['gate'] = null
  // The first session line decides the length, as in the order mail.
  const sessionIndex = productType === 'session' ? typed.findIndex((line) => orderProductType([line]) === 'session') : -1
  const index = productType === 'session' ? Math.max(sessionIndex, 0) : -1
  const line = index >= 0 ? lines[index] : undefined
  if (line) {
    const sessionLine = {
      // Same title rule as the order mail and the portal: product, snapshot, line.
      productTitle: (line.product_id ? products.get(line.product_id)?.title : null) ?? line.product_title ?? line.title,
      productHandle: typed[index]?.variant?.product?.handle,
      variantTitle: line.variant_title,
    }
    const name =
      bookerName(buyer.customer?.first_name, buyer.customer?.last_name) ??
      bookerName(buyer.billing_address?.first_name, buyer.billing_address?.last_name)
    bookingUrl = sessionBookingUrl(sessionBookingBase(), sessionLine, { name, email: buyer.email })
    gate = {
      line: { ...sessionLine, quantity: typeof line.quantity === 'number' ? line.quantity : 1 },
      name,
      email: buyer.email ?? null,
    }
  }

  return { items, productType, bookingUrl, gate }
}

export async function GET(req: NextRequest) {
  const cartId = req.nextUrl.searchParams.get('cartId') ?? ''
  if (!CART_ID_RE.test(cartId)) {
    return NextResponse.json({ status: 'not_found' }, { status: 404 })
  }

  try {
    const res = await fetch(`${medusaBase()}/store/carts/${cartId}`, {
      headers: storeHeaders(),
      cache: 'no-store',
    })
    if (res.status === 404) {
      return NextResponse.json({ status: 'not_found' }, { status: 404 })
    }
    if (!res.ok) {
      return NextResponse.json({ status: 'unknown' }, { status: 502 })
    }
    const { cart } = (await res.json()) as {
      cart?: { completed_at?: string | null; items?: CartLine[] | null } & CartBuyer
    }
    if (!cart) {
      return NextResponse.json({ status: 'not_found' }, { status: 404 })
    }
    if (!cart.completed_at) {
      return NextResponse.json({ status: 'pending', orderNumber: null }, { headers: { 'Cache-Control': 'no-store' } })
    }
    // What was bought, for the page's order lines and next steps. Only once
    // the cart is an order, so a pending page shows nothing it cannot stand by.
    const lines = Array.isArray(cart.items) ? cart.items : []
    const [orderNumber, described] = await Promise.all([
      fetchOrderNumber(cartId),
      lines.length > 0 ? describeOrder(lines, cart) : Promise.resolve(null),
    ])
    let response: Omit<DescribedOrder, 'gate'> | null = null
    if (described) {
      const { gate, ...shown } = described
      // The per-order /book link replaces the reusable Cal.com page once the
      // order number is known; if it cannot be issued the direct link stays.
      const gateLink = gate ? await orderGateLink({ displayId: orderNumber, ...gate }) : null
      response = gateLink ? { ...shown, bookingUrl: gateLink } : shown
    }
    return NextResponse.json(
      { status: 'completed', orderNumber, ...(response ?? {}) },
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
