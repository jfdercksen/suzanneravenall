interface MedusaCustomer {
  id: string
}

export async function getMedusaCustomerId(
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
