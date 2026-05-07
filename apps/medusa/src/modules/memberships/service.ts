/**
 * MembershipsModuleService — Medusa v2 module service.
 *
 * Extends MedusaService with auto-generated CRUD for MembershipSubscription,
 * plus three domain methods: activateMembership, cancelMembership,
 * and getMembershipStatus.
 */

import { MedusaService } from "@medusajs/framework/utils"
import { InferEntityType } from "@medusajs/types"
import MembershipSubscription from "./models/membership-subscription"

const FREE_TIER = "free"
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

type MembershipRecord = InferEntityType<typeof MembershipSubscription>

class MembershipsModuleService extends MedusaService({
  MembershipSubscription,
}) {
  /**
   * Creates or updates the membership record for a customer.
   * Free-tier subscriptions never expire (expires_at = null).
   * Paid-tier subscriptions expire in 30 days from activation.
   */
  async activateMembership(
    customerId: string,
    tier: string,
    orderId: string,
    supabaseUserId?: string
  ): Promise<MembershipRecord> {
    const expiresAt =
      tier === FREE_TIER
        ? null
        : new Date(Date.now() + THIRTY_DAYS_MS)

    const existing = await this.listMembershipSubscriptions({
      customer_id: customerId,
    })

    if (existing.length > 0) {
      const record = existing[0]
      const updated = await this.updateMembershipSubscriptions(
        { id: record.id },
        {
          tier_id: tier,
          status: "active",
          // Preserve the original started_at — only reset it when reactivating a cancelled subscription
          ...(record.status === "cancelled" ? { started_at: new Date() } : {}),
          expires_at: expiresAt,
          medusa_order_id: orderId,
          ...(supabaseUserId !== undefined
            ? { supabase_user_id: supabaseUserId }
            : {}),
        }
      )
      return (Array.isArray(updated) ? updated[0] : updated) as MembershipRecord
    }

    const created = await this.createMembershipSubscriptions({
      customer_id: customerId,
      tier_id: tier,
      status: "active",
      started_at: new Date(),
      expires_at: expiresAt,
      medusa_order_id: orderId,
      supabase_user_id: supabaseUserId ?? null,
    })
    return (Array.isArray(created) ? created[0] : created) as MembershipRecord
  }

  /**
   * Cancels the membership for a customer by setting status = "cancelled"
   * and expires_at = now.
   * Returns null if no membership record exists.
   */
  async cancelMembership(
    customerId: string
  ): Promise<MembershipRecord | null> {
    const existing = await this.listMembershipSubscriptions({
      customer_id: customerId,
    })

    if (existing.length === 0) {
      return null
    }

    const record = existing[0]
    const updated = await this.updateMembershipSubscriptions(
      { id: record.id },
      {
        status: "cancelled",
        expires_at: new Date(),
      }
    )
    return (Array.isArray(updated) ? updated[0] : updated) as MembershipRecord
  }

  /**
   * Returns the active membership subscription for a customer, or null.
   */
  async getMembershipStatus(
    customerId: string
  ): Promise<MembershipRecord | null> {
    const records = await this.listMembershipSubscriptions({
      customer_id: customerId,
      status: "active",
    })

    if (records.length === 0) {
      return null
    }

    return records[0] as MembershipRecord
  }
}

export default MembershipsModuleService
