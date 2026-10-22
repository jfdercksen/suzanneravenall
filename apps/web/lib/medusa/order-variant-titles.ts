import { logError } from '@/lib/log'
import { medusaAdminFetch } from './admin-client'

interface OrderLineTitles {
  product_handle?: string | null
  variant_title?: string | null
}

/**
 * The variant titles of an order's lines, grouped by product handle ("90 min
 * in-person", "Package of 04 (60 min online)"). The intake mail uses them to
 * tell in-person from online sessions. Never throws: an empty map when the
 * order cannot be read (logged).
 */
export async function orderVariantTitles(orderId: string): Promise<Map<string, string[]>> {
  const titles = new Map<string, string[]>()
  try {
    const res = await medusaAdminFetch(
      `/orders/${encodeURIComponent(orderId)}?fields=id,items.product_handle,items.variant_title`,
      { signal: AbortSignal.timeout(5_000) },
    )
    if (!res) return titles
    if (!res.ok) {
      logError('[medusa/order-variant-titles] order lookup failed', undefined, { orderId, status: res.status })
      return titles
    }
    const { order } = (await res.json()) as { order?: { items?: OrderLineTitles[] | null } }
    for (const item of order?.items ?? []) {
      const handle = item.product_handle?.trim()
      const title = item.variant_title?.trim()
      if (!handle || !title) continue
      titles.set(handle, [...(titles.get(handle) ?? []), title])
    }
  } catch (error) {
    logError('[medusa/order-variant-titles] order lookup threw', error, { orderId })
  }
  return titles
}
