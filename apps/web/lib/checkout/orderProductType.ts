/**
 * The order's product type, decided the way the order mail decides it, so the
 * confirmation page and the mail tell the buyer the same next steps (KI065,
 * KI044).
 *
 * Mirror of detectOrderProductType and the hasCourses rule in
 * apps/medusa/src/subscribers/order-placed.ts, plus the download-only rule in
 * app/api/email/order-confirmation/route.ts. Kept in sync manually, as
 * lib/access/product-access.ts already is: the two apps share no module for it.
 */
import type { OrderProductType } from '@/lib/email/types'
import { downloadFileOf } from '@/lib/downloads/storage'

export interface OrderLineForType {
  variant?: {
    metadata?: Record<string, unknown> | null
    product?: {
      handle?: string | null
      metadata?: Record<string, unknown> | null
      categories?: Array<{ handle: string }> | null
    } | null
  } | null
}

type CategoryType = Exclude<OrderProductType, 'live-course' | 'download'>

// order-placed.ts CATEGORY_ACCESS_MAP, product_type column only.
const CATEGORY_TYPE: Record<string, CategoryType> = {
  'rp-self-paced': 'self-paced',
  'rp-live': 'live',
  'akashic-live': 'live',
  'akashic-self-paced': 'self-paced',
  'energy-clearing-live': 'live',
  'energy-clearing-self-paced': 'self-paced',
  'life-enhancing-live': 'live',
  'life-enhancing-self-paced': 'self-paced',
  'group-sessions-live': 'group',
  'group-sessions-recorded': 'self-paced',
  'private-sessions': 'session',
  'meditation-programmes': 'self-paced',
  books: 'other',
  'digital-downloads': 'other',
}

function categoryType(items: OrderLineForType[]): CategoryType {
  if (items.some((item) => (item.variant?.product?.handle ?? '').includes('mentorship'))) return 'mentorship'

  const categories = items.flatMap((item) => item.variant?.product?.categories ?? [])

  for (const cat of categories) {
    const match = Object.hasOwn(CATEGORY_TYPE, cat.handle) ? CATEGORY_TYPE[cat.handle] : undefined
    if (match) return match
  }

  for (const cat of categories) {
    const h = cat.handle
    if (h === 'private-sessions' || h.includes('coaching') || h.includes('therapy')) return 'session'
    if (h.includes('self-paced') || h.includes('self-study') || h.includes('recorded')) return 'self-paced'
    if (h.includes('live-via-zoom') || (h.includes('-live') && !h.includes('group'))) return 'live'
    if (h.includes('group')) return 'group'
  }

  for (const item of items) {
    const handle = item.variant?.product?.handle ?? ''
    if (handle.includes('group')) return 'group'
    if (handle.includes('session') || handle.includes('coaching')) return 'session'
    if (handle.includes('lifetime-access')) return 'other'
    if (handle.includes('self-paced') || handle.includes('self-study')) return 'self-paced'
    if (handle.includes('-live')) return 'live'
  }

  return 'other'
}

function readString(meta: Record<string, unknown> | null | undefined, key: string): string | null {
  const value = meta?.[key]
  if (value == null) return null
  const text = String(value).trim()
  return text === '' ? null : text
}

// packages/integrations itemCourseId: the variant's course first, then the product's.
function hasCourse(item: OrderLineForType): boolean {
  return (
    readString(item.variant?.metadata, 'thinkific_course_id') != null ||
    readString(item.variant?.product?.metadata, 'thinkific_course_id') != null
  )
}

// The mail route's download-only rule (isDownloadOnlyOrder): a valid file path.
function isDownload(item: OrderLineForType): boolean {
  return downloadFileOf(item) !== null
}

export function orderProductType(items: OrderLineForType[]): OrderProductType {
  if (items.length > 0 && items.every(isDownload)) return 'download'
  const type = categoryType(items)
  if (items.some(hasCourse)) return type === 'live' ? 'live-course' : 'self-paced'
  return type
}
