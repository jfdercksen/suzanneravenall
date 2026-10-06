/**
 * Reading an order for the automations.
 *
 * ORDER_GRAPH_FIELDS is the field list order-placed.ts has always used for the
 * n8n payload (moved here unchanged so the recovery sweep reads the same
 * shape). variant, product and customer are module links, so they must come
 * through the Query graph, never orderService.retrieveOrder (KI045).
 */

import { toOrderSnapshot, type OrderSnapshot } from "@suzanne/integrations"

export const ORDER_GRAPH_FIELDS = [
  "id",
  "display_id",
  "customer_id",
  "email",
  "currency_code",
  "total",
  "metadata",
  "items.*",
  "items.variant.*",
  "items.variant.product.*",
  "items.variant.product.categories.*",
  "customer.*",
  "billing_address.*",
  "shipping_address.*",
]

/**
 * The slice of the order the automations need, as plain JSON (BigNumber
 * totals become numbers, as they did on the way to n8n). A guest order's
 * email is copied onto the customer, like the subscriber does for n8n.
 * `created_at` falls back to `receivedAt`: n8n used the time the webhook
 * arrived, because the subscriber never sent created_at.
 */
export function buildOrderSnapshot(order: unknown, receivedAt: Date = new Date()): OrderSnapshot {
  const full = toOrderSnapshot(order)
  const customerEmail = full.customer?.email || full.email || null
  const addr = (a: OrderSnapshot["billing_address"]) =>
    a ? { first_name: a.first_name ?? null, last_name: a.last_name ?? null } : null

  return {
    id: full.id,
    display_id: full.display_id ?? null,
    total: full.total ?? null,
    created_at: full.created_at ?? receivedAt.toISOString(),
    email: full.email ?? null,
    customer: {
      email: customerEmail,
      first_name: full.customer?.first_name ?? null,
      last_name: full.customer?.last_name ?? null,
    },
    billing_address: addr(full.billing_address),
    shipping_address: addr(full.shipping_address),
    items: (full.items ?? []).map((item) => ({
      title: item?.title ?? null,
      variant: item?.variant
        ? {
            title: item.variant.title ?? null,
            metadata: item.variant.metadata ?? null,
            product: item.variant.product
              ? {
                  title: item.variant.product.title ?? null,
                  metadata: item.variant.product.metadata ?? null,
                }
              : null,
          }
        : null,
    })),
  }
}
