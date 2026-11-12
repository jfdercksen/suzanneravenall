import { addToCartWorkflow, createCartWorkflow } from "@medusajs/medusa/core-flows"
import { refuseNotForSale, variantIdsOf } from "../../lib/sale-guard"

/**
 * Refuses variants that are not on sale (metadata.sale_status, see
 * packages/integrations/src/saleStatus.ts) when a cart is created with items
 * or an item is added. The storefront adds through
 * POST /store/carts/:id/line-items, which runs addToCartWorkflow.
 *
 * Only Medusa's loader imports this file (KI089): it registers the handlers
 * once at start-up. Nothing else may import it.
 */

addToCartWorkflow.hooks.validate(async ({ input }, { container }) => {
  await refuseNotForSale(container, variantIdsOf(input.items))
})

createCartWorkflow.hooks.validate(async ({ input }, { container }) => {
  await refuseNotForSale(container, variantIdsOf((input as { items?: unknown }).items))
})
