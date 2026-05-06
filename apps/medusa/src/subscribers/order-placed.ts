import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

// Strip trailing slash so URL construction never produces double slashes
const N8N_BASE_URL = (process.env.N8N_WEBHOOK_URL ?? 'http://n8n:5678').replace(/\/$/, '')
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? ''

if (!N8N_WEBHOOK_SECRET) {
  console.warn('[order-placed] N8N_WEBHOOK_SECRET is not set — outgoing webhooks will have no secret header')
}

// The subscriber's only job is to fire the n8n webhook (fire-and-forget).
// n8n handles all Sage API calls via the medusa-order-to-sage workflow.
// The SageService module is available for direct Medusa admin actions / manual sync.
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = data.id
  if (!orderId) return

  try {
    const orderService = container.resolve('order') as {
      retrieveOrder: (id: string, options?: object) => Promise<unknown>
    }

    const order = await orderService.retrieveOrder(orderId, {
      relations: ['items', 'items.variant', 'items.variant.product', 'customer'],
    })

    // Fire-and-forget — never await, never throw, never block order completion
    void fetch(`${N8N_BASE_URL}/webhook/medusa-order-placed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_WEBHOOK_SECRET ? { 'x-webhook-secret': N8N_WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify(order),
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[order-placed] n8n webhook failed for order ${orderId}: ${message}`)
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    // Log but never throw — Sage sync failure must not block order completion
    console.error(`[order-placed] failed to retrieve order ${orderId} for Sage sync: ${message}`)
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed',
}
