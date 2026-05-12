import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getMedusaCustomerId } from '@/lib/medusa/get-customer-id'
import ProgrammesContent from './ProgrammesContent'

export const metadata = {
  title: 'My Programmes | Member Portal',
}

interface MedusaOrderItem {
  title: string
  thumbnail: string | null
  variant?: {
    product_id: string
    product?: {
      title: string
      handle: string
      thumbnail: string | null
      metadata?: {
        delivery_method?: string
      }
    }
  }
  unit_price: number
}

interface MedusaOrder {
  id: string
  created_at: string
  items: MedusaOrderItem[]
}

export interface ProgrammeItem {
  id: string
  title: string
  thumbnailUrl: string | null
  purchasedAt: string
  deliveryMethod: string
  productHandle: string | null
}

async function fetchProgrammes(email: string): Promise<ProgrammeItem[]> {
  const medusaUrl = process.env.MEDUSA_BACKEND_URL
  const apiToken = process.env.MEDUSA_API_TOKEN

  if (!medusaUrl || !apiToken) return []

  try {
    const customerId = await getMedusaCustomerId(email, medusaUrl, apiToken)
    if (!customerId) return []

    const res = await fetch(
      `${medusaUrl}/admin/orders?customer_id=${encodeURIComponent(customerId)}&fields=id,created_at,items&limit=100`,
      {
        headers: { 'x-medusa-access-token': apiToken },
        next: { revalidate: 300 },
      },
    )
    if (!res.ok) return []

    const { orders }: { orders: MedusaOrder[] } = await res.json()

    const seen = new Set<string>()
    const programmes: ProgrammeItem[] = []

    for (const order of orders) {
      for (const item of order.items) {
        const productId = item.variant?.product_id ?? item.title
        if (seen.has(productId)) continue
        seen.add(productId)

        const product = item.variant?.product
        const rawDelivery = product?.metadata?.delivery_method ?? ''
        const deliveryMethod = rawDelivery || 'Self Study'

        programmes.push({
          id: productId,
          title: product?.title ?? item.title,
          thumbnailUrl: product?.thumbnail ?? item.thumbnail,
          purchasedAt: order.created_at,
          deliveryMethod,
          productHandle: product?.handle ?? null,
        })
      }
    }

    return programmes
  } catch {
    return []
  }
}

export default async function ProgrammesPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/portal/login?redirect=/portal/programmes')
  }

  const programmes = user.email ? await fetchProgrammes(user.email) : []

  return <ProgrammesContent programmes={programmes} />
}
