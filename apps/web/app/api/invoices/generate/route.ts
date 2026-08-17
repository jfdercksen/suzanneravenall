import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual, createHash } from 'crypto'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@supabase/supabase-js'
import { createElement } from 'react'
import { z } from 'zod'
import InvoiceDocument, { type InvoiceOrder } from '@/components/invoice/InvoiceDocument'
import { logError } from '@/lib/log'

const bodySchema = z.object({
  orderId: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid order ID format'),
})

interface MedusaOrderItem {
  id: string
  title: string
  variant?: { title?: string }
  quantity: number
  unit_price: number
}

interface MedusaAdminOrder {
  id: string
  display_id: number
  created_at: string
  currency_code: string
  status: string
  customer?: {
    first_name?: string
    last_name?: string
    email: string
  }
  billing_address?: {
    address_1?: string
    city?: string
    country_code?: string
  }
  items: MedusaOrderItem[]
  subtotal: number
  tax_total: number
  total: number
  payment_collections?: Array<{
    payment_sessions?: Array<{
      provider_id: string
      data?: Record<string, unknown>
    }>
  }>
  metadata?: Record<string, unknown>
}

function getPaymentDetails(order: MedusaAdminOrder): {
  method: string
  reference: string | undefined
} {
  const session = order.payment_collections?.[0]?.payment_sessions?.[0]
  const providerId = session?.provider_id ?? ''

  if (providerId.includes('payfast')) {
    return {
      method: 'PayFast',
      reference: order.metadata?.payfast_payment_id
        ? String(order.metadata.payfast_payment_id)
        : undefined,
    }
  }
  if (providerId.includes('paypal')) {
    return {
      method: 'PayPal',
      reference: order.metadata?.paypal_order_id
        ? String(order.metadata.paypal_order_id)
        : undefined,
    }
  }
  return { method: 'Online Payment', reference: undefined }
}

function buildInvoiceOrder(order: MedusaAdminOrder): InvoiceOrder {
  const { method, reference } = getPaymentDetails(order)
  return {
    id: order.id,
    display_id: order.display_id,
    created_at: order.created_at,
    currency_code: order.currency_code,
    customer: order.customer,
    billing_address: order.billing_address,
    items: order.items.map((item) => ({
      id: item.id,
      title: item.title,
      variant_title: item.variant?.title,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
    subtotal: order.subtotal,
    tax_total: order.tax_total,
    total: order.total,
    payment_method: method,
    payment_reference: reference,
    sage_invoice_number: order.metadata?.sage_document_number
      ? String(order.metadata.sage_document_number)
      : undefined,
  }
}

// Constant-time comparison to prevent timing attacks on the secret
function verifySecret(provided: string, expected: string): boolean {
  try {
    const a = createHash('sha256').update(provided).digest()
    const b = createHash('sha256').update(expected).digest()
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  // Auth: verify x-webhook-secret header against N8N_WEBHOOK_SECRET.
  // Both the Medusa subscriber and any manual callers must include this header.
  // If the env var is not configured (dev/test), skip verification with a warning.
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET
  if (!webhookSecret) {
    logError('[invoices/generate] N8N_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  const provided = req.headers.get('x-webhook-secret') ?? ''
  if (!provided || !verifySecret(provided, webhookSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const medusaBase = process.env.MEDUSA_BACKEND_URL ?? 'http://medusa:9000'
  const medusaToken = process.env.MEDUSA_API_TOKEN
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!medusaToken) {
    logError('[invoices/generate] MEDUSA_API_TOKEN is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    logError('[invoices/generate] Supabase env vars missing')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  let orderId: string
  try {
    const raw = await req.json()
    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' }, { status: 400 })
    }
    orderId = parsed.data.orderId
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // 1. Fetch order from Medusa admin API
  let order: MedusaAdminOrder
  try {
    const fields = [
      '*items',
      '*items.variant',
      '*customer',
      '*billing_address',
      '*payment_collections',
      '*payment_collections.payment_sessions',
    ].join(',')

    const res = await fetch(
      `${medusaBase}/admin/orders/${orderId}?fields=${encodeURIComponent(fields)}`,
      {
        headers: {
          Authorization: `Bearer ${medusaToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (res.status === 404) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      logError(`[invoices/generate] Medusa fetch failed for ${orderId}: ${res.status} ${detail.slice(0, 200)}`, undefined, { orderId, status: res.status })
      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 502 })
    }

    const data = (await res.json()) as { order: MedusaAdminOrder }
    order = data.order
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logError(`[invoices/generate] Medusa request error: ${msg}`, err, { orderId })
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 502 })
  }

  // 2. Render PDF
  let pdfBuffer: Buffer
  try {
    const invoiceOrder = buildInvoiceOrder(order)
    const element = createElement(InvoiceDocument, { order: invoiceOrder })
    pdfBuffer = await renderToBuffer(element)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logError(`[invoices/generate] PDF render error for ${orderId}: ${msg}`, err, { orderId })
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }

  // 3. Upload to Supabase Storage
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const filePath = `${orderId}.pdf`

  try {
    // Create bucket if it doesn't exist yet — idempotent. Private: invoices
    // contain sensitive financial data and must not be publicly addressable.
    const { error: bucketError } = await supabase.storage.createBucket('invoices', {
      public: false,
      fileSizeLimit: 5 * 1024 * 1024,
    })
    if (
      bucketError &&
      !bucketError.message.includes('already exists') &&
      !bucketError.message.includes('Duplicate')
    ) {
      throw new Error(`Bucket creation failed: ${bucketError.message}`)
    }

    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logError(`[invoices/generate] Supabase upload error for ${orderId}: ${msg}`, err, { orderId })
    return NextResponse.json({ error: 'Failed to store invoice' }, { status: 500 })
  }

  // 4. Generate a signed URL (7 days) for the confirmation email.
  // Store invoice_path in metadata so the portal can generate fresh signed URLs on demand.
  const { data: signedData, error: signedError } = await supabase.storage
    .from('invoices')
    .createSignedUrl(filePath, 7 * 24 * 60 * 60)

  if (signedError || !signedData?.signedUrl) {
    logError(`[invoices/generate] Signed URL error for ${orderId}: ${signedError?.message}`, signedError ?? undefined, { orderId })
    return NextResponse.json({ error: 'Failed to generate invoice URL' }, { status: 500 })
  }
  const invoiceUrl = signedData.signedUrl

  // 5. Update Medusa order metadata — spread existing metadata to avoid clobbering
  //    keys written by earlier steps (Sage, PayFast, PayPal).
  //    invoice_path is the permanent storage reference; invoice_url is the 7-day email link.
  try {
    const existingMeta = order.metadata ?? {}
    const res = await fetch(`${medusaBase}/admin/orders/${orderId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${medusaToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata: { ...existingMeta, invoice_path: filePath, invoice_url: invoiceUrl },
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      // Log but don't fail — PDF is uploaded; metadata update is best-effort
      logError(
        `[invoices/generate] Medusa metadata update failed for ${orderId}: ${res.status} ${detail.slice(0, 200)}`,
        undefined,
        { orderId, status: res.status }
      )
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logError(`[invoices/generate] Medusa metadata update error: ${msg}`, err, { orderId })
  }

  return NextResponse.json({ invoiceUrl })
}
