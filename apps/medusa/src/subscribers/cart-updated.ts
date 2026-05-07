import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

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
  variant?: { title?: string }
  quantity: number
  unit_price: number
  thumbnail?: string
}

interface Cart {
  id: string
  email?: string
  customer?: { first_name?: string; last_name?: string }
  items?: CartItem[]
  total?: number
  currency_code?: string
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
    const cartService = container.resolve('cart') as {
      retrieveCart: (id: string, options?: object) => Promise<Cart>
    }

    const cart = await cartService.retrieveCart(cartId, {
      relations: ['items', 'items.variant', 'customer'],
    })

    // Skip carts with no email or no items — not recoverable
    if (!cart.email || !cart.items?.length) {
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
        firstName: cart.customer?.first_name ?? '',
        items: cart.items.map((item) => ({
          id: item.id,
          title: item.title,
          variant_title: item.variant?.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
          thumbnail: item.thumbnail,
        })),
        total: cart.total ?? 0,
        currency: cart.currency_code ?? 'ZAR',
        cartUrl,
      }),
    }).catch((err: unknown) => {
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
