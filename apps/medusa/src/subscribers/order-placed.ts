import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { createClient } from '@supabase/supabase-js'
import { MEMBERSHIPS_MODULE } from '../modules/memberships'
import type MembershipsModuleService from '../modules/memberships/service'

const N8N_BASE_URL = (process.env.N8N_WEBHOOK_URL ?? 'http://n8n:5678').replace(/\/$/, '')
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? ''
const WEB_BASE_URL = (process.env.WEB_BASE_URL ?? 'http://web:3000').replace(/\/$/, '')
const VIBE_MARKETING_WEBHOOK_URL = (process.env.VIBE_MARKETING_WEBHOOK_URL ?? '').replace(/\/$/, '')
const CALCOM_SESSION_BOOKING_URL = process.env.CALCOM_SESSION_BOOKING_URL ?? 'https://cal.com/suzanneravenall/discovery-call'

if (!N8N_WEBHOOK_SECRET) {
  console.warn('[order-placed] N8N_WEBHOOK_SECRET is not set — outgoing webhooks will have no secret header')
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderCategory {
  handle: string
}

interface OrderItemProduct {
  metadata?: Record<string, unknown>
  categories?: OrderCategory[]
  handle?: string
}

interface OrderItemVariant {
  product?: OrderItemProduct
}

interface OrderItem {
  variant?: OrderItemVariant
}

interface OrderCustomer {
  email?: string
  first_name?: string
  last_name?: string
}

interface RetrievedOrder {
  id: string
  customer_id: string
  customer?: OrderCustomer
  items?: OrderItem[]
  [key: string]: unknown
}

// ── Product type detection ────────────────────────────────────────────────────

type ProductType = 'session' | 'self-paced' | 'live' | 'group' | 'other'

interface CategoryAccess {
  access_level: number
  track: 'akashic' | 'energy-clearing' | 'general'
  product_type: ProductType
}

// Mirror of apps/web/lib/access/product-access.ts — kept in sync manually.
// Cannot import cross-app in this monorepo without a shared package.
const CATEGORY_ACCESS_MAP: Record<string, CategoryAccess> = {
  'rp-self-paced':              { access_level: 3, track: 'general',         product_type: 'self-paced' },
  'rp-live':                    { access_level: 3, track: 'general',         product_type: 'live' },
  'akashic-live':               { access_level: 3, track: 'akashic',         product_type: 'live' },
  'akashic-self-paced':         { access_level: 3, track: 'akashic',         product_type: 'self-paced' },
  'energy-clearing-live':       { access_level: 3, track: 'energy-clearing', product_type: 'live' },
  'energy-clearing-self-paced': { access_level: 3, track: 'energy-clearing', product_type: 'self-paced' },
  'life-enhancing-live':        { access_level: 3, track: 'general',         product_type: 'live' },
  'life-enhancing-self-paced':  { access_level: 3, track: 'general',         product_type: 'self-paced' },
  'group-sessions-live':        { access_level: 2, track: 'general',         product_type: 'group' },
  'group-sessions-recorded':    { access_level: 2, track: 'general',         product_type: 'self-paced' },
  'private-sessions':           { access_level: 1, track: 'general',         product_type: 'session' },
  'meditation-programmes':      { access_level: 3, track: 'general',         product_type: 'self-paced' },
  'books':                      { access_level: 1, track: 'general',         product_type: 'other' },
  'digital-downloads':          { access_level: 1, track: 'general',         product_type: 'other' },
}

function isMembershipOrder(items: OrderItem[]): boolean {
  return items.some((item) => {
    const meta = item?.variant?.product?.metadata
    return meta && (meta as Record<string, unknown>).product_type === 'membership'
  })
}

function detectOrderProductType(items: OrderItem[]): ProductType {
  const categories = items.flatMap((item) => item.variant?.product?.categories ?? [])

  // Direct map lookup
  for (const cat of categories) {
    const match = CATEGORY_ACCESS_MAP[cat.handle]
    if (match) return match.product_type
  }

  // Pattern-matching fallback
  for (const cat of categories) {
    const h = cat.handle
    if (h === 'private-sessions' || h.includes('coaching') || h.includes('therapy')) return 'session'
    if (h.includes('self-paced') || h.includes('self-study') || h.includes('recorded')) return 'self-paced'
    if (h.includes('live-via-zoom') || (h.includes('-live') && !h.includes('group'))) return 'live'
    if (h.includes('group')) return 'group'
  }

  // Last resort: check product handle
  for (const item of items) {
    const handle = item.variant?.product?.handle ?? ''
    if (handle.includes('session') || handle.includes('coaching')) return 'session'
    if (handle.includes('self-paced') || handle.includes('self-study')) return 'self-paced'
    if (handle.includes('-live')) return 'live'
    if (handle.includes('group')) return 'group'
  }

  return 'other'
}

function getHighestCategoryAccess(items: OrderItem[]): CategoryAccess | null {
  const categories = items.flatMap((item) => item.variant?.product?.categories ?? [])
  let best: CategoryAccess | null = null

  for (const cat of categories) {
    const match = CATEGORY_ACCESS_MAP[cat.handle]
    if (match && (!best || match.access_level > best.access_level)) {
      best = match
    }
  }

  return best
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

function buildSupabaseAdmin(): ReturnType<typeof createClient> | null {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(
      '[order-placed] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set — Supabase sync will be skipped'
    )
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
}

async function lookupSupabaseUserId(
  supabase: ReturnType<typeof createClient>,
  email: string
): Promise<string | null> {
  const normalised = email.toLowerCase()
  type AuthUserMinimal = { id: string; email?: string | null }
  const PER_PAGE = 1000
  let page = 1

  // Paginate to avoid silently missing users beyond the first 1000.
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PER_PAGE })

    if (error) {
      console.error(`[order-placed] Supabase auth.admin.listUsers failed (page ${page}): ${error.message}`)
      return null
    }

    const users = data.users as AuthUserMinimal[]
    const user = users.find((u) => u.email?.toLowerCase() === normalised)
    if (user) return user.id

    if (users.length < PER_PAGE) return null // Last page reached — not found
    page++
  }
}

interface MemberSubscriptionUpsert {
  user_id: string
  tier_id: string
  status: string
  start_date: string
  end_date: string | null
}

interface SupabaseUpsertTable {
  upsert(
    values: MemberSubscriptionUpsert,
    options: { onConflict: string }
  ): Promise<{ error: { message: string } | null }>
}

// Minimal builder interfaces to bypass Supabase's strict generics when the
// Database type doesn't include member_subscriptions (no generated types in Medusa).
interface PortalSelectQuery {
  eq(col: string, val: string): PortalSelectQuery
  order(col: string, opts: { ascending: boolean }): PortalSelectQuery
  limit(n: number): PortalSelectQuery
  maybeSingle(): Promise<{ data: { access_level: number | null; track: string | null } | null; error: { message: string } | null }>
}

// Awaitable update/insert: supabase builders implement PromiseLike natively
interface PortalWriteResult {
  then<R>(onfulfilled: (value: { error: { message: string } | null }) => R): Promise<R>
}

interface PortalUpdateQuery {
  eq(col: string, val: string): PortalUpdateQuery & PortalWriteResult
}

interface PortalSubscriptionTable {
  select(cols: string): PortalSelectQuery
  update(values: { access_level: number; track: string }): PortalUpdateQuery & PortalWriteResult
  insert(values: {
    user_id: string; tier_id: string; status: string;
    start_date: string; end_date: null; access_level: number; track: string
  }): PortalWriteResult
}

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

/**
 * Grants or upgrades portal access_level for a programme purchase.
 * Never downgrades an existing higher access level.
 * If the user has no subscription row, inserts one with tier_id='free' as the base.
 */
async function syncPortalAccess(
  supabase: ReturnType<typeof createClient>,
  supabaseUserId: string,
  accessLevel: number,
  track: 'akashic' | 'energy-clearing' | 'general'
): Promise<void> {
  // Cast to bypass Supabase's strict generics — same pattern as SupabaseUpsertTable above.
  // tier_id='free' is a valid FK value: the free tier row is seeded in Task 3.1.
  const table = supabase.from('member_subscriptions') as unknown as PortalSubscriptionTable

  // Fetch current active subscription to avoid downgrading
  const { data: existing, error: fetchError } = await table
    .select('access_level, track')
    .eq('user_id', supabaseUserId)
    .eq('status', 'active')
    .order('access_level', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError) {
    console.error(`[order-placed] portal access fetch failed for user ${supabaseUserId}: ${fetchError.message}`)
    return
  }

  if (existing) {
    const currentLevel = existing.access_level ?? 0

    if (accessLevel > currentLevel) {
      const { error: updateError } = await table
        .update({ access_level: accessLevel, track })
        .eq('user_id', supabaseUserId)
        .eq('status', 'active')

      if (updateError) {
        console.error(`[order-placed] portal access update failed for user ${supabaseUserId}: ${updateError.message}`)
      } else {
        console.log(`[order-placed] portal access upgraded for user ${supabaseUserId} → level=${accessLevel} track=${track}`)
      }
    } else {
      console.log(`[order-placed] portal access already at level ${currentLevel} for user ${supabaseUserId} — no change`)
    }
  } else {
    // No active subscription — insert a free-tier base with the programme's access level
    const { error: insertError } = await table.insert({
      user_id: supabaseUserId,
      tier_id: 'free',
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: null,
      access_level: accessLevel,
      track,
    })

    if (insertError) {
      console.error(`[order-placed] portal access insert failed for user ${supabaseUserId}: ${insertError.message}`)
    } else {
      console.log(`[order-placed] portal access created for user ${supabaseUserId} → level=${accessLevel} track=${track}`)
    }
  }
}

// ── Membership activation ─────────────────────────────────────────────────────

async function handleMembershipActivation(
  order: RetrievedOrder,
  container: SubscriberArgs<unknown>['container']
): Promise<void> {
  const items = order.items ?? []

  const membershipItem = items.find((item) => {
    const meta = item?.variant?.product?.metadata
    return meta && (meta as Record<string, unknown>).product_type === 'membership'
  })

  if (!membershipItem) {
    return
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

  const membershipsService = container.resolve<MembershipsModuleService>(MEMBERSHIPS_MODULE)

  let supabaseUserId: string | null = null

  try {
    const supabase = buildSupabaseAdmin()

    if (supabase) {
      const email = order.customer?.email
      if (email) {
        supabaseUserId = await lookupSupabaseUserId(supabase, email)
      }

      if (supabaseUserId) {
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

  await membershipsService.activateMembership(
    order.customer_id,
    tier,
    order.id,
    supabaseUserId ?? undefined
  )

  console.log(
    `[order-placed] Membership activated in Medusa for customer ${order.customer_id} → tier=${tier}`
  )

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

// ── Portal access grant for programme purchases ───────────────────────────────

async function handlePortalAccessGrant(order: RetrievedOrder): Promise<void> {
  const items = order.items ?? []

  if (isMembershipOrder(items)) return // Membership orders handled by handleMembershipActivation

  const accessGrant = getHighestCategoryAccess(items)
  if (!accessGrant || accessGrant.access_level <= 1) return // No meaningful access to grant

  const email = order.customer?.email
  if (!email) {
    console.warn(`[order-placed] order ${order.id} has no customer email — portal access grant skipped`)
    return
  }

  const supabase = buildSupabaseAdmin()
  if (!supabase) return

  const supabaseUserId = await lookupSupabaseUserId(supabase, email)
  if (!supabaseUserId) {
    console.log(
      `[order-placed] No Supabase account for ${email} — portal access at level ${accessGrant.access_level} will apply when they create an account`
    )
    return
  }

  await syncPortalAccess(supabase, supabaseUserId, accessGrant.access_level, accessGrant.track)
}

// ── Subscriber ────────────────────────────────────────────────────────────────

// Side effects on order placement (all fire-and-forget, never block order completion):
// 1. n8n webhook → Sage invoice creation
// 1b. n8n webhook → Vtiger CRM
// 2. Invoice generation → order confirmation email (chained; email includes productType + calBookingUrl)
// 3. Membership activation (Medusa module + Supabase mirror) for membership products
// 4. Portal access grant for programme purchases (Supabase access_level upgrade)
// 5. Vibe Marketing post-purchase onboarding for first-time non-membership customers
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
      relations: [
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.product.categories',
        'customer',
      ],
    }) as RetrievedOrder

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(N8N_WEBHOOK_SECRET ? { 'x-webhook-secret': N8N_WEBHOOK_SECRET } : {}),
    }

    // Detect product type for email personalisation and Cal.com link
    const items = order.items ?? []
    const productType = detectOrderProductType(items)
    const isSessionOrder = productType === 'session'
    const calBookingUrl = isSessionOrder ? CALCOM_SESSION_BOOKING_URL : null

    // 1. n8n → Sage: fire-and-forget
    void fetch(`${N8N_BASE_URL}/webhook/medusa-order-placed`, {
      method: 'POST',
      headers,
      body: JSON.stringify(order),
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[order-placed] n8n webhook failed for order ${orderId}: ${message}`)
    })

    // 1b. n8n → Vtiger: fire-and-forget
    void fetch(`${N8N_BASE_URL}/webhook/medusa-order-vtiger`, {
      method: 'POST',
      headers,
      body: JSON.stringify(order),
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[order-placed] vtiger webhook failed for order ${orderId}: ${message}`)
    })

    // 2. Invoice generation → order confirmation email (chained sequentially)
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

      try {
        const confirmRes = await fetch(`${WEB_BASE_URL}/api/email/order-confirmation`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ orderId, invoiceUrl, productType, calBookingUrl }),
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

    // 3. Membership activation — fire-and-forget
    void handleMembershipActivation(order, container).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[order-placed] membership activation error for order ${orderId}: ${message}`)
    })

    // 4. Portal access grant for programme purchases — fire-and-forget
    void handlePortalAccessGrant(order).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[order-placed] portal access grant error for order ${orderId}: ${message}`)
    })

    // 5. Vibe Marketing — first-time non-membership customers
    if (!isMembershipOrder(items) && VIBE_MARKETING_WEBHOOK_URL) {
      void (async () => {
        try {
          const customerOrders = await orderService.listOrders(
            { customer_id: order.customer_id },
            { take: 2 }
          )
          if (!Array.isArray(customerOrders) || customerOrders.length > 1) return

          const email = order.customer?.email
          if (!email) return

          const customer = order.customer as Record<string, unknown>
          const orderAny = order as Record<string, unknown>
          const productNames = items
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
    console.error(`[order-placed] failed to retrieve order ${orderId}: ${message}`)
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed',
}
