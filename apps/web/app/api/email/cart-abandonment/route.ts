import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual, createHash } from 'crypto'
import { sendCartAbandonmentEmail1 } from '@/lib/email/cart-abandonment-1'
import { sendCartAbandonmentEmail2 } from '@/lib/email/cart-abandonment-2'
import { sendCartAbandonmentEmail3 } from '@/lib/email/cart-abandonment-3'
import { isEmailConfigured } from '@/lib/email/send'
import { isEmailUnsubscribed } from '@/lib/email/suppression'
import { claimCartReminder, recordCartReminderEmailId, releaseCartReminder } from '@/lib/email/cart-reminder-log'
import type { CartEmailData, CartItem } from '@/lib/email/types'
import { getCartStatus } from '@/lib/medusa/cart-status'
import { logError } from '@/lib/log'

function verifySecret(provided: string, expected: string): boolean {
  try {
    const a = createHash('sha256').update(provided).digest()
    const b = createHash('sha256').update(expected).digest()
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function isValidTemplate(v: unknown): v is 1 | 2 | 3 {
  return v === 1 || v === 2 || v === 3
}

/** Mail clients cannot resolve a site-relative path; product images are stored as '/images/...'. */
function absoluteImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined
  if (/^https?:\/\//i.test(value)) return value
  if (!value.startsWith('/')) return undefined
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://suzanneravenall.com').replace(/\/$/, '')
  return `${site}${value}`
}

function parseItems(raw: unknown[]): CartItem[] {
  return raw
    .filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object' &&
        typeof (item as Record<string, unknown>).id === 'string' &&
        typeof (item as Record<string, unknown>).title === 'string' &&
        typeof (item as Record<string, unknown>).quantity === 'number' &&
        typeof (item as Record<string, unknown>).unit_price === 'number'
    )
    .map((item) => ({
      id: item.id as string,
      title: item.title as string,
      variant_title: typeof item.variant_title === 'string' ? item.variant_title : undefined,
      quantity: item.quantity as number,
      unit_price: item.unit_price as number,
      thumbnail: absoluteImageUrl(item.thumbnail),
    }))
}

/**
 * Callers: the Medusa cart-recovery job (n8n migration step 4) and, until the
 * n8n chains queued before the cutover have run out, the n8n workflow. Both
 * send x-webhook-secret: INTERNAL_WEBHOOK_SECRET or N8N_WEBHOOK_SECRET.
 *
 * Gates before Brevo, in order: cart still open (store API), address not on
 * the suppression list, and the (cart_id, template) sent-log claim, so no
 * reminder can go twice.
 */
export async function POST(req: NextRequest) {
  const secrets = [process.env.INTERNAL_WEBHOOK_SECRET, process.env.N8N_WEBHOOK_SECRET].filter(
    (s): s is string => Boolean(s)
  )
  if (secrets.length === 0) {
    logError('[email/cart-abandonment] neither INTERNAL_WEBHOOK_SECRET nor N8N_WEBHOOK_SECRET is set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  const provided = req.headers.get('x-webhook-secret') ?? ''
  if (!provided || !secrets.some((s) => verifySecret(provided, s))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isEmailConfigured()) {
    logError('[email/cart-abandonment] BREVO_API_KEY is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  let body: {
    template?: unknown
    cartId?: unknown
    email?: unknown
    firstName?: unknown
    items?: unknown
    total?: unknown
    currency?: unknown
    cartUrl?: unknown
  }

  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { template, cartId, email, firstName, items, total, currency, cartUrl } = body

  if (!isValidTemplate(template)) {
    return NextResponse.json({ error: 'template must be 1, 2, or 3' }, { status: 400 })
  }
  if (!cartId || typeof cartId !== 'string') {
    return NextResponse.json({ error: 'cartId is required' }, { status: 400 })
  }
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: 'items must be an array' }, { status: 400 })
  }

  const parsedItems = parseItems(items)
  if (parsedItems.length === 0 && items.length > 0) {
    return NextResponse.json({ error: 'items contains no valid line items' }, { status: 400 })
  }

  // The workflow waits hours between steps: never chase a cart that has since been
  // ordered or removed. When Medusa cannot say, do not send (a missed reminder costs
  // less than a reminder for something already bought).
  const cartStatus = await getCartStatus(cartId)
  if (cartStatus !== 'open') {
    return NextResponse.json({ skipped: true, reason: `cart_${cartStatus}` })
  }

  // POPIA: cart-abandonment emails are marketing — honour the suppression list.
  if (await isEmailUnsubscribed(email)) {
    return NextResponse.json({ skipped: true, reason: 'unsubscribed' })
  }

  // n8n and the Medusa job overlap during the cutover; a retried request may
  // also arrive after the first one sent. Whoever claims first sends.
  const claim = await claimCartReminder(cartId, template)
  if (claim === 'already_sent') {
    return NextResponse.json({ skipped: true, reason: 'already_sent' })
  }
  if (claim === 'unavailable') {
    return NextResponse.json({ error: 'Sent-log unavailable' }, { status: 503 })
  }

  const data: CartEmailData = {
    cartId,
    email,
    firstName: typeof firstName === 'string' ? firstName : undefined,
    items: parsedItems,
    total: typeof total === 'number' ? total : 0,
    currency: typeof currency === 'string' ? currency : 'ZAR',
    cartUrl: typeof cartUrl === 'string' ? cartUrl : '',
  }

  let emailId: string
  try {
    if (template === 1) {
      emailId = await sendCartAbandonmentEmail1(data)
    } else if (template === 2) {
      emailId = await sendCartAbandonmentEmail2(data)
    } else {
      emailId = await sendCartAbandonmentEmail3(data)
    }
  } catch (err) {
    // Nothing went out: give the claim back so the caller's retry can send.
    await releaseCartReminder(cartId, template).catch(() => {})
    const msg = err instanceof Error ? err.message : String(err)
    logError(`[email/cart-abandonment] send failed (template ${template}, cart ${cartId}): ${msg}`, err, { template, cartId })
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  // The mail is out: whatever happens to the id, the claim stays.
  await recordCartReminderEmailId(cartId, template, emailId).catch(() => {})
  return NextResponse.json({ emailId })
}
