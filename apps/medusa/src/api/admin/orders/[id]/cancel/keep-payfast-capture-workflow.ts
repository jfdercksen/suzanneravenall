import {
  createStep,
  createWorkflow,
  parallelize,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules, OrderWorkflowEvents } from "@medusajs/framework/utils"
import {
  cancelOrdersStep,
  cancelValidateOrder,
  deleteReservationsByLineItemsStep,
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/core-flows"

/**
 * Medusa's cancelOrderWorkflow without its refund step (KI087): cancels the
 * order, frees the reservations and cancels any uncaptured payment, but leaves
 * a captured PayFast payment captured because PayFast still holds the money.
 * The admin cancel route picks this workflow only for orders with a captured
 * PayFast balance (modules/payment-payfast/cancel-plan.ts) and then flags the
 * order for a manual refund in the PayFast portal.
 *
 * It lives beside its route, not in src/workflows (KI089): Medusa's workflow
 * loader imports src/workflows outside the require cache, so the route's import
 * composed it a second time. With Medusa 2.14.1, composing it twice made
 * complete-cart lose a parallel step (a checkpoint retry swaps the run's flow while
 * update-carts is still running), every cart completion stopped half way and
 * the store route answered 409. Import it from here only, never re-export it
 * into src/workflows.
 */

type Input = { order_id: string; uncaptured_payment_ids: string[] }

const cancelUncapturedPaymentsStep = createStep(
  "cancel-uncaptured-payments-keep-payfast",
  async (paymentIds: string[], { container }) => {
    const paymentModule = container.resolve(Modules.PAYMENT)
    for (const id of paymentIds) await paymentModule.cancelPayment(id)
    return new StepResponse(paymentIds)
  }
)

export const cancelOrderKeepPayfastCaptureWorkflow = createWorkflow(
  "cancel-order-keep-payfast-capture",
  (input: Input) => {
    const orderQuery = useQueryGraphStep({
      entity: "order",
      fields: ["id", "status", "items.id", "fulfillments.canceled_at"],
      filters: { id: input.order_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-order-keep-payfast" })
    const order = transform({ orderQuery }, ({ orderQuery }) => orderQuery.data[0])

    // Same guards as the core cancel: not already cancelled, not completed,
    // every fulfilment cancelled.
    cancelValidateOrder({ order, input: { order_id: input.order_id } })

    const lineItemIds = transform({ order }, ({ order }) =>
      ((order.items ?? []) as { id: string }[]).map((i) => i.id)
    )

    parallelize(
      deleteReservationsByLineItemsStep(lineItemIds),
      cancelUncapturedPaymentsStep(input.uncaptured_payment_ids),
      emitEventStep({ eventName: OrderWorkflowEvents.CANCELED, data: { id: input.order_id } })
    )

    cancelOrdersStep({ orderIds: [input.order_id] })

    return new WorkflowResponse(input.order_id)
  }
)
