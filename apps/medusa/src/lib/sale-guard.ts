import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { notForSaleMessage, saleStatusOf, type SaleStatus } from "@suzanne/integrations"

/**
 * The store-side guard for variants that are not on sale (Suzanne, 11 and 12
 * Nov 2026): a retired self-study edition, a live run with no date (register
 * interest), or a partner's product. The storefront never offers them, and
 * this refuses them in a cart, so a direct store API call cannot buy them
 * either. Wired in src/workflows/hooks/not-for-sale.ts.
 *
 * Kept outside src/workflows on purpose: nothing outside that folder may
 * import from it (KI089, src/__tests__/workflow-imports.test.ts).
 */

type VariantRow = {
  id: string
  title?: string | null
  metadata?: Record<string, unknown> | null
  product?: { title?: string | null } | null
}

type Query = {
  graph(input: { entity: string; fields: string[]; filters: Record<string, unknown> }): Promise<{ data: unknown[] }>
}

type Container = { resolve(key: string): unknown }

/** The variant ids of a cart workflow's `items` input, whatever shape the items take. */
export function variantIdsOf(items: unknown): string[] {
  if (!Array.isArray(items)) return []
  const ids = items
    .map((item) => (item && typeof item === "object" ? (item as { variant_id?: unknown }).variant_id : undefined))
    .filter((id): id is string => typeof id === "string" && id !== "")
  return [...new Set(ids)]
}

/** The first variant that may not go in a cart, with why, or null. */
export function firstNotForSale(rows: VariantRow[]): { row: VariantRow; status: SaleStatus } | null {
  for (const row of rows) {
    const status = saleStatusOf(row.metadata)
    if (status) return { row, status }
  }
  return null
}

/** The name a refusal uses: "Product title (variant title)". */
export function itemName(row: VariantRow): string {
  const product = row.product?.title?.trim()
  const variant = row.title?.trim()
  if (product && variant) return `${product} (${variant})`
  return product || variant || "This item"
}

/** Throws NOT_ALLOWED (HTTP 400) when any of the variants is not on sale. */
export async function refuseNotForSale(container: Container, variantIds: string[]): Promise<void> {
  if (variantIds.length === 0) return
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const { data } = await query.graph({
    entity: "product_variant",
    fields: ["id", "title", "metadata", "product.title"],
    filters: { id: variantIds },
  })
  const blocked = firstNotForSale(data as VariantRow[])
  if (blocked) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, notForSaleMessage(blocked.status, itemName(blocked.row)))
  }
}
