import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

const N8N_BASE_URL = (process.env.N8N_WEBHOOK_URL ?? 'http://n8n:5678').replace(/\/$/, '')
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? ''

export default async function productUpdatedHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  const productId = data.id
  if (!productId) return

  if (!N8N_WEBHOOK_SECRET) {
    console.error('[product-updated] N8N_WEBHOOK_SECRET is not set — aborting webhook to prevent unauthenticated outbound request')
    return
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-webhook-secret': N8N_WEBHOOK_SECRET,
  }

  void fetch(`${N8N_BASE_URL}/webhook/product-updated`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ productId }),
  }).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[product-updated] n8n webhook failed for product ${productId}: ${message}`)
  })
}

export const config: SubscriberConfig = {
  event: 'product.updated',
}
