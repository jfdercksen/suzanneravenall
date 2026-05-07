import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

// Strip trailing slash so URL construction never produces double slashes
const N8N_BASE_URL = (process.env.N8N_WEBHOOK_URL ?? 'http://n8n:5678').replace(/\/$/, '')
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? ''
const WEB_BASE_URL = (process.env.WEB_BASE_URL ?? 'http://web:3000').replace(/\/$/, '')

if (!N8N_WEBHOOK_SECRET) {
  console.warn('[order-placed] N8N_WEBHOOK_SECRET is not set — outgoing webhooks will have no secret header')
}

// The subscriber fires three fire-and-forget side effects on order placement:
// 1. n8n webhook → Sage invoice creation (medusa-order-to-sage workflow)
// 2. web app → PDF invoice generation → order confirmation email (chained sequentially)
// None must ever block order completion.
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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(N8N_WEBHOOK_SECRET ? { 'x-webhook-secret': N8N_WEBHOOK_SECRET } : {}),
    }

    // 1. n8n → Sage: fire-and-forget, independent of invoice + email chain
    void fetch(`${N8N_BASE_URL}/webhook/medusa-order-placed`, {
      method: 'POST',
      headers,
      body: JSON.stringify(order),
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[order-placed] n8n webhook failed for order ${orderId}: ${message}`)
    })

    // 2. Invoice generation → order confirmation email
    // Chained sequentially so the invoice URL is available when the email is sent.
    // The entire chain is fire-and-forget — any failure is logged, never propagated.
    void (async () => {
      let invoiceUrl: string | null = null

      try {
        const invoiceRes = await fetch(`${WEB_BASE_URL}/api/invoices/generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ orderId }),
        })

        if (invoiceRes.ok) {
          const invoiceData = (await invoiceRes.json()) as { invoiceUrl?: string }
          invoiceUrl = invoiceData.invoiceUrl ?? null
        } else {
          console.error(
            `[order-placed] invoice generation returned ${invoiceRes.status} for order ${orderId}`
          )
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[order-placed] invoice generation error for order ${orderId}: ${message}`)
      }

      // Send confirmation email regardless of whether invoice generation succeeded.
      // invoiceUrl will be null if generation failed — the email handles both cases.
      try {
        const confirmRes = await fetch(`${WEB_BASE_URL}/api/email/order-confirmation`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ orderId, invoiceUrl }),
        })
        if (!confirmRes.ok) {
          console.error(
            `[order-placed] order confirmation email returned ${confirmRes.status} for order ${orderId}`
          )
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[order-placed] order confirmation email error for order ${orderId}: ${message}`)
      }
    })().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[order-placed] invoice+email chain error for order ${orderId}: ${message}`)
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
