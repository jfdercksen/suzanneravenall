import type { SessionLine } from '@suzanne/integrations'
import { logError } from '@/lib/log'
import { bookingGateUrl, issueBookingToken } from './tokens'

export interface OrderGateLinkInput {
  orderId?: string | null
  displayId: number | null
  email: string | null | undefined
  name: string | null
  line: SessionLine & { quantity?: number | null }
}

/**
 * The /book/<token> link for a session order (J-07), or null when it cannot
 * be issued (no display id or email, table missing, database down; logged).
 * Callers then keep the direct Cal.com link: the webhook's over-limit check
 * still guards it. Never throws.
 */
export async function orderGateLink(input: OrderGateLinkInput): Promise<string | null> {
  const email = input.email?.trim()
  if (!email || !input.displayId) return null
  try {
    const record = await issueBookingToken({
      orderId: input.orderId,
      displayId: input.displayId,
      email,
      name: input.name,
      line: input.line,
    })
    return bookingGateUrl(record.token)
  } catch (error) {
    logError('[booking] gate link could not be issued; using the direct Cal.com link', error, {
      orderDisplayId: input.displayId,
    })
    return null
  }
}
