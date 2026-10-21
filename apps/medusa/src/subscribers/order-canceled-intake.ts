import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { intakeMode, postIntakeCancel } from '../automations/intake'

/**
 * Intake forms (H-12): a cancelled order's open forms are closed, so the
 * client gets no more reminders for a session they no longer have. A form
 * already completed is kept as it is. Never throws.
 */
export default async function orderCanceledIntakeHandler({ event: { data } }: SubscriberArgs<{ id: string }>) {
  const orderId = data.id
  if (!orderId || intakeMode() !== 'code') return
  try {
    await postIntakeCancel(orderId)
  } catch (err) {
    console.error(`[intake] could not close the intake forms of cancelled order ${orderId}: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const config: SubscriberConfig = {
  event: 'order.canceled',
}
