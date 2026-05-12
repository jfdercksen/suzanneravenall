import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getMemberTier } from '@/lib/access/check-access'
import DashboardContent from './DashboardContent'

export const metadata = {
  title: 'Dashboard | Member Portal',
}

interface MedusaOrder {
  id: string
  items: Array<{
    title: string
    variant?: { product_id: string }
    thumbnail: string | null
  }>
}

interface MedusaCustomer {
  id: string
}

/**
 * Look up Medusa customer ID by email (authoritative, server-side).
 * Never trusts client-controlled metadata for the customer ID.
 */
async function getMedusaCustomerId(
  email: string,
  medusaUrl: string,
  apiToken: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${medusaUrl}/admin/customers?email=${encodeURIComponent(email)}&limit=1`,
      {
        headers: { 'x-medusa-access-token': apiToken },
        next: { revalidate: 300 },
      },
    )
    if (!res.ok) return null
    const { customers }: { customers: MedusaCustomer[] } = await res.json()
    return customers[0]?.id ?? null
  } catch {
    return null
  }
}

async function fetchPurchasedProgrammes(email: string) {
  const medusaUrl = process.env.MEDUSA_BACKEND_URL
  const apiToken = process.env.MEDUSA_API_TOKEN

  if (!medusaUrl || !apiToken) return []

  try {
    const customerId = await getMedusaCustomerId(email, medusaUrl, apiToken)
    if (!customerId) return []

    const res = await fetch(
      `${medusaUrl}/admin/orders?customer_id=${encodeURIComponent(customerId)}&fields=id,items&limit=50`,
      {
        headers: { 'x-medusa-access-token': apiToken },
        next: { revalidate: 300 },
      },
    )

    if (!res.ok) return []

    const { orders }: { orders: MedusaOrder[] } = await res.json()

    const seen = new Set<string>()
    return orders
      .flatMap((order) => order.items)
      .filter((item) => {
        const key = item.variant?.product_id ?? item.title
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 6)
      .map((item) => ({
        id: item.variant?.product_id ?? item.title,
        title: item.title,
        thumbnailUrl: item.thumbnail,
      }))
  } catch {
    return []
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/portal/login')
  }

  const { data: subscription } = await supabase
    .from('member_subscriptions')
    .select('tier_id, status, membership_tiers(name, slug)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const tier = subscription?.membership_tiers as
    | { name: string; slug: string }
    | null
    | undefined
  const tierName = tier?.name ?? 'Free Member'
  const tierSlug = (tier?.slug ?? 'free') as 'free' | 'silver' | 'gold' | 'practitioner'

  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? ''

  // Fetch purchased programmes from Medusa by authoritative email lookup (non-blocking)
  const programmes = user.email ? await fetchPurchasedProgrammes(user.email) : []

  return (
    <DashboardContent
      firstName={firstName}
      tierName={tierName}
      tierSlug={tierSlug}
      programmes={programmes}
    />
  )
}
