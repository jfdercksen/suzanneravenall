import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { maskEmail } from '@suzanne/integrations'
import {
  cartPayload,
  cartRecoveryMode,
  isRecoverable,
  loadCart,
  recordCartActivity,
  type QueryGraph,
} from '../automations/cart-recovery'
import { dryRun } from '../automations/config'
import { getCartRecoveryStore } from '../automations/runtime'

/**
 * cart.updated -> abandoned-cart reminders (n8n migration step 4), per
 * AUTOMATION_CART_RECOVERY (src/automations/cart-recovery.ts):
 *
 *   code - upsert the cart_recovery row (the unique cart_id is the debounce;
 *          reminder 1 is due 1 h after the LAST activity); the reminders are
 *          sent by jobs/cart-recovery.ts
 *   n8n  - post the cart to the n8n webhook as before (30 min debounce)
 *   off  - nothing
 */

const N8N_BASE_URL = (process.env.N8N_WEBHOOK_URL ?? 'http://n8n:5678').replace(/\/$/, '')
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? ''

// n8n mode only: cart.updated fires on every cart mutation (item add,
// quantity change, coupon apply, etc.). This gate ensures n8n is called at
// most once per 30 minutes per cart to avoid flooding the abandonment workflow.
const DEBOUNCE_MS = 30 * 60 * 1000
const queuedCarts = new Map<string, number>()

export default async function cartUpdatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const cartId = data.id
  if (!cartId) return

  const mode = cartRecoveryMode()
  if (mode === 'off') return

  if (mode === 'n8n') {
    // Debounce: skip if this cart was already queued within the last 30 minutes
    const lastQueued = queuedCarts.get(cartId)
    if (lastQueued !== undefined && Date.now() - lastQueued < DEBOUNCE_MS) return
    queuedCarts.set(cartId, Date.now())
  }

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as unknown as QueryGraph
    const cart = await loadCart(query, cartId)
    const completed = Boolean(cart?.completed_at)

    // Not recoverable: gone, already ordered, no address to write to, or empty.
    if (!isRecoverable(cart)) {
      queuedCarts.delete(cartId)
      // Close an open sequence now rather than at its next send (the route re-checks either way).
      if (mode === 'code' && completed && !dryRun()) {
        await getCartRecoveryStore(container).finish(cartId, 'completed', 'cart_completed')
      }
      return
    }

    if (mode === 'code') {
      if (dryRun()) {
        console.info(`[cart-updated:dry-run] would record activity for cart ${cartId} (${maskEmail(String(cart.email))})`)
        return
      }
      const { record, created } = await recordCartActivity(getCartRecoveryStore(container), cart)
      console.info(
        `[cart-updated] cart ${cartId} ${created ? 'recovery started' : 'activity recorded'}: ` +
          `step=${record.step} status=${record.status} next_send_at=${record.next_send_at?.toISOString() ?? 'none'}`
      )
      return
    }

    void fetch(`${N8N_BASE_URL}/webhook/cart-updated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_WEBHOOK_SECRET ? { 'x-webhook-secret': N8N_WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify(cartPayload(cart)),
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
    console.error(`[cart-updated] failed for cart ${cartId}: ${message}`)
    queuedCarts.delete(cartId)
  }
}

export const config: SubscriberConfig = {
  event: 'cart.updated',
}
