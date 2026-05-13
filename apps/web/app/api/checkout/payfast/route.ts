import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'

const bodySchema = z.object({
  amountInCents: z.number().int().positive().max(10_000_000),
  itemName: z.string().min(1).max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(200),
  cartId: z.string().min(1).max(100),
})

// PayFast signature: MD5 of URL-encoded, alpha-sorted key=value pairs + passphrase
function buildSignature(params: Record<string, string>, passphrase: string): string {
  const queryString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([, v]) => v !== '' && v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`)
    .join('&')

  const stringToHash = passphrase
    ? `${queryString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
    : queryString

  return createHash('md5').update(stringToHash).digest('hex')
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await req.json())
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const merchantId = process.env.PAYFAST_MERCHANT_ID ?? ''
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY ?? ''
  const passphrase = process.env.PAYFAST_PASSPHRASE ?? ''
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://suzanneravenall.com'

  if (!merchantId || !merchantKey) {
    return NextResponse.json(
      { error: 'Payment configuration missing' },
      { status: 500 }
    )
  }

  // PayFast expects amount as decimal string with exactly 2 decimal places
  const amount = (parsed.amountInCents / 100).toFixed(2)

  const params: Record<string, string> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: `${siteUrl}/checkout/confirmation`,
    cancel_url: `${siteUrl}/cart`,
    notify_url: `${siteUrl}/api/webhooks/payfast`,
    name_first: parsed.firstName,
    name_last: parsed.lastName,
    email_address: parsed.email,
    m_payment_id: parsed.cartId,
    amount,
    item_name: parsed.itemName,
  }

  const signature = buildSignature(params, passphrase)
  const isSandbox = process.env.PAYFAST_SANDBOX === 'true'

  return NextResponse.json({
    params: { ...params, signature },
    endpoint: isSandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process',
  })
}
