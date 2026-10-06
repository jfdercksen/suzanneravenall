import { VtigerError, type VtigerClient, type VtigerRecord } from './vtiger'
import { findContactQuery } from './leads'
import { orderBuyer, type OrderSnapshot } from './orders'

/**
 * Medusa order -> Vtiger contact + Event, ported from
 * infra/n8n/workflows/medusa-order-to-vtiger.json as fixed for KI049 and
 * KI054 (proven on orders #13 and #14). Same module (Contacts), same dedupe
 * (by email), same fields, same Event.
 *
 * Differences, all listed in packages/integrations/README.md: an existing
 * contact is changed with `revise` (only the listed fields) instead of a
 * replacing `update`; the contact step and the Event step are recorded in
 * `state`, so a retry after a failed Event never adds this order's total to
 * cf_total_spend_zar a second time.
 */

export const SHOP_LEAD_SOURCE = 'Shop'
export const CLOSED_WON_STAGE = 'Closed Won'

/** n8n IF "Validate: Required Fields": customer email present and total >= 0. */
export function orderValidForVtiger(order: OrderSnapshot): boolean {
  const email = order.customer?.email
  const total = Number(order.total)
  return typeof email === 'string' && email !== '' && order.total !== null && order.total !== undefined && total >= 0
}

/** n8n "Prepare: Extract Order Data" (minus the Vtiger env, which the client holds). */
export function prepareOrderForVtiger(order: OrderSnapshot, now: Date = new Date()) {
  const { email, firstName, lastName } = orderBuyer(order)
  const totalZar = (Number(order.total ?? 0) || 0) / 100
  const raw = order.created_at as unknown
  const createdAt = typeof raw === 'string' && raw ? raw : raw instanceof Date ? raw.toISOString() : now.toISOString()
  const productNames = (order.items ?? [])
    .map((item) => {
      const product = item.variant?.product?.title ?? item.title ?? 'Unknown'
      const variant = item.variant?.title
      return variant && variant !== 'Default' ? `${product} - ${variant}` : product
    })
    .join(', ')
  return {
    email,
    firstName,
    lastName,
    totalZar,
    createdAt,
    productNames,
    orderId: order.id,
    displayId: order.display_id,
  }
}

export type PreparedVtigerOrder = ReturnType<typeof prepareOrderForVtiger>

/** n8n "Prepare: New Contact Payload". */
export function newOrderContactElement(prep: PreparedVtigerOrder, userId: string) {
  return {
    email: prep.email,
    firstname: prep.firstName || prep.email.split('@')[0],
    lastname: prep.lastName || prep.firstName || prep.email.split('@')[0], // Vtiger: lastname is mandatory
    assigned_user_id: userId,
    leadsource: SHOP_LEAD_SOURCE,
    cf_last_purchase_date: prep.createdAt.slice(0, 10),
    cf_total_spend_zar: String(prep.totalZar.toFixed(2)),
    cf_pipeline_stage: CLOSED_WON_STAGE,
  }
}

/** n8n "Prepare: Update Existing Contact": spend incremented, mandatory fields travel along. */
export function existingOrderContactElement(
  existing: VtigerRecord,
  prep: PreparedVtigerOrder,
  userId: string,
): VtigerRecord {
  const raw = existing as Record<string, unknown>
  const existingSpend = parseFloat(String(raw.cf_total_spend_zar ?? '0')) || 0
  const newSpend = (existingSpend + prep.totalZar).toFixed(2)
  return {
    id: existing.id,
    assigned_user_id: (raw.assigned_user_id as string | undefined) ?? userId,
    firstname: (raw.firstname as string | undefined) ?? prep.firstName,
    lastname: (raw.lastname as string | undefined) || prep.lastName || prep.firstName,
    email: (raw.email as string | undefined) ?? prep.email,
    cf_last_purchase_date: prep.createdAt.slice(0, 10),
    cf_total_spend_zar: String(newSpend),
    cf_pipeline_stage: CLOSED_WON_STAGE,
  }
}

/** n8n "Prepare: Activity Payload" (an Event, KI054 e). Times are UTC, as the n8n container ran in UTC. */
export function orderEventElement(prep: PreparedVtigerOrder, contactId: string, userId: string) {
  const totalDisplay = `R${prep.totalZar.toFixed(2)}`
  const subject = `Purchase - ${prep.productNames}, ${totalDisplay}`
  const time = new Date(prep.createdAt).toISOString().slice(11, 19)
  return {
    activitytype: 'Call',
    subject: subject.slice(0, 255),
    description: `Order ID: ${prep.orderId}. Products: ${prep.productNames}. Total: ${totalDisplay}`,
    assigned_user_id: userId,
    contact_id: contactId,
    date_start: prep.createdAt.slice(0, 10),
    time_start: time,
    due_date: prep.createdAt.slice(0, 10),
    time_end: time,
    duration_hours: '0',
    duration_minutes: '15',
    eventstatus: 'Held',
  }
}

export type OrderVtigerState = {
  /** Set once the contact was created or revised for this order. */
  contactId?: string
  contactCreated?: boolean
  /** Set once the Event exists. */
  eventId?: string
}

export type OrderVtigerResult = { contactId: string; eventId: string; created: boolean }

const REVISE_UNSUPPORTED = new Set(['UNKNOWN_OPERATION', 'OPERATION_NOT_SUPPORTED', 'INVALID_OPERATION'])

/**
 * Finds the contact by email, creates it or adds this order to it, then logs
 * one Event. Each finished step is written to `state` and passed to `save`
 * before the next one starts. Throws on any Vtiger failure.
 */
export async function syncOrderToVtiger(
  client: VtigerClient,
  prep: PreparedVtigerOrder,
  state: OrderVtigerState,
  opts: { save?: (state: OrderVtigerState) => Promise<void> } = {},
): Promise<OrderVtigerResult> {
  const save = opts.save ?? (async () => {})
  const userId = await client.userId()

  if (!state.contactId) {
    const [existing] = await client.query<VtigerRecord>(findContactQuery(prep.email))
    if (existing && typeof existing.id === 'string') {
      const element = existingOrderContactElement(existing, prep, userId)
      let id: string
      try {
        id = (await client.revise(element)).id
      } catch (err) {
        if (!(err instanceof VtigerError) || !REVISE_UNSUPPORTED.has(err.code)) throw err
        // Instance without `revise`: read-merge-update, so no field is dropped.
        id = (await client.update({ ...existing, ...element })).id
      }
      state.contactId = id
      state.contactCreated = false
    } else {
      state.contactId = (await client.create('Contacts', newOrderContactElement(prep, userId))).id
      state.contactCreated = true
    }
    await save(state)
  }

  if (!state.eventId) {
    state.eventId = (await client.create('Events', orderEventElement(prep, state.contactId, userId))).id
    await save(state)
  }

  return { contactId: state.contactId, eventId: state.eventId, created: state.contactCreated ?? false }
}
