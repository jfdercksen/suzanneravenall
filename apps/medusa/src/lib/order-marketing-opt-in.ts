/**
 * Whether the buyer opted in to marketing at checkout: the cart metadata the
 * web checkout writes (apps/web/lib/consent/marketing.ts marketingCartMetadata)
 * and that reaches the order. Anything else, including no choice, is a no.
 */
export function orderMarketingOptIn(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== "object") return false
  const meta = metadata as Record<string, unknown>
  if (meta.marketing_opt_in !== "true") return false
  const channels = meta.marketing_channels
  return typeof channels === 'string' && channels.split(',').some((c) => ['email', 'whatsapp', 'sms'].includes(c.trim()))
}
