import { createHash, timingSafeEqual } from "crypto"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { findStuckPayments, paymentReconcileMode, reconcileCart } from "../../../automations/payment-reconcile"
import { getAutomationQueue } from "../../../automations/runtime"
import type { RawSql } from "../../../modules/automations/pg-store"

// Called by the web app's PayPal webhook when PAYMENT.CAPTURE.COMPLETED
// arrives for a cart that is already completed (KI095): checks that cart's
// payment reached its order and repairs it once, or alerts staff. Internal:
// the web container calls http://medusa:9000 with the shared secret.
const CART_ID_RE = /^cart_[A-Za-z0-9]{10,40}$/

// Hashing first keeps the comparison constant-time whatever the lengths.
function secretMatches(given: string, expected: string): boolean {
  const digest = (v: string) => createHash("sha256").update(v).digest()
  return timingSafeEqual(digest(given), digest(expected))
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const expected = process.env.INTERNAL_WEBHOOK_SECRET || process.env.N8N_WEBHOOK_SECRET || ""
  if (!expected) {
    res.status(500).json({ message: "Server configuration error" })
    return
  }
  const given = req.headers["x-webhook-secret"]
  if (typeof given !== "string" || !secretMatches(given, expected)) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }
  const cartId = (req.body as { cart_id?: unknown } | undefined)?.cart_id
  if (typeof cartId !== "string" || !CART_ID_RE.test(cartId)) {
    res.status(400).json({ message: "cart_id is required" })
    return
  }
  if (paymentReconcileMode() === "off") {
    res.json({ status: "held" })
    return
  }
  try {
    const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as unknown as RawSql
    const status = await reconcileCart({
      find: (minAgeMs) => findStuckPayments(db, { now: new Date(), minAgeMs, cartId }),
      queue: getAutomationQueue(req.scope),
    })
    res.json({ status })
  } catch (err) {
    console.error(`[payment-reconcile] hook failed for ${cartId}: ${err instanceof Error ? err.message : String(err)}`)
    res.status(500).json({ message: "Reconcile failed" })
  }
}
