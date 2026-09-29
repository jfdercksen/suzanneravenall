import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

const N8N_BASE_URL = (process.env.N8N_WEBHOOK_URL ?? 'http://n8n:5678').replace(/\/$/, '')
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? ''
// NEXT_PUBLIC_SITE_URL is passed to the Medusa container in docker-compose.yml
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  'https://suzanneravenall.com'
).replace(/\/$/, '')

// 30-minute debounce: cart.updated fires on every cart mutation (item add,
// quantity change, coupon apply, etc.). This gate ensures n8n is called at
// most once per 30 minutes per cart to avoid flooding the abandonment workflow.
const DEBOUNCE_MS = 30 * 60 * 1000
const queuedCarts = new Map<string, number>()

interface CartItem {
  id: string
  title: string
  variant_title?: string | null
  quantity: number | string
  unit_price: number | string
  thumbnail?: string | null
}

interface CartName {
  first_name?: string | null
}

interface Cart {
  id: string
  email?: string | null
  completed_at?: string | Date | null
  customer?: CartName | null
  billing_address?: CartName | null
  shipping_address?: CartName | null
  items?: CartItem[] | null
  total?: number | string | null
  currency_code?: string | null
}

function firstNameOf(cart: Cart): string {
  // Guest carts carry the name on the address, not on a customer record.
  return (
    cart.customer?.first_name ||
    cart.billing_address?.first_name ||
    cart.shipping_address?.first_name ||
    ''
  )
}

function totalOf(cart: Cart, items: CartItem[]): number {
  const total = Number(cart.total)
  if (Number.isFinite(total) && cart.total !== null && cart.total !== undefined) return total
  // Totals are computed fields; fall back to the line sum if they were not returned.
  return items.reduce((sum, item) => sum + Number(item.unit_price) * Number(item.quantity), 0)
}

export default async function cartUpdatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const cartId = data.id
  if (!cartId) return

  // Debounce: skip if this cart was already queued within the last 30 minutes
  const lastQueued = queuedCarts.get(cartId)
  if (lastQueued !== undefined && Date.now() - lastQueued < DEBOUNCE_MS) return
  queuedCarts.set(cartId, Date.now())

  try {
    // Customer and addresses are module links, not relations of the Cart module:
    // retrieveCart(..., { relations: ['customer'] }) throws on every call. Use Query.
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: carts } = await query.graph({
      entity: 'cart',
      fields: [
        'id',
        'email',
        'completed_at',
        'currency_code',
        'total',
        'items.*',
        'customer.first_name',
        'billing_address.first_name',
        'shipping_address.first_name',
      ],
      filters: { id: cartId },
    })
    const cart = carts[0] as unknown as Cart | undefined

    // Not recoverable: gone, already ordered, no address to write to, or empty.
    const items = cart?.items ?? []
    if (!cart || cart.completed_at || !cart.email || items.length === 0) {
      queuedCarts.delete(cartId)
      return
    }

    const cartUrl = `${SITE_URL}/checkout?cartId=${cartId}`

    void fetch(`${N8N_BASE_URL}/webhook/cart-updated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_WEBHOOK_SECRET ? { 'x-webhook-secret': N8N_WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify({
        cartId,
        email: cart.email,
        firstName: firstNameOf(cart),
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          variant_title: item.variant_title ?? undefined,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          thumbnail: item.thumbnail ?? undefined,
        })),
        total: totalOf(cart, items),
        currency: (cart.currency_code ?? 'ZAR').toUpperCase(),
        cartUrl,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          console.error(`[cart-updated] n8n webhook answered ${res.status} for cart ${cartId}`)
          queuedCarts.delete(cartId)
          return
        }
        console.log(`[cart-updated] abandonment flow queued for cart ${cartId}`)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[cart-updated] n8n webhook failed for cart ${cartId}: ${message}`)
        // Clear debounce on failure so the next cart update retries
        queuedCarts.delete(cartId)
      })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[cart-updated] failed to retrieve cart ${cartId}: ${message}`)
    queuedCarts.delete(cartId)
  }
}

export const config: SubscriberConfig = {
  event: 'cart.updated',
}
