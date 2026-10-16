import { logError } from '@/lib/log'
import { medusaAdminFetch } from './admin-client'
import { getMedusaCustomerIds } from './get-customer-id'

// The one place the member portal turns Medusa orders into "my programmes".
// /portal/programmes lists the result; /portal/dashboard counts it (KI078).

interface MedusaOrderItem {
  id: string
  title: string
  thumbnail: string | null
  product_id?: string | null
  product_title?: string | null
  product_handle?: string | null
  variant?: {
    product_id?: string | null
    product?: {
      title?: string | null
      handle?: string | null
      thumbnail?: string | null
      metadata?: Record<string, unknown> | null
    } | null
  } | null
}

interface MedusaOrder {
  id: string
  status: string
  created_at: string
  items: MedusaOrderItem[] | null
}

export interface ProgrammeItem {
  id: string
  title: string
  thumbnailUrl: string | null
  purchasedAt: string
  deliveryMethod: string
  productHandle: string | null
}

const ORDER_FIELDS = 'id,status,created_at,*items,*items.variant,*items.variant.product'

async function fetchOrdersForCustomers(customerIds: string[]): Promise<MedusaOrder[]> {
  const params = new URLSearchParams({ fields: ORDER_FIELDS, limit: '100', order: '-created_at' })
  for (const id of customerIds) params.append('customer_id[]', id)

  const res = await medusaAdminFetch(`/orders?${params.toString()}`)
  if (!res) return []
  if (!res.ok) {
    logError('[medusa/member-programmes] order lookup failed', undefined, { status: res.status })
    return []
  }
  const { orders } = (await res.json()) as { orders?: MedusaOrder[] }
  return orders ?? []
}

function deliveryMethodOf(item: MedusaOrderItem): string {
  const raw = item.variant?.product?.metadata?.delivery_method
  return typeof raw === 'string' && raw.trim() ? raw : 'Self Study'
}

/**
 * Programmes the member has bought, newest order first, one entry per
 * product. Cancelled orders do not count. Returns [] both for a member with
 * no orders and when Medusa cannot be reached; the latter is logged.
 */
export async function fetchMemberProgrammes(email: string): Promise<ProgrammeItem[]> {
  try {
    const customerIds = await getMedusaCustomerIds(email)
    if (customerIds.length === 0) return []

    const orders = await fetchOrdersForCustomers(customerIds)
    const seen = new Set<string>()
    const programmes: ProgrammeItem[] = []

    for (const order of orders) {
      if (order.status === 'canceled') continue
      for (const item of order.items ?? []) {
        const product = item.variant?.product ?? null
        const productId = item.variant?.product_id ?? item.product_id ?? item.title
        if (seen.has(productId)) continue
        seen.add(productId)

        programmes.push({
          id: productId,
          title: product?.title ?? item.product_title ?? item.title,
          thumbnailUrl: product?.thumbnail ?? item.thumbnail ?? null,
          purchasedAt: order.created_at,
          deliveryMethod: deliveryMethodOf(item),
          productHandle: product?.handle ?? item.product_handle ?? null,
        })
      }
    }

    return programmes
  } catch (error) {
    logError('[medusa/member-programmes] fetch threw', error)
    return []
  }
}
