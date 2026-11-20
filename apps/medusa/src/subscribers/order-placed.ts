import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createClient } from '@supabase/supabase-js'
import {
  bookerName,
  isNoviceLevel,
  isOnSale,
  isSellableLevel,
  membershipAccessFields,
  membershipBySku,
  membershipTermEnd,
  membershipTierSlug,
  orderHasCourses,
  sessionBookingUrl,
  type MembershipAccessFields,
  type MembershipLevel,
} from '@suzanne/integrations'
import ws from 'ws'
import { MEMBERSHIPS_MODULE } from '../modules/memberships'
import type MembershipsModuleService from '../modules/memberships/service'
import { orderVtigerMode, thinkificMode } from '../automations/config'
import { dispatchOrderAutomations } from '../automations/dispatch'
import { buildOrderSnapshot, ORDER_GRAPH_FIELDS } from '../automations/order-snapshot'
import { createDryRunQueue, getAutomationQueue, staffAlerter } from '../automations/runtime'
import { orderMarketingOptIn } from '../lib/order-marketing-opt-in'

const N8N_BASE_URL = (process.env.N8N_WEBHOOK_URL ?? 'http://n8n:5678').replace(/\/$/, '')
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? ''
const WEB_BASE_URL = (process.env.WEB_BASE_URL ?? 'http://web:3000').replace(/\/$/, '')
const VIBE_MARKETING_WEBHOOK_URL = (process.env.VIBE_MARKETING_WEBHOOK_URL ?? '').replace(/\/$/, '')

// docker-compose passes unset variables as empty strings, so || not ??.
const CAL_BASE_URL = (process.env.NEXT_PUBLIC_CAL_URL || 'https://cal.suzanneravenall.com').replace(/\/$/, '')
// The Cal.com user page the session event types hang off (session-30, -45,
// -60, -90); never the discovery call, which is free and 30 minutes (KI079).
const CALCOM_SESSION_BOOKING_URL = process.env.CALCOM_SESSION_BOOKING_URL || `${CAL_BASE_URL}/suzanneravenall`
const N8N_THINKIFIC_ENROLLMENT_WEBHOOK_URL = (process.env.N8N_THINKIFIC_ENROLLMENT_WEBHOOK_URL ?? '').replace(/\/$/, '')

if (!N8N_WEBHOOK_SECRET) {
  console.warn('[order-placed] N8N_WEBHOOK_SECRET is not set — outgoing webhooks will have no secret header')
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderCategory {
  handle: string
  parent_category?: OrderCategory | null
}

interface OrderItemProduct {
  title?: string
  metadata?: Record<string, unknown>
  categories?: OrderCategory[]
  handle?: string
}

interface OrderItemVariant {
  title?: string
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

interface OrderAddressName {
  first_name?: string | null
  last_name?: string | null
}

interface RetrievedOrder {
  id: string
  customer_id: string
  customer?: OrderCustomer
  billing_address?: OrderAddressName | null
  items?: OrderItem[]
  [key: string]: unknown
}

// ── Product type detection ────────────────────────────────────────────────────

type ProductType = 'session' | 'self-paced' | 'live' | 'live-course' | 'group' | 'mentorship' | 'other'

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

// A category's own handle, then its parent's, up to the root (as far as
// ORDER_GRAPH_FIELDS read it).
function categoryChain(cat: OrderCategory): string[] {
  const chain: string[] = []
  const seen = new Set<OrderCategory>()
  let node: OrderCategory | null | undefined = cat
  while (node && !seen.has(node)) {
    seen.add(node)
    chain.push(node.handle)
    node = node.parent_category
  }
  return chain
}

function mappedAccess(handle: string): CategoryAccess | undefined {
  return Object.prototype.hasOwnProperty.call(CATEGORY_ACCESS_MAP, handle) ? CATEGORY_ACCESS_MAP[handle] : undefined
}

// The map entry for a category: its own handle first, then the nearest
// mapped parent, so a session filed under a sub-category of private-sessions
// (exploring-the-alpha-mind) reads as a session (KI082).
function resolveCategory(cat: OrderCategory): CategoryAccess | undefined {
  for (const handle of categoryChain(cat)) {
    const match = mappedAccess(handle)
    if (match) return match
  }
  return undefined
}

export function detectOrderProductType(items: OrderItem[]): ProductType {
  // Practitioner Mentorship is a monthly group session the team tracks and
  // confirms by email; nothing to book. Its handle contains "session", so it
  // was sent the private-session booking email (Shayna, 7 Oct).
  if (items.some((item) => (item.variant?.product?.handle ?? '').includes('mentorship'))) return 'mentorship'

  const categories = items.flatMap((item) => item.variant?.product?.categories ?? [])

  // Direct map lookup
  for (const cat of categories) {
    const match = mappedAccess(cat.handle)
    if (match) return match.product_type
  }

  // Nearest mapped parent category (KI082)
  for (const cat of categories) {
    const match = resolveCategory(cat)
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
    // "group" first: group-session handles contain "session" too, and were sent
    // the private-session booking email (Shayna, 6 Oct: Shedding Excess Weight).
    if (handle.includes('group')) return 'group'
    if (handle.includes('session') || handle.includes('coaching')) return 'session'
    // Bonus Lifetime Access is an add-on the team applies by hand (no course of
    // its own): its handle says "self-study" but no course-access mail follows
    // (14 Oct, order #236 promised one).
    if (handle.includes('lifetime-access')) return 'other'
    if (handle.includes('self-paced') || handle.includes('self-study')) return 'self-paced'
    if (handle.includes('-live')) return 'live'
    if (handle.includes('group')) return 'group'
  }

  return 'other'
}

// The "Book Your Session" link for a session order: the Cal.com event that
// matches the first session line's length, with the buyer's name and email
// filled in (KI079).
export function orderSessionBookingUrl(
  order: Pick<RetrievedOrder, 'items' | 'customer' | 'billing_address'>,
  baseUrl: string = CALCOM_SESSION_BOOKING_URL
): string {
  const items = order.items ?? []
  const line = items.find((item) => detectOrderProductType([item]) === 'session') ?? items[0]
  const product = line?.variant?.product
  const name =
    bookerName(order.customer?.first_name, order.customer?.last_name) ??
    bookerName(order.billing_address?.first_name, order.billing_address?.last_name)
  return sessionBookingUrl(
    baseUrl,
    { productTitle: product?.title, productHandle: product?.handle, variantTitle: line?.variant?.title },
    { name, email: order.customer?.email }
  )
}

export function getHighestCategoryAccess(items: OrderItem[]): CategoryAccess | null {
  const categories = items.flatMap((item) => item.variant?.product?.categories ?? [])
  let best: CategoryAccess | null = null

  for (const cat of categories) {
    const match = resolveCategory(cat)
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

  // Node 20 has no global WebSocket, and supabase-js builds its realtime
  // client in createClient, so without a transport it throws and every order's
  // portal access grant failed ("Node.js 20 detected without native WebSocket
  // support", 7 Oct). Realtime is never used here; ws only satisfies it.
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    realtime: { transport: ws as unknown as typeof WebSocket },
  })
}

async function lookupSupabaseUserId(
  supabase: ReturnType<typeof createClient>,
  email: string,
  /** Memberships: only an account that has confirmed this email (someone may sign up with another person's address). */
  confirmedOnly = false
): Promise<string | null> {
  const normalised = email.toLowerCase()
  type AuthUserMinimal = { id: string; email?: string | null; email_confirmed_at?: string | null }
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
    if (user) return confirmedOnly && !user.email_confirmed_at ? null : user.id

    if (users.length < PER_PAGE) return null // Last page reached — not found
    page++
  }
}

// ── Supabase member_subscriptions ─────────────────────────────────────────────
//
// Schema (infra/supabase/migrations/001_foundation.sql, supabase/migrations/
// 20260526_membership_tiers.sql): the only unique key is the `id` primary key.
// `user_id` is NOT unique, and the web app relies on that: it keeps one row per
// user per tier (apps/web/app/api/portal/ensure-membership/route.ts) and reads
// the newest `status = 'active'` row (apps/web/lib/access/check-access.ts).
// So an expired or cancelled row is history and a new active row sits beside
// it, and there is no key an upsert could conflict on: writes here are
// select-then-update-or-insert on (user_id, tier_id).

interface SupabaseError {
  message: string
  code?: string
}

interface WriteResult {
  error: SupabaseError | null
}

// Supabase builders implement PromiseLike natively, so a filtered update is awaitable.
interface AwaitableWrite {
  then<R>(onfulfilled: (value: WriteResult) => R): Promise<R>
}

interface MembershipRow {
  user_id: string
  tier_id: string
  status: string
  start_date: string
  end_date: string | null
}

interface MembershipSelectQuery {
  eq(col: string, val: string): MembershipSelectQuery
  order(col: string, opts: { ascending: boolean }): MembershipSelectQuery
  limit(n: number): MembershipSelectQuery
  maybeSingle(): Promise<{ data: { id: string; start_date?: string | null } | null; error: SupabaseError | null }>
}

type LevelRow = { user_id: string; tier_id: string } & MembershipAccessFields

interface MembershipTable {
  select(cols: string): MembershipSelectQuery
  insert(values: LevelRow): AwaitableWrite
  update(values: MembershipAccessFields): { eq(col: string, val: string): AwaitableWrite }
}

// Minimal builder interfaces to bypass Supabase's strict generics when the
// Database type doesn't include member_subscriptions (no generated types in Medusa).
interface PortalSelectQuery {
  eq(col: string, val: string): PortalSelectQuery
  order(col: string, opts: { ascending: boolean }): PortalSelectQuery
  limit(n: number): PortalSelectQuery
  maybeSingle(): Promise<{ data: { access_level: number | null; track: string | null } | null; error: SupabaseError | null }>
}

interface PortalUpdateQuery {
  eq(col: string, val: string): PortalUpdateQuery & AwaitableWrite
}

interface PortalSubscriptionTable {
  select(cols: string): PortalSelectQuery
  update(values: { access_level: number; track: string }): PortalUpdateQuery & AwaitableWrite
  insert(values: MembershipRow & { access_level: number; track: string }): AwaitableWrite
}

// membership_tiers.id is a uuid generated when the tier was seeded
// (infra/supabase/seed.sql), so a tier is addressed by its slug ('free',
// 'silver', ...) and resolved to its id here. Writing the slug into
// member_subscriptions.tier_id failed on every order with
// `invalid input syntax for type uuid: "free"` (KI070, 15 Oct).
interface TierLookupTable {
  select(cols: string): {
    eq(col: string, val: string): {
      maybeSingle(): Promise<{ data: { id: string } | null; error: SupabaseError | null }>
    }
  }
}

/**
 * Medusa has no Sentry SDK; its failure channel is the staff alerter
 * (apps/medusa/src/automations/runtime.ts: one mail per key per 15 minutes,
 * every alert logged in full, never throws). Every skip or failure path in
 * the portal writes goes through here so a buyer silently losing portal
 * access is visible to staff, not only in the container log.
 * POPIA: order ids and Supabase user ids in the lines, never emails.
 */
function reportPortalFailure(key: string, subject: string, lines: string[]): void {
  console.error(`[order-placed] ${subject}: ${lines.join(' | ')}`)
  void staffAlerter()
    .send({ key, subject, lines })
    .catch(() => undefined)
}

/**
 * Tier ids are cached for the life of the process: tiers are seeded once and
 * never re-keyed. The one case where a cached id goes stale is a tier row
 * deleted and reseeded under a new uuid; the next write then fails with a
 * foreign key violation on tier_id, which evicts the entry so the following
 * order re-resolves it. Otherwise a reseed needs a Medusa restart.
 */
const tierIdCache = new Map<string, string>()

const PG_FOREIGN_KEY_VIOLATION = '23503'

function isTierForeignKeyViolation(error: SupabaseError): boolean {
  return error.code === PG_FOREIGN_KEY_VIOLATION || /violates foreign key constraint/i.test(error.message)
}

function evictTierIdOnForeignKeyViolation(slug: string, error: SupabaseError): void {
  if (!isTierForeignKeyViolation(error)) return
  tierIdCache.delete(slug)
  console.warn(`[order-placed] membership tier "${slug}" evicted from the id cache after a foreign key violation; the next order re-resolves it`)
}

async function resolveTierId(
  supabase: ReturnType<typeof createClient>,
  slug: string,
  orderId: string
): Promise<string | null> {
  const cached = tierIdCache.get(slug)
  if (cached) return cached

  const table = supabase.from('membership_tiers') as unknown as TierLookupTable
  const { data, error } = await table.select('id').eq('slug', slug).maybeSingle()

  if (error) {
    reportPortalFailure('membership-tier-lookup', 'Membership tier lookup failed', [
      `Order: ${orderId}`,
      `Tier slug: ${slug}`,
      `Error: ${error.message}`,
      'The buyer has no portal access row from this order.',
    ])
    return null
  }
  if (!data) {
    reportPortalFailure('membership-tier-missing', 'Membership tier is not seeded', [
      `Order: ${orderId}`,
      `Tier slug: ${slug}`,
      'Seed it from infra/supabase/seed.sql. The buyer has no portal access row from this order.',
    ])
    return null
  }

  tierIdCache.set(slug, data.id)
  return data.id
}

/**
 * Makes the buyer active on the level they bought (KI128): the membership_tiers
 * row of that level (slug = the SKU in lower case, migration
 * 20261120090000_membership_levels) carries the 365-day term, access level,
 * programme and SKU. The (user_id, tier_id) row is re-activated with fresh
 * dates when one exists (a lapsed member buying again), otherwise a new row
 * is inserted beside the member's other rows. The term starts at the order's
 * own time, so a replayed order event finds the row already on that start and
 * changes nothing ('already'). Returns 'failed' when nothing was written
 * (already reported to staff).
 */
async function syncSupabaseMembership(
  supabase: ReturnType<typeof createClient>,
  supabaseUserId: string,
  level: MembershipLevel,
  orderId: string,
  start: Date
): Promise<'written' | 'already' | 'failed'> {
  const slug = membershipTierSlug(level)
  const tierId = await resolveTierId(supabase, slug, orderId)
  if (!tierId) return 'failed' // resolveTierId has already reported it

  const fields = membershipAccessFields(level, start)
  const table = supabase.from('member_subscriptions') as unknown as MembershipTable

  // user_id + tier_id is not unique in the schema: take the newest row.
  const { data: existing, error: fetchError } = await table
    .select('id, start_date')
    .eq('user_id', supabaseUserId)
    .eq('tier_id', tierId)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError) {
    reportPortalFailure('membership-sync', 'Membership row lookup failed', [
      `Order: ${orderId}`,
      `Supabase user: ${supabaseUserId}`,
      `Level: ${level.sku}`,
      `Error: ${fetchError.message}`,
    ])
    return 'failed'
  }

  if (existing?.start_date && Date.parse(existing.start_date) === start.getTime()) {
    console.log(`[order-placed] ${level.sku} already active from order ${orderId} for user ${supabaseUserId}; replay ignored`)
    return 'already'
  }

  const { error } = existing
    ? await table.update(fields).eq('id', existing.id)
    : await table.insert({ user_id: supabaseUserId, tier_id: tierId, ...fields })

  if (error) {
    evictTierIdOnForeignKeyViolation(slug, error)
    reportPortalFailure('membership-sync', `Membership row ${existing ? 'update' : 'insert'} failed`, [
      `Order: ${orderId}`,
      `Supabase user: ${supabaseUserId}`,
      `Level: ${level.sku}`,
      `Error: ${error.message}`,
      'The buyer is not active on this level in the portal.',
    ])
    return 'failed'
  }

  console.log(
    `[order-placed] Supabase member_subscriptions ${existing ? 'reactivated' : 'created'} for user ${supabaseUserId} → ${level.sku} until ${fields.end_date}`
  )
  return 'written'
}

/**
 * Grants or upgrades portal access_level for a programme purchase.
 * Never downgrades an existing higher access level.
 * If the user has no ACTIVE subscription row, inserts one on the free tier
 * as the base. Expired or cancelled rows stay as history (user_id is not
 * unique, see the schema note above), so the insert is always valid.
 */
async function syncPortalAccess(
  supabase: ReturnType<typeof createClient>,
  supabaseUserId: string,
  accessLevel: number,
  track: 'akashic' | 'energy-clearing' | 'general',
  orderId: string
): Promise<void> {
  // Cast to bypass Supabase's strict generics, same pattern as MembershipTable above.
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
    reportPortalFailure('portal-access', 'Portal access lookup failed', [
      `Order: ${orderId}`,
      `Supabase user: ${supabaseUserId}`,
      `Error: ${fetchError.message}`,
      `The buyer did not receive access level ${accessLevel}.`,
    ])
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
        reportPortalFailure('portal-access', 'Portal access upgrade failed', [
          `Order: ${orderId}`,
          `Supabase user: ${supabaseUserId}`,
          `Error: ${updateError.message}`,
          `The buyer is still at access level ${currentLevel}, not ${accessLevel}.`,
        ])
      } else {
        console.log(`[order-placed] portal access upgraded for user ${supabaseUserId} → level=${accessLevel} track=${track}`)
      }
    } else {
      console.log(`[order-placed] portal access already at level ${currentLevel} for user ${supabaseUserId} — no change`)
    }
    return
  }

  // No active subscription: insert a free-tier base row with the programme's
  // access level. The free tier's uuid comes from membership_tiers by slug (KI070).
  const freeTierId = await resolveTierId(supabase, 'free', orderId)
  if (!freeTierId) return // resolveTierId has already reported it

  const { error: insertError } = await table.insert({
    user_id: supabaseUserId,
    tier_id: freeTierId,
    status: 'active',
    start_date: new Date().toISOString(),
    end_date: null,
    access_level: accessLevel,
    track,
  })

  if (insertError) {
    evictTierIdOnForeignKeyViolation('free', insertError)
    reportPortalFailure('portal-access', 'Portal access insert failed', [
      `Order: ${orderId}`,
      `Supabase user: ${supabaseUserId}`,
      `Error: ${insertError.message}`,
      `The buyer did not receive access level ${accessLevel}.`,
    ])
  } else {
    console.log(`[order-placed] portal access created for user ${supabaseUserId} → level=${accessLevel} track=${track}`)
  }
}

// ── Membership activation ─────────────────────────────────────────────────────

interface NoviceApplicationTable {
  insert(values: {
    email: string
    first_name: string | null
    user_id: string | null
    sku: string
    medusa_order_id: string
    status: 'awaiting_documents'
  }): { select(cols: string): { single(): Promise<{ data: { id: string } | null; error: SupabaseError | null }> } }
}

interface NoviceEventTable {
  insert(values: { application_id: string; actor_type: 'system'; actor_id: string; action: 'created'; detail: string }): AwaitableWrite
}

const PG_UNIQUE_VIOLATION = '23505'

function postInternalEmail(path: string, body: Record<string, unknown>, orderId: string): void {
  void fetch(`${WEB_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(N8N_WEBHOOK_SECRET ? { 'x-webhook-secret': N8N_WEBHOOK_SECRET } : {}) },
    body: JSON.stringify(body),
  })
    .then((res) => {
      if (!res.ok) reportPortalFailure('membership-email', 'Membership email failed', [`Order: ${orderId}`, `Route: ${path}`, `Status: ${res.status}`])
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      reportPortalFailure('membership-email', 'Membership email failed', [`Order: ${orderId}`, `Route: ${path}`, `Error: ${msg}`])
    })
}

/**
 * A paid Novice order (Suzanne, 19 Nov 2026): no access yet. The order opens a
 * novice_applications row and the member is emailed the list of what to
 * upload at /portal/novice; access starts when the team approves it at
 * /staff/novice (the web app activates the level then). A replayed order
 * event hits the unique medusa_order_id and sends nothing twice.
 */
async function openNoviceApplication(
  supabase: ReturnType<typeof createClient>,
  order: RetrievedOrder,
  level: MembershipLevel,
  supabaseUserId: string | null,
  email: string,
  firstName: string | null
): Promise<void> {
  const table = supabase.from('novice_applications') as unknown as NoviceApplicationTable
  const { data, error } = await table
    .insert({ email, first_name: firstName, user_id: supabaseUserId, sku: level.sku, medusa_order_id: order.id, status: 'awaiting_documents' })
    .select('id')
    .single()

  if (error?.code === PG_UNIQUE_VIOLATION) {
    console.log(`[order-placed] Novice application for order ${order.id} already exists; nothing sent again`)
    return
  }
  if (error || !data) {
    reportPortalFailure('novice-application', 'Novice application could not be opened', [
      `Order: ${order.id}`,
      `Level: ${level.sku}`,
      `Error: ${error?.message ?? 'no row returned'}`,
      'The member paid for Novice and has no application to upload to.',
    ])
    return
  }

  const events = supabase.from('novice_application_events') as unknown as NoviceEventTable
  const { error: eventError } = await events.insert({
    application_id: data.id,
    actor_type: 'system',
    actor_id: 'order-placed',
    action: 'created',
    detail: `Order ${order.id}, ${level.sku}`,
  })
  if (eventError) console.error(`[order-placed] Novice application event not written for order ${order.id}: ${eventError.message}`)

  console.log(`[order-placed] Novice application ${data.id} opened for order ${order.id} (${level.sku})`)
  postInternalEmail('/api/email/novice-documents', { email, firstName, sku: level.sku }, order.id)
}

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

  const membershipLines = items.filter((item) => (item?.variant?.product?.metadata as Record<string, unknown> | undefined)?.product_type === 'membership')
  if (membershipLines.length > 1) {
    reportPortalFailure('membership-multiple', 'Order holds more than one membership', [
      `Order: ${order.id}`,
      `Lines: ${membershipLines.length}`,
      'Only the first is applied automatically. Apply the others by hand.',
    ])
  }

  // Every membership product carries its level's SKU in metadata.tier (KI128).
  const meta = membershipItem.variant?.product?.metadata as Record<string, unknown>
  const level = membershipBySku(typeof meta.tier === 'string' ? meta.tier : null)

  if (!level || !isSellableLevel(level)) {
    reportPortalFailure('membership-level-unknown', 'Membership product has no valid level', [
      `Order: ${order.id}`,
      `metadata.tier: ${typeof meta.tier === 'string' ? meta.tier : '(missing)'}`,
      'The buyer paid and has no membership. Set metadata.tier on the product (set-membership-metadata script) and activate the member by hand.',
    ])
    return
  }

  // The cart refuses a level that is not open for purchase (KI133); one that
  // still arrives (an older cart) gets no access, and staff refund or apply it.
  if (!isOnSale(level)) {
    reportPortalFailure('membership-not-on-sale', 'Membership level bought that is not on sale', [
      `Order: ${order.id}`,
      `Level: ${level.sku}`,
      'No access was given. Refund the order, or apply the level by hand if the team agrees.',
    ])
    return
  }

  const email = order.customer?.email ?? null
  const customerAny = (order.customer ?? {}) as Record<string, unknown>
  const firstName = typeof customerAny.first_name === 'string' && customerAny.first_name.trim() !== '' ? customerAny.first_name.trim() : null

  const supabase = buildSupabaseAdmin()
  let supabaseUserId: string | null = null
  try {
    if (supabase && email) supabaseUserId = await lookupSupabaseUserId(supabase, email, true)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[order-placed] Supabase user lookup error for order ${order.id}: ${message}`)
  }

  if (isNoviceLevel(level)) {
    if (!supabase || !email) {
      reportPortalFailure('novice-application', 'Novice application could not be opened', [
        `Order: ${order.id}`,
        `Level: ${level.sku}`,
        !email ? 'The order has no email.' : 'Supabase is not configured on the store.',
      ])
      return
    }
    await openNoviceApplication(supabase, order, level, supabaseUserId, email, firstName)
    return
  }

  // The year runs from the order's own time, so a replayed event writes the same dates.
  const placedAt = typeof order.created_at === 'string' ? new Date(order.created_at) : null
  const start = placedAt && !Number.isNaN(placedAt.getTime()) ? placedAt : new Date()
  const end = membershipTermEnd(start)
  console.log(`[order-placed] Activating ${level.sku} for customer ${order.customer_id} (order ${order.id}) until ${end.toISOString()}`)

  // The Medusa record is the commerce copy; a failure there must not cost the member their portal access.
  try {
    const membershipsService = container.resolve<MembershipsModuleService>(MEMBERSHIPS_MODULE)
    await membershipsService.activateMembership(order.customer_id, level.sku, order.id, supabaseUserId ?? undefined, end)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    reportPortalFailure('membership-module', 'Membership record in the store failed', [`Order: ${order.id}`, `Level: ${level.sku}`, `Error: ${message}`])
  }

  let portalActive = false
  if (supabase && supabaseUserId) {
    // 'already' = a replay: access stands and the welcome email went the first time.
    portalActive = (await syncSupabaseMembership(supabase, supabaseUserId, level, order.id, start)) === 'written'
  } else {
    reportPortalFailure('membership-no-account', 'Membership bought without a portal account', [
      `Order: ${order.id}`,
      `Level: ${level.sku}`,
      'The buyer has no portal account under the order email, so the portal does not show the level yet. Activate it by hand once they sign up.',
    ])
  }

  // The welcome email says access has started, so only when it has.
  if (email && portalActive) {
    postInternalEmail('/api/email/membership-welcome', { email, firstName, sku: level.sku, renewalDate: end.toISOString() }, order.id)
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

  await syncPortalAccess(supabase, supabaseUserId, accessGrant.access_level, accessGrant.track, order.id)
}

// ── Subscriber ────────────────────────────────────────────────────────────────

// Side effects on order placement (all fire-and-forget, never block order completion):
// 1. n8n webhook → Sage invoice creation
// 1b. Vtiger CRM: n8n webhook, or our own code (AUTOMATION_ORDER_VTIGER)
// 1c. Thinkific enrollment (course products only, keyed by product.metadata.thinkific_course_id):
//     n8n webhook, or our own code (AUTOMATION_THINKIFIC); see src/automations/
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
      listOrders: (filters?: object, config?: object) => Promise<{ id: string }[]>
    }

    // The variant, product and customer are NOT relations of the Order module
    // (they live in the Product and Customer modules, joined by module links),
    // so orderService.retrieveOrder(..., { relations: ['items.variant', ...] })
    // throws "Cannot read properties of undefined (reading 'targetMeta')" on
    // every order and this whole handler never ran. Cross-module reads go
    // through the Query graph.
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: orders } = await query.graph({
      entity: 'order',
      fields: ORDER_GRAPH_FIELDS,
      filters: { id: orderId },
    })
    const order = orders[0] as unknown as (RetrievedOrder & { email?: string | null }) | undefined
    if (!order) {
      console.error(`[order-placed] order ${orderId} not found`)
      return
    }
    // A guest order may carry the email on the order only; downstream (n8n
    // Thinkific and Vtiger workflows, the email routes) reads order.customer.
    if (!order.customer?.email && order.email) {
      order.customer = { ...(order.customer ?? {}), email: order.email }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(N8N_WEBHOOK_SECRET ? { 'x-webhook-secret': N8N_WEBHOOK_SECRET } : {}),
    }

    // Detect product type for email personalisation and Cal.com link
    const items = order.items ?? []
    // What was actually bought decides the wording, as on the current site: a
    // line with a Thinkific course (a programme format, or a recorded group
    // series) means course access, whatever the product's category says. Live
    // group seats have no course and keep the Zoom wording (Shayna, 6 Oct:
    // Career Progression "Recorded series" was told a Zoom link would follow).
    // A LIVE programme whose seat also enrols a course keeps its live wording
    // and adds the course access line (14 Oct, orders #232/#233 read as self study).
    const categoryType = detectOrderProductType(items)
    const hasCourses = orderHasCourses(buildOrderSnapshot(order))
    const productType: ProductType = hasCourses ? (categoryType === 'live' ? 'live-course' : 'self-paced') : categoryType
    const isSessionOrder = categoryType === 'session'
    const calBookingUrl = isSessionOrder ? orderSessionBookingUrl(order) : null

    // 1. n8n → Sage: fire-and-forget
    void fetch(`${N8N_BASE_URL}/webhook/medusa-order-placed`, {
      method: 'POST',
      headers,
      body: JSON.stringify(order),
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[order-placed] n8n webhook failed for order ${orderId}: ${message}`)
    })

    // 1b. n8n → Vtiger: fire-and-forget. Only in n8n mode (AUTOMATION_ORDER_VTIGER,
    // default n8n); in code mode the durable queue below does it instead.
    if (orderVtigerMode() === 'n8n') {
      void fetch(`${N8N_BASE_URL}/webhook/medusa-order-vtiger`, {
        method: 'POST',
        headers,
        body: JSON.stringify(order),
      }).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[order-placed] vtiger webhook failed for order ${orderId}: ${message}`)
      })
    }

    // 1c. n8n → Thinkific enrollment: fire-and-forget (only when URL is configured).
    // Only in n8n mode (AUTOMATION_THINKIFIC, default n8n).
    if (thinkificMode() === 'n8n' && N8N_THINKIFIC_ENROLLMENT_WEBHOOK_URL) {
      void fetch(N8N_THINKIFIC_ENROLLMENT_WEBHOOK_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(order),
      }).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[order-placed] thinkific enrollment webhook failed for order ${orderId}: ${message}`)
      })
    }

    // 1d. Code automations (Thinkific, Vtiger) for flags set to "code": durable,
    // idempotent jobs in Medusa's Postgres, run at once and retried with backoff.
    // With every flag on "n8n" and no AUTOMATION_DRY_RUN this does nothing.
    void dispatchOrderAutomations(buildOrderSnapshot(order), {
      queue: () => getAutomationQueue(container),
      dryRunQueue: createDryRunQueue,
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[order-placed] automation enqueue failed for order ${orderId} (the runner's sweep retries it): ${message}`)
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

    // 5. Vibe Marketing: first-time non-membership customers who ticked the
    // marketing box at checkout (POPIA, KI122). Vibe is a marketing system, so a
    // buyer who did not opt in, or an order from before the opt-in, is not sent.
    if (!isMembershipOrder(items) && VIBE_MARKETING_WEBHOOK_URL && orderMarketingOptIn(order.metadata)) {
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
