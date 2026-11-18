'use client'

import { useEffect, useMemo, useState } from 'react'
import { CART_ADDON_HANDLES, type CartProductFacts } from '@/lib/shop/addons'

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_URL ?? ''
const MEDUSA_PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

/**
 * Reads the cart's products and the add-on products in one store call, so
 * the add-on rules see categories and every variant of what is in the cart
 * (a cart line carries only its own variant).
 */
export async function fetchCartProductFacts(handles: string[]): Promise<Map<string, CartProductFacts>> {
  const params = new URLSearchParams({
    fields: 'id,handle,title,metadata,*variants,*variants.prices,*categories',
    limit: String(handles.length),
  })
  handles.forEach((h) => params.append('handle[]', h))
  const res = await fetch(`${MEDUSA_URL}/store/products?${params.toString()}`, {
    headers: { 'x-publishable-api-key': MEDUSA_PUB_KEY },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as { products?: CartProductFacts[] }
  return new Map((data.products ?? []).map((p) => [p.handle, p]))
}

/**
 * The store facts for the cart page: the add-on offer and the Bonus Lifetime
 * Access cap both read them. Null until read; an empty map when the store
 * cannot be read, so the offer hides and the cap falls back to one.
 */
export function useCartProductFacts(
  items: ReadonlyArray<{ product_handle?: string | null }> | undefined,
): Map<string, CartProductFacts> | null {
  const [facts, setFacts] = useState<Map<string, CartProductFacts> | null>(null)

  const cartHandles = useMemo(
    () => Array.from(new Set((items ?? []).map((i) => i.product_handle).filter((h): h is string => Boolean(h)))).sort(),
    [items],
  )
  const handlesKey = cartHandles.join(',')

  useEffect(() => {
    if (cartHandles.length === 0) return
    let cancelled = false
    fetchCartProductFacts(Array.from(new Set([...cartHandles, ...CART_ADDON_HANDLES])))
      .then((map) => {
        if (!cancelled) setFacts(map)
      })
      .catch(() => {
        if (!cancelled) setFacts(new Map())
      })
    return () => {
      cancelled = true
    }
    // handlesKey stands for cartHandles: refetch only when the products change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handlesKey])

  return facts
}
