import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { createClient } from '@supabase/supabase-js'
import { MEMBERSHIPS_MODULE } from '../modules/memberships'
import type MembershipsModuleService from '../modules/memberships/service'

// Strip trailing slash so URL construction never produces double slashes
const N8N_BASE_URL = (process.env.N8N_WEBHOOK_URL ?? 'http://n8n:5678').replace(/\/$/, '')
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? ''
const WEB_BASE_URL = (process.env.WEB_BASE_URL ?? 'http://web:3000').replace(/\/$/, '')
const VIBE_MARKETING_WEBHOOK_URL = (process.env.VIBE_MARKETING_WEBHOOK_URL ?? '').replace(/\/$/, '')

if (!N8N_WEBHOOK_SECRET) {
  console.warn('[order-placed] N8N_WEBHOOK_SECRET is not set — outgoing webhooks will have no secret header')
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  variant?: {
    product?: {
      metadata?: Record<string, unknown>
    }
  }
}

interface OrderCustomer {
  email?: string
}

interface RetrievedOrder {
  id: string
  customer_id: string
  customer?: OrderCustomer
  items?: OrderItem[]
  [key: string]: unknown
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

/**
 * Builds a Supabase admin client using the service role key.
 * Returns null and logs a warning when configuration is missing.
 */
function buildSupabaseAdmin(): ReturnType<typeof createClient> | null {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(
      '[order-placed] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set — Supabase member_subscriptions sync will be skipped'
    )
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
}

/**
 * Looks up the Supabase auth.users id by email.
 * Uses the Admin Auth API with the service role key — the profiles table does
 * not have an email column (email lives on auth.users).
 * NOTE: listUsers fetches up to 1000 users per page. For large member bases,
 * add an email column to profiles (with a sync trigger) in Task 3.2.
 */
async function lookupSupabaseUserId(
  supabase: ReturnType<typeof createClient>,
  email: string
): Promise<string | null> {
  const normalised = email.toLowerCase()
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (error) {
    console.error(`[order-placed] Supabase auth.admin.listUsers failed: ${error.message}`)
    return null
  }

  // supabase-js without a generated schema: data.users is typed as never[] in the
  // error union branch. Cast to a minimal shape after the error guard.
  type AuthUserMinimal = { id: string; email?: string | null }
  const users = data.users as AuthUserMinimal[]
  const user = users.find((u) => u.email?.toLowerCase() === normalised)
  return user?.id ?? null
}

interface MemberSubscriptionUpsert {
  user_id: string
  tier_id: string
  status: string
  start_date: string
  end_date: string | null
}

// Minimal table shape used to type the upsert call without generated Supabase types
interface SupabaseUpsertTable {
  upsert(
    values: MemberSubscriptionUpsert,
    options: { onConflict: string }
  ): Promise<{ error: { message: string } | null }>
}

/**
 * Upserts the member_subscriptions row for the given Supabase user.
 * Uses null end_date for the free tier (no expiry).
 * Never throws — failures are logged so the order is never blocked.
 */
async function syncSupabaseMembership(
  supabase: ReturnType<typeof createClient>,
  supabaseUserId: string,
  tier: string
): Promise<void> {
  const isFree = tier === 'free'
  const endDate = isFree
    ? null
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const payload: MemberSubscriptionUpsert = {
    user_id: supabaseUserId,
    tier_id: tier,
    status: 'active',
    start_date: new Date().toISOString(),
    end_date: endDate,
  }

  // supabase-js without generated types: cast to a locally-typed interface so the
  // payload shape is still verified at compile time without using 'any'
  const table = supabase.from('member_subscriptions') as unknown as SupabaseUpsertTable
  const { error } = await table.upsert(payload, { onConflict: 'user_id' })

  if (error) {
    console.error(
      `[order-placed] Supabase member_subscriptions upsert failed for user ${supabaseUserId}: ${error.message}`
    )
  } else {
    console.log(
      `[order-placed] Supabase member_subscriptions synced for user ${supabaseUserId} → tier=${tier}`
    )
  }
}

// ── Membership activation ─────────────────────────────────────────────────────

/**
 * Inspects the order's line items for a membership product, activates the
 * Medusa membership record, and syncs Supabase member_subscriptions.
 *
 * All Supabase I/O is fire-and-forget — failures never block the order.
 * The Medusa membership record is the source of truth; Supabase is a mirror.
 */
async function handleMembershipActivation(
  order: RetrievedOrder,
  container: SubscriberArgs<unknown>['container']
): Promise<void> {
  const items = order.items ?? []

  // Find the first line item whose product metadata marks it as a membership
  const membershipItem = items.find((item) => {
    const meta = item?.variant?.product?.metadata
    return meta && (meta as Record<string, unknown>).product_type === 'membership'
  })

  if (!membershipItem) {
    return // Order contains no membership products — nothing to do
  }

  const meta = membershipItem.variant?.product?.metadata as Record<string, unknown>
  const tier = typeof meta.tier === 'string' ? meta.tier : null

  if (!tier) {
    console.warn(
      `[order-placed] Membership product found in order ${order.id} but metadata.tier is missing — skipping activation`
    )
    return
  }

  console.log(
    `[order-placed] Activating membership tier="${tier}" for customer ${order.customer_id} (order ${order.id})`
  )

  // 1. Activate membership in the Medusa module (source of truth)
  const membershipsService = container.resolve<MembershipsModuleService>(MEMBERSHIPS_MODULE)

  let supabaseUserId: string | null = null

  // 2. Attempt Supabase sync — wrapped in try/catch so any failure is non-fatal
  try {
    const supabase = buildSupabaseAdmin()

    if (supabase) {
      const email = order.customer?.email
      if (email) {
        supabaseUserId = await lookupSupabaseUserId(supabase, email)
      }

      if (supabaseUserId) {
        // Fire-and-forget — do not await here so it never blocks Medusa activation
        void syncSupabaseMembership(supabase, supabaseUserId, tier).catch(
          (err: unknown) => {
            const message = err instanceof Error ? err.message : String(err)
            console.error(`[order-placed] Supabase sync error for order ${order.id}: ${message}`)
          }
        )
      } else {
        console.warn(
          `[order-placed] No Supabase user found for email ${order.customer?.email ?? '(unknown)'} — Supabase sync skipped`
        )
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[order-placed] Supabase setup error for order ${order.id}: ${message}`)
  }

  // Medusa activation is always attempted even if Supabase lookup failed
  await membershipsService.activateMembership(
    order.customer_id,
    tier,
    order.id,
    supabaseUserId ?? undefined
  )

  console.log(
    `[order-placed] Membership activated in Medusa for customer ${order.customer_id} → tier=${tier}`
  )

  // 3. Send membership welcome email — fire-and-forget
  const email = order.customer?.email
  if (email) {
    const customerAny = order.customer as Record<string, unknown>
    const firstName = typeof customerAny.first_name === 'string' ? customerAny.first_name : null
    void fetch(`${WEB_BASE_URL}/api/email/membership-welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(N8N_WEBHOOK_SECRET ? { 'x-webhook-secret': N8N_WEBHOOK_SECRET } : {}) },
      body: JSON.stringify({ email, firstName, tier }),
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[order-placed] membership welcome email failed for order ${order.id}: ${msg}`)
    })
  }
}

// ── Subscriber ────────────────────────────────────────────────────────────────

// The subscriber fires fire-and-forget side effects on order placement:
// 1. n8n webhook → Sage invoice creation (medusa-order-to-sage workflow)
// 1b. n8n webhook → Vtiger CRM contact/activity update
// 2. web app → PDF invoice generation → order confirmation email (chained sequentially)
// 3. Membership activation (Medusa module + Supabase mirror) when order contains a membership product
// 4. Vibe Marketing post-purchase onboarding for first-time non-membership customers
// None must ever block order completion.
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = data.id
  if (!orderId) return

  try {
    const orderService = container.resolve('order') as {
      retrieveOrder: (id: string, options?: object) => Promise<unknown>
      listOrders: (filters?: object, config?: object) => Promise<{ id: string }[]>
    }

    const order = await orderService.retrieveOrder(orderId, {
      relations: ['items', 'items.variant', 'items.variant.product', 'customer'],
    }) as RetrievedOrder

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(N8N_WEBHOOK_SECRET ? { 'x-webhook-secret': N8N_WEBHOOK_SECRET } : {}),
    }

    // 1. n8n → Sage: fire-and-forget, independent of invoice + email chain
    void fetch(`${N8N_BASE_URL}/webhook/medusa-order-placed`, {
      method: 'POST',
      headers,
      body: JSON.stringify(order),
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[order-placed] n8n webhook failed for order ${orderId}: ${message}`)
    })

    // 1b. n8n → Vtiger: fire-and-forget, separate from Sage workflow
    void fetch(`${N8N_BASE_URL}/webhook/medusa-order-vtiger`, {
      method: 'POST',
      headers,
      body: JSON.stringify(order),
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[order-placed] vtiger webhook failed for order ${orderId}: ${message}`)
    })

    // 2. Invoice generation → order confirmation email
    // Chained sequentially so the invoice URL is available when the email is sent.
    // The entire chain is fire-and-forget — any failure is logged, never propagated.
    void (async () => {
      let invoiceUrl: string | null = null

      try {
        const invoiceRes = await fetch(`${WEB_BASE_URL}/api/invoices/generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ orderId }),
        })

        if (invoiceRes.ok) {
          const invoiceData = (await invoiceRes.json()) as { invoiceUrl?: string }
          invoiceUrl = invoiceData.invoiceUrl ?? null
        } else {
          console.error(
            `[order-placed] invoice generation returned ${invoiceRes.status} for order ${orderId}`
          )
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[order-placed] invoice generation error for order ${orderId}: ${message}`)
      }

      // Send confirmation email regardless of whether invoice generation succeeded.
      // invoiceUrl will be null if generation failed — the email handles both cases.
      try {
        const confirmRes = await fetch(`${WEB_BASE_URL}/api/email/order-confirmation`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ orderId, invoiceUrl }),
        })
        if (!confirmRes.ok) {
          console.error(
            `[order-placed] order confirmation email returned ${confirmRes.status} for order ${orderId}`
          )
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[order-placed] order confirmation email error for order ${orderId}: ${message}`)
      }
    })().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[order-placed] invoice+email chain error for order ${orderId}: ${message}`)
    })

    // 3. Membership activation — fire-and-forget, never blocks order completion
    void handleMembershipActivation(order, container).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[order-placed] membership activation error for order ${orderId}: ${message}`)
    })

    // 4. Vibe Marketing — post-purchase onboarding for first-time customers.
    // Skipped for membership orders (Task 3.9 welcome email handles those).
    // Skipped when VIBE_MARKETING_WEBHOOK_URL is not set (graceful degradation).
    const isMembershipOrder = (order.items ?? []).some((item) => {
      const meta = item?.variant?.product?.metadata
      return meta && (meta as Record<string, unknown>).product_type === 'membership'
    })

    if (!isMembershipOrder && VIBE_MARKETING_WEBHOOK_URL) {
      void (async () => {
        try {
          // Fetch up to 2 of the customer's orders — if count is 1, this is their first.
          // Guard: > 1 (not !== 1) so a 0-result edge case fires Vibe rather than silently skips.
          const customerOrders = await orderService.listOrders(
            { customer_id: order.customer_id },
            { take: 2 }
          )
          if (!Array.isArray(customerOrders) || customerOrders.length > 1) return

          const email = order.customer?.email
          if (!email) return

          const customer = order.customer as Record<string, unknown>
          const orderAny = order as Record<string, unknown>
          const productNames = (order.items ?? [])
            .map((item) => {
              const itemAny = item as Record<string, unknown>
              return typeof itemAny.title === 'string' ? itemAny.title : null
            })
            .filter((name): name is string => name !== null)
            .join(', ')

          await fetch(`${VIBE_MARKETING_WEBHOOK_URL}/customer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              firstName: typeof customer.first_name === 'string' ? customer.first_name : null,
              lastName: typeof customer.last_name === 'string' ? customer.last_name : null,
              productName: productNames || null,
              orderTotal: typeof orderAny.total === 'number' ? orderAny.total / 100 : 0,
              currency: typeof orderAny.currency_code === 'string' ? orderAny.currency_code : 'zar',
              platform: 'suzanneravenall',
            }),
          }).then((res) => {
            if (!res.ok) {
              console.error(`[order-placed] Vibe Marketing webhook returned ${res.status} for order ${orderId}`)
            }
          }).catch((err: unknown) => {
            const message = err instanceof Error ? err.message : String(err)
            console.error(`[order-placed] Vibe Marketing webhook failed for order ${orderId}: ${message}`)
          })
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err)
          console.error(`[order-placed] Vibe Marketing first-order check failed for order ${orderId}: ${message}`)
        }
      })().catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[order-placed] Vibe Marketing IIFE error for order ${orderId}: ${message}`)
      })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    // Log but never throw — side-effect failures must not block order completion
    console.error(`[order-placed] failed to retrieve order ${orderId}: ${message}`)
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed',
}
