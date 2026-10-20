/**
 * CartRecovery: one row per abandoned-cart reminder sequence (n8n migration
 * step 4, plan section 3.4).
 *
 * - cart_id is unique: every cart.updated event upserts the same row, so the
 *   key is the debounce (no in-memory timer, nothing lost on a restart).
 * - step: reminders sent so far (0..3). next_send_at is when reminder
 *   step + 1 is due; while step = 0 it is last_activity_at + the first delay.
 * - status: active (sequence running), completed (the cart was ordered),
 *   stopped (sequence done, cart gone or emptied, unsubscribed, or the send
 *   failed for good); stop_reason says which.
 *
 * The table is created by migrations/Migration20261020120000.ts. Reads and
 * writes go through raw SQL (cart-recovery-store.ts) for the upsert; this
 * model registers the table with Medusa and gives typed CRUD for inspection.
 */

import { model } from "@medusajs/framework/utils"

const CartRecovery = model.define("cart_recovery", {
  id: model.id({ prefix: "cartrec" }).primaryKey(),
  cart_id: model.text().unique("IDX_cart_recovery_cart_id_unique"),
  email: model.text(),
  first_name: model.text().nullable(),
  step: model.number().default(0),
  next_send_at: model.dateTime().nullable(),
  last_activity_at: model.dateTime(),
  status: model.text().default("active"),
  stop_reason: model.text().nullable(),
})

export default CartRecovery
