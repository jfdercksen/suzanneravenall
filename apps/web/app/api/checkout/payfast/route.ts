import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

interface PayFastRequest {
  amountInCents: number
  itemName: string
  firstName: string
  lastName: string
  email: string
  cartId: string
}

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
  const body = (await req.json()) as PayFastRequest

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
  const amount = (body.amountInCents / 100).toFixed(2)

  // Truncate item_name to PayFast's 255 char limit
  const itemName = body.itemName.slice(0, 255)

  const params: Record<string, string> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: `${siteUrl}/checkout/confirmation`,
    cancel_url: `${siteUrl}/cart`,
    notify_url: `${siteUrl}/api/webhooks/payfast`,
    name_first: body.firstName,
    name_last: body.lastName,
    email_address: body.email,
    m_payment_id: body.cartId,
    amount,
    item_name: itemName,
  }

  const signature = buildSignature(params, passphrase)
  const isSandbox = process.env.NODE_ENV !== 'production'

  return NextResponse.json({
    params: { ...params, signature },
    endpoint: isSandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process',
  })
}
