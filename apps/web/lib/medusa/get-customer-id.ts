import { logError } from '@/lib/log'
import { medusaAdminFetch } from './admin-client'

interface MedusaCustomer {
  id: string
  email?: string | null
}

/**
 * Every Medusa customer carrying this email, newest first. A guest checkout
 * creates a customer without an account and a later registration can create a
 * second one with the same address, so a member can legitimately own more
 * than one; the portal unions their orders (KI078).
 */
export async function getMedusaCustomerIds(email: string): Promise<string[]> {
  const normalised = email.trim().toLowerCase()
  if (!normalised) return []

  try {
    // `q` searches case-insensitively (a guest checkout keeps the casing the
    // buyer typed, Supabase lower-cases the account email), then we keep the
    // exact addresses only.
    const res = await medusaAdminFetch(
      `/customers?q=${encodeURIComponent(normalised)}&fields=id,email&limit=20&order=-created_at`,
    )
    if (!res) return []
    if (!res.ok) {
      logError('[medusa/get-customer-id] customer lookup failed', undefined, { status: res.status })
      return []
    }
    const { customers } = (await res.json()) as { customers?: MedusaCustomer[] }
    return (customers ?? [])
      .filter((customer) => customer.email?.trim().toLowerCase() === normalised)
      .map((customer) => customer.id)
  } catch (error) {
    logError('[medusa/get-customer-id] customer lookup threw', error)
    return []
  }
}

/** First matching customer id, or null. Kept for callers that need one id. */
export async function getMedusaCustomerId(email: string): Promise<string | null> {
  const ids = await getMedusaCustomerIds(email)
  return ids[0] ?? null
}
