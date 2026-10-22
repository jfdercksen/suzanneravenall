import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { cancelOrderWorkflow } from "@medusajs/core-flows"
import {
  CANCEL_PLAN_FIELDS,
  planOrderCancel,
  type CancelPlanOrder,
} from "../../../../../modules/payment-payfast/cancel-plan"
import { cancelOrderKeepPayfastCaptureWorkflow } from "./keep-payfast-capture-workflow"
import { staffAlerter } from "../../../../../automations/runtime"

/**
 * Overrides Medusa's POST /admin/orders/:id/cancel (a project route at the
 * same path replaces the core one; the core middlewares for this path, auth
 * and the query config, still run first).
 *
 * KI087: the core cancel refunds captured payments through the provider, and
 * for PayFast that records a refund although no money moves (no refund API on
 * this account). For an order with a captured PayFast balance we cancel the
 * order, leave the payment captured, flag the order metadata and alert staff
 * to refund in the PayFast merchant portal. Everything else goes to the core
 * workflow exactly as before.
 */

type PlanOrder = CancelPlanOrder & {
  display_id?: number | null
  currency_code?: string | null
  metadata?: Record<string, unknown> | null
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const orderId = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({ entity: "order", fields: CANCEL_PLAN_FIELDS, filters: { id: orderId } })
  const order = data[0] as PlanOrder | undefined
  const plan = order ? planOrderCancel(order) : ({ kind: "core" } as const)

  if (plan.kind === "refuse") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, plan.message)

  if (plan.kind === "core" || !order) {
    // An unknown id also lands here so the core workflow answers 404 as before.
    await cancelOrderWorkflow(req.scope).run({
      input: { order_id: orderId, canceled_by: req.auth_context.actor_id },
    })
  } else {
    await cancelOrderKeepPayfastCaptureWorkflow(req.scope).run({
      input: { order_id: orderId, uncaptured_payment_ids: plan.uncapturedPaymentIds },
    })
    await flagManualRefund(req, order, plan.payfastOutstanding)
  }

  const { data: fresh } = await query.graph({
    entity: "order",
    fields: req.queryConfig?.fields ?? ["id", "status"],
    filters: { id: orderId },
  })
  res.status(200).json({ order: fresh[0] })
}

/**
 * The cancel has happened by now, so a failure here must not turn it into an
 * error response: the metadata write and the alert each fail on their own and
 * are logged. Medusa has no Sentry SDK; the staff alert is its failure channel,
 * so a failed flag write is named in the alert. The alerter never throws.
 */
async function flagManualRefund(req: AuthenticatedMedusaRequest, order: PlanOrder, amountCents: number) {
  const currency = (order.currency_code ?? "zar").toUpperCase()
  const label = order.display_id ? `#${order.display_id}` : order.id
  // This store keeps amounts in cents (16500 = R165.00), as the PayFast
  // provider does; staff refund in rand, so the flag and the alert use rand.
  const amount = Math.round(amountCents) / 100
  const formatted = `${currency} ${amount.toFixed(2)}`

  let flagSaved = true
  try {
    // Re-read the metadata: order.canceled subscribers may have written to it
    // since the plan read the order, and the update replaces the whole object.
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({ entity: "order", fields: ["id", "metadata"], filters: { id: order.id } })
    const current = (data[0] as { metadata?: Record<string, unknown> | null } | undefined)?.metadata ?? order.metadata ?? {}
    const orderModule = req.scope.resolve(Modules.ORDER)
    await orderModule.updateOrders(order.id, {
      metadata: {
        ...current,
        payfast_refund_required: true,
        payfast_refund_amount: amount,
        payfast_refund_note:
          "Cancelled with the PayFast payment still captured. Refund the customer in the PayFast merchant portal, then record it with Refund on the payment in the admin.",
        payfast_refund_flagged_at: new Date().toISOString(),
      },
    })
  } catch (err) {
    flagSaved = false
    console.error(
      `[payfast-cancel] order ${label} cancelled but the refund flag was not saved: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  await staffAlerter().send({
    key: `payfast-refund-${order.id}`,
    subject: `Refund order ${label} in PayFast (${formatted})`,
    lines: [
      `Order ${label} was cancelled in the admin. Its PayFast payment of ${formatted} is still captured: no money has gone back to the customer.`,
      "Refund it in the PayFast merchant portal (Transactions, find the payment, Refund).",
      "Then open the order in the admin and use Refund on the payment so the books show it.",
      ...(flagSaved
        ? []
        : [`The refund flag could not be saved on the order (id ${order.id}), so this mail is the only record: keep it until the refund is done.`]),
    ],
  })
}
