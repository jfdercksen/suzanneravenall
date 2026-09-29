/**
 * Whether a cart can still be recovered, read from Medusa's store API.
 *
 * Used by the cart-abandonment email route as the last gate before a send:
 * the n8n workflow waits hours between steps, so the cart may have been
 * ordered (or deleted) since the flow started.
 */

export type CartStatus = 'open' | 'completed' | 'not_found' | 'unknown'

function medusaBase(): string {
  return (process.env.MEDUSA_BACKEND_URL ?? 'http://medusa:9000').replace(/\/$/, '')
}

export async function getCartStatus(cartId: string): Promise<CartStatus> {
  try {
    const res = await fetch(
      `${medusaBase()}/store/carts/${encodeURIComponent(cartId)}?fields=id,completed_at`,
      {
        headers: {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '',
        },
        cache: 'no-store',
      }
    )
    if (res.status === 404) return 'not_found'
    if (!res.ok) return 'unknown'
    const body = (await res.json()) as { cart?: { completed_at?: string | null } }
    if (!body.cart) return 'unknown'
    return body.cart.completed_at ? 'completed' : 'open'
  } catch {
    return 'unknown'
  }
}
