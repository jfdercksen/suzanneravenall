/**
 * MembershipSubscription — custom Medusa v2 module entity.
 *
 * Tracks which Medusa customer holds a membership tier and its lifecycle state.
 * The Medusa record is the source of truth for the commerce layer; a separate
 * Supabase row in member_subscriptions mirrors it for RLS-gated content access.
 */

import { model } from "@medusajs/framework/utils"

const MembershipSubscription = model.define("membership_subscription", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  tier_id: model.text(),
  status: model.text().default("active"),
  started_at: model.dateTime(),
  expires_at: model.dateTime().nullable(),
  medusa_order_id: model.text().nullable(),
  supabase_user_id: model.text().nullable(),
})

export default MembershipSubscription
