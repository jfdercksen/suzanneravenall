/**
 * How an admin cancel treats a PayFast payment (KI087).
 *
 * Medusa's core cancelOrderWorkflow refunds every captured payment through the
 * provider. PayFast has no refund API on this account, so the provider's
 * refundPayment moves no money, yet Medusa would still record the refund and
 * show the order as Refunded. A cancel of a captured PayFast order therefore
 * runs our own workflow instead: the order is cancelled, the PayFast payment
 * stays captured (which is the truth: PayFast still holds the money), and the
 * order is flagged for a manual refund in the PayFast merchant portal.
 *
 * Orders without a captured PayFast balance go through the core workflow
 * unchanged (PayPal refunds really happen, unpaid orders refund nothing).
 */

export type AmountLike = number | string | { numeric?: unknown } | null | undefined

export type CancelPlanPayment = {
  id: string
  provider_id?: string | null
  amount?: AmountLike
  captures?: { amount?: AmountLike }[] | null
  refunds?: { amount?: AmountLike }[] | null
}

export type CancelPlanOrder = {
  id: string
  payment_collections?: { payments?: CancelPlanPayment[] | null }[] | null
}

export type CancelPlan =
  | { kind: "core" }
  | { kind: "keep-payfast-capture"; payfastOutstanding: number; uncapturedPaymentIds: string[] }
  | { kind: "refuse"; message: string }

/** Fields the plan needs, for query.graph on the order. */
export const CANCEL_PLAN_FIELDS = [
  "id",
  "display_id",
  "currency_code",
  "metadata",
  "payment_collections.payments.id",
  "payment_collections.payments.provider_id",
  "payment_collections.payments.amount",
  "payment_collections.payments.captures.amount",
  "payment_collections.payments.refunds.amount",
]

export function isPayfastProvider(providerId: string | null | undefined): boolean {
  return typeof providerId === "string" && providerId.startsWith("pp_payfast")
}

export function toAmount(value: AmountLike): number {
  if (value && typeof value === "object") return Number(value.numeric ?? 0) || 0
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

const sum = (rows: { amount?: AmountLike }[] | null | undefined): number =>
  (rows ?? []).reduce((acc, row) => acc + toAmount(row.amount), 0)

/** Captured minus refunded, never below zero. */
export function outstandingCapture(payment: CancelPlanPayment): number {
  return Math.max(0, sum(payment.captures) - sum(payment.refunds))
}

export function planOrderCancel(order: CancelPlanOrder): CancelPlan {
  const payments = (order.payment_collections ?? []).flatMap((pc) => pc.payments ?? [])
  const payfastHeld = payments.filter((p) => isPayfastProvider(p.provider_id) && outstandingCapture(p) > 0)
  if (!payfastHeld.length) return { kind: "core" }

  // A second captured payment from another provider would need a real refund
  // that this path does not make. Orders here carry one payment, so this is a
  // guard, not a flow: staff resolve it by hand rather than half-refund.
  const otherHeld = payments.filter((p) => !isPayfastProvider(p.provider_id) && outstandingCapture(p) > 0)
  if (otherHeld.length) {
    return {
      kind: "refuse",
      message:
        "This order holds a captured PayFast payment and a captured payment from another provider. Refund the other payment first, then cancel again.",
    }
  }

  return {
    kind: "keep-payfast-capture",
    payfastOutstanding: payfastHeld.reduce((acc, p) => acc + outstandingCapture(p), 0),
    uncapturedPaymentIds: payments.filter((p) => !(p.captures ?? []).length).map((p) => p.id),
  }
}
