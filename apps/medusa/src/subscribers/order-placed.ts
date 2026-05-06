import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

// Strip trailing slash so URL construction never produces double slashes
const N8N_BASE_URL = (process.env.N8N_WEBHOOK_URL ?? 'http://n8n:5678').replace(/\/$/, '')
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? ''
const WEB_BASE_URL = (process.env.WEB_BASE_URL ?? 'http://web:3000').replace(/\/$/, '')

if (!N8N_WEBHOOK_SECRET) {
  console.warn('[order-placed] N8N_WEBHOOK_SECRET is not set — outgoing webhooks will have no secret header')
}

// The subscriber fires two fire-and-forget side effects on order placement:
// 1. n8n webhook → Sage invoice creation (medusa-order-to-sage workflow)
// 2. web app → PDF invoice generation + Supabase Storage upload
// Neither must ever block order completion.
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

    // PDF invoice generation — fire-and-forget
    void fetch(`${WEB_BASE_URL}/api/invoices/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_WEBHOOK_SECRET ? { 'x-webhook-secret': N8N_WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify({ orderId }),
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[order-placed] invoice generation failed for order ${orderId}: ${message}`)
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    // Log but never throw — side-effect failures must not block order completion
    console.error(`[order-placed] failed to retrieve order ${orderId}: ${message}`)
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed',
}
