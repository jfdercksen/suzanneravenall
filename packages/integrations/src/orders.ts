/**
 * The slice of a Medusa order that the order automations read. It is the same
 * shape the Medusa `order.placed` subscriber posted to the n8n webhooks (the
 * Query graph result, JSON-serialised), so the n8n Code nodes and our code
 * read identical input.
 */

export type OrderAddress = { first_name?: string | null; last_name?: string | null } | null

export type OrderItemSnapshot = {
  title?: string | null
  variant?: {
    title?: string | null
    metadata?: Record<string, unknown> | null
    product?: {
      title?: string | null
      metadata?: Record<string, unknown> | null
    } | null
  } | null
}

export type OrderSnapshot = {
  id: string
  display_id?: number | string | null
  /** Medusa amount in cents, as the site stores ZAR prices (R1 660 = 166000). */
  total?: number | null
  created_at?: string | null
  email?: string | null
  customer?: { email?: string | null; first_name?: string | null; last_name?: string | null } | null
  billing_address?: OrderAddress
  shipping_address?: OrderAddress
  items?: OrderItemSnapshot[] | null
}

/**
 * Buyer email and names, exactly as both n8n workflows derived them:
 * email lowercased and trimmed; names from the customer, then the billing
 * address (or the shipping address when there is no billing address), then
 * the email's local part. Thinkific 422s on a blank last name, so the last
 * name falls back to the first name.
 */
export function orderBuyer(order: OrderSnapshot): { email: string; firstName: string; lastName: string } {
  const customer = order.customer ?? {}
  const email = String(customer.email ?? '').toLowerCase().trim()
  const addr = order.billing_address ?? order.shipping_address ?? {}
  const pick = (...vals: unknown[]): string =>
    (vals.find((v) => typeof v === 'string' && v.trim() !== '') as string | undefined) ?? ''
  const firstName = pick(customer.first_name, addr.first_name, email.split('@')[0])
  const lastName = pick(customer.last_name, addr.last_name, firstName)
  return { email, firstName, lastName }
}

/**
 * JSON round trip of the Query graph result: BigNumber totals become plain
 * numbers and only data survives, exactly what n8n received over HTTP.
 */
export function toOrderSnapshot(order: unknown): OrderSnapshot {
  return JSON.parse(JSON.stringify(order)) as OrderSnapshot
}
