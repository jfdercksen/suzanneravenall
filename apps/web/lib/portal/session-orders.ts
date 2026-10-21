import { logError } from '@/lib/log'
import { medusaAdminFetch } from '@/lib/medusa/admin-client'
import { getMedusaCustomerIds } from '@/lib/medusa/get-customer-id'
import { orderProductType, type OrderCategoryForType } from '@/lib/checkout/orderProductType'
import type { PurchasedSessionLine } from './session-credits'

// The member's private-session purchases, for the "Sessions still to book"
// list on /portal/appointments (I-13). Same admin client and customer lookup
// as the programmes page (KI078); the line is a session by the same rule the
// order mail and the confirmation page use, so a product that sends the Book
// Your Session link also shows up here.

interface MedusaOrderItem {
  title?: string | null
  quantity?: number | null
  product_title?: string | null
  product_handle?: string | null
  variant_title?: string | null
  variant?: {
    title?: string | null
    metadata?: Record<string, unknown> | null
    product?: {
      title?: string | null
      handle?: string | null
      metadata?: Record<string, unknown> | null
      categories?: OrderCategoryForType[] | null
    } | null
  } | null
}

export interface MedusaSessionOrder {
  id: string
  status: string
  payment_status?: string | null
  total?: number | null
  created_at: string
  items: MedusaOrderItem[] | null
}

const ORDER_FIELDS = [
  'id',
  'status',
  'payment_status',
  'total',
  'created_at',
  '*items',
  '*items.variant',
  '*items.variant.product',
  '*items.variant.product.categories',
  'items.variant.product.categories.parent_category.handle',
  'items.variant.product.categories.parent_category.parent_category.handle',
].join(',')

// Money taken (or held: PayFast orders before KI086 stay Authorized although
// PayFast has the money). Refunded, unpaid and failed orders give no sessions.
const PAID = new Set(['captured', 'partially_captured', 'authorized', 'partially_authorized', 'partially_refunded'])

/** A paid order, or a voucher order that came to R0 (the free checkout path). */
export function orderGivesSessions(order: Pick<MedusaSessionOrder, 'status' | 'payment_status' | 'total'>): boolean {
  if (order.status === 'canceled' || order.status === 'draft') return false
  if (order.payment_status && PAID.has(order.payment_status)) return true
  return typeof order.total === 'number' && order.total <= 0
}

/** The session lines of these orders, oldest order first. */
export function sessionLinesOf(orders: readonly MedusaSessionOrder[]): PurchasedSessionLine[] {
  const lines: PurchasedSessionLine[] = []
  for (const order of orders) {
    if (!orderGivesSessions(order)) continue
    for (const item of order.items ?? []) {
      if (orderProductType([item]) !== 'session') continue
      lines.push({
        productTitle: item.variant?.product?.title ?? item.product_title ?? item.title ?? null,
        productHandle: item.variant?.product?.handle ?? item.product_handle ?? null,
        variantTitle: item.variant?.title ?? item.variant_title ?? null,
        quantity: item.quantity ?? 1,
        purchasedAt: order.created_at,
      })
    }
  }
  return lines.sort((a, b) => a.purchasedAt.localeCompare(b.purchasedAt))
}

/**
 * Session lines from every order of every Medusa customer with this email.
 * Null when Medusa could not be read (logged), so the page can say so rather
 * than tell the member they have nothing left to book.
 */
export async function fetchMemberSessionLines(email: string): Promise<PurchasedSessionLine[] | null> {
  try {
    const customerIds = await getMedusaCustomerIds(email)
    if (customerIds.length === 0) return []

    const params = new URLSearchParams({ fields: ORDER_FIELDS, limit: '200', order: '-created_at' })
    for (const id of customerIds) params.append('customer_id[]', id)
    const res = await medusaAdminFetch(`/orders?${params.toString()}`)
    if (!res) return null
    if (!res.ok) {
      logError('[portal/session-orders] order lookup failed', undefined, { status: res.status })
      return null
    }
    const { orders } = (await res.json()) as { orders?: MedusaSessionOrder[] }
    return sessionLinesOf(orders ?? [])
  } catch (error) {
    logError('[portal/session-orders] fetch threw', error)
    return null
  }
}
