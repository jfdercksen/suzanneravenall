import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { buildIntakePayload, intakeMode, postIntakeOrder, type IntakeOrder } from '../automations/intake'
import { ORDER_GRAPH_FIELDS } from '../automations/order-snapshot'
import { staffAlerter } from '../automations/runtime'
import { detectOrderProductType } from './order-placed'

/**
 * Intake forms (H-12): on every order, hand the lines to the web app, which
 * creates one intake record per service and mails the client the link to
 * their form. A separate subscriber from order-placed.ts so it can never hold
 * up or break the order mail; same product-type rule (KI082 fallback).
 *
 * The web call is retried for about a minute; after that the hourly job's
 * sweep (jobs/intake-reminders.ts) posts it again, and a final failure there
 * alerts staff. Never throws.
 */
export default async function orderPlacedIntakeHandler({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const orderId = data.id
  if (!orderId || intakeMode() !== 'code') return

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: orders } = await query.graph({
      entity: 'order',
      fields: [...ORDER_GRAPH_FIELDS, 'created_at'],
      filters: { id: orderId },
    })
    const order = orders[0] as unknown as IntakeOrder | undefined
    if (!order) return

    const payload = buildIntakePayload(order, (item) => detectOrderProductType([item as never]) === 'session')
    if (!payload) return

    await postIntakeOrder(payload)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[intake] order ${orderId} could not be handed to the web app (the hourly sweep retries it): ${message}`)
    void staffAlerter()
      .send({
        key: 'intake-order',
        subject: 'Intake form not sent yet for an order',
        lines: [
          `Order: ${orderId}`,
          `Error: ${message}`,
          'The hourly intake run tries again for 24 hours. If this repeats, check the web and medusa logs.',
        ],
      })
      .catch(() => undefined)
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed',
}
