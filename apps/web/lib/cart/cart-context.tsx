'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const CART_ID_KEY = 'medusa_cart_id'

// Medusa v2 line item shape from GET /store/carts/:id
export interface CartItem {
  id: string
  title: string
  subtitle: string | null
  thumbnail: string | null
  quantity: number
  unit_price: number
  subtotal: number
  total: number
  product_handle: string | null
  variant_id: string | null
}

export interface Cart {
  id: string
  items: CartItem[]
  subtotal: number
  discount_total: number
  shipping_total: number
  tax_total: number
  total: number
  currency_code: string
  region_id: string
  email: string | null
}

export interface CartContextType {
  cart: Cart | null
  isLoading: boolean
  itemCount: number
  addItem: (variantId: string, quantity?: number) => Promise<void>
  updateItem: (lineItemId: string, quantity: number) => Promise<void>
  removeItem: (lineItemId: string) => Promise<void>
  setEmail: (email: string) => Promise<void>
  clearCart: () => void
}

const CartCtx = createContext<CartContextType | null>(null)

export function useCart(): CartContextType {
  const ctx = useContext(CartCtx)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export function formatPrice(amountInCents: number, currencyCode = 'zar'): string {
  const amount = amountInCents / 100
  if (currencyCode.toLowerCase() === 'usd') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getMedusaBase(): string {
  return process.env.NEXT_PUBLIC_MEDUSA_URL ?? ''
}

function getMedusaHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '',
  }
}

async function fetchRegionId(): Promise<string | null> {
  // Ask the server which region this visitor should use (Cloudflare country detection)
  try {
    const res = await fetch('/api/region')
    if (res.ok) {
      const data = (await res.json()) as { regionId?: string }
      if (data.regionId) return data.regionId
    }
  } catch {
    // fall through to env var fallback
  }

  // Fallback: use the pinned ZAR region baked in at build time
  const pinned = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID
  if (pinned) return pinned

  // Last resort: fetch regions from Medusa and find ZAR
  try {
    const res = await fetch(`${getMedusaBase()}/store/regions?limit=50`, {
      headers: getMedusaHeaders(),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { regions?: Array<{ id: string; currency_code: string }> }
    const regions = data.regions ?? []
    const zar = regions.find((r) => r.currency_code === 'zar')
    return zar?.id ?? regions[0]?.id ?? null
  } catch {
    return null
  }
}

async function createCart(regionId: string): Promise<Cart | null> {
  try {
    const res = await fetch(`${getMedusaBase()}/store/carts`, {
      method: 'POST',
      headers: getMedusaHeaders(),
      body: JSON.stringify({ region_id: regionId }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { cart: Cart }
    return data.cart
  } catch {
    return null
  }
}

async function fetchCart(cartId: string): Promise<Cart | null> {
  try {
    const res = await fetch(`${getMedusaBase()}/store/carts/${cartId}`, {
      headers: getMedusaHeaders(),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { cart: Cart }
    return data.cart
  } catch {
    return null
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const regionIdRef = useRef<string | null>(null)

  useEffect(() => {
    async function init() {
      const cartId = localStorage.getItem(CART_ID_KEY)
      if (cartId) {
        const existing = await fetchCart(cartId)
        // Validate against the region this visitor resolves to NOW, not against
        // "any configured region". A cart created while /api/region was handing
        // out USD is permanently broken for most of the catalogue, and keeping
        // it would carry the 500 across the fix for every returning visitor.
        const resolved = await fetchRegionId()
        regionIdRef.current = resolved
        if (existing && (!resolved || existing.region_id === resolved)) {
          setCart(existing)
          setIsLoading(false)
          return
        }
        localStorage.removeItem(CART_ID_KEY)
      }
      setIsLoading(false)
    }
    init()
  }, [])

  const getOrCreateCart = useCallback(async (): Promise<Cart | null> => {
    if (cart) return cart

    let regionId = regionIdRef.current
    if (!regionId) {
      regionId = await fetchRegionId()
      regionIdRef.current = regionId
    }
    if (!regionId) return null

    const newCart = await createCart(regionId)
    if (newCart) {
      localStorage.setItem(CART_ID_KEY, newCart.id)
      setCart(newCart)
    }
    return newCart
  }, [cart])

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      const currentCart = await getOrCreateCart()
      if (!currentCart) throw new Error('Could not create cart')

      const res = await fetch(
        `${getMedusaBase()}/store/carts/${currentCart.id}/line-items`,
        {
          method: 'POST',
          headers: getMedusaHeaders(),
          body: JSON.stringify({ variant_id: variantId, quantity }),
        }
      )
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(err.message ?? `Add to cart failed (${res.status})`)
      }
      const data = (await res.json()) as { cart: Cart }
      setCart(data.cart)
    },
    [getOrCreateCart]
  )

  const updateItem = useCallback(
    async (lineItemId: string, quantity: number) => {
      if (!cart) return
      try {
        const res = await fetch(
          `${getMedusaBase()}/store/carts/${cart.id}/line-items/${lineItemId}`,
          {
            method: 'POST',
            headers: getMedusaHeaders(),
            body: JSON.stringify({ quantity }),
          }
        )
        if (!res.ok) return
        // Re-fetch the cart to get the updated state
        const updated = await fetchCart(cart.id)
        if (updated) setCart(updated)
      } catch {
        // silently fail
      }
    },
    [cart]
  )

  const removeItem = useCallback(
    async (lineItemId: string) => {
      if (!cart) return
      try {
        await fetch(
          `${getMedusaBase()}/store/carts/${cart.id}/line-items/${lineItemId}`,
          {
            method: 'DELETE',
            headers: getMedusaHeaders(),
          }
        )
        // Re-fetch regardless of response shape
        const updated = await fetchCart(cart.id)
        if (updated) setCart(updated)
      } catch {
        // silently fail
      }
    },
    [cart]
  )

  const setEmail = useCallback(
    async (email: string) => {
      const currentCart = await getOrCreateCart()
      if (!currentCart) return
      try {
        const res = await fetch(`${getMedusaBase()}/store/carts/${currentCart.id}`, {
          method: 'POST',
          headers: getMedusaHeaders(),
          body: JSON.stringify({ email }),
        })
        if (!res.ok) return
        const data = (await res.json()) as { cart: Cart }
        setCart(data.cart)
      } catch {
        // silently fail
      }
    },
    [getOrCreateCart]
  )

  const clearCart = useCallback(() => {
    localStorage.removeItem(CART_ID_KEY)
    setCart(null)
  }, [])

  const itemCount = useMemo(
    () => cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [cart]
  )

  const value = useMemo<CartContextType>(
    () => ({
      cart,
      isLoading,
      itemCount,
      addItem,
      updateItem,
      removeItem,
      setEmail,
      clearCart,
    }),
    [cart, isLoading, itemCount, addItem, updateItem, removeItem, setEmail, clearCart]
  )

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}
