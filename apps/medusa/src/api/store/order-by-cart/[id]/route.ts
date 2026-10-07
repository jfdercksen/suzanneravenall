import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// The order number for a completed cart, for the checkout confirmation page.
// The page only knows the cart id (PayFast returns m_payment_id = cart id, and
// the ITN completes the cart server-side), so without this it could only show
// the cart id. Reads the core order-cart link; returns the display number only,
// nothing about the buyer. 404 until the cart has become an order.
const CART_ID_RE = /^cart_[A-Za-z0-9]{10,40}$/

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cartId = req.params.id
  if (!CART_ID_RE.test(cartId ?? "")) {
    res.status(404).json({ message: "Not found" })
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: ["id", "order.id", "order.display_id"],
    filters: { id: cartId },
  })
  const order = (data[0] as { order?: { display_id?: number | null } | null } | undefined)?.order
  if (!order?.display_id) {
    res.status(404).json({ message: "Not found" })
    return
  }
  res.json({ display_id: order.display_id })
}
