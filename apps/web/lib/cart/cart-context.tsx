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

export type Currency = 'zar' | 'usd'

// Medusa v2 line item shape from GET /store/carts/:id
export interface CartItem {
  id: string
  title: string
  subtitle: string | null
  /** The chosen variant ("Live via Zoom"); in the store cart's default fields, unlike subtitle */
  variant_title?: string | null
  thumbnail: string | null
  quantity: number
  unit_price: number
  subtotal: number
  total: number
  product_handle: string | null
  variant_id: string | null
  metadata?: Record<string, unknown> | null
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
  promotions: CartPromotion[]
  metadata?: Record<string, unknown> | null
  // Set once the cart has become an order. A completed cart cannot be reused.
  completed_at?: string | null
}

// Buyer details the checkout collects. Medusa keeps guest names on the billing
// address (a guest customer record has none), and the order flow (Thinkific,
// Vtiger, the invoice) reads them from there.
export interface CartContact {
  email: string
  firstName: string
  lastName: string
  countryCode?: string
  /** Business checkout: the company name for the billing address, and the cart metadata it goes with. */
  company?: string
  metadata?: Record<string, string>
}

// Voucher (Medusa promotion) applied to the cart, as returned by the store API.
export interface CartPromotion {
  id: string
  code: string | null
}

export interface CartContextType {
  cart: Cart | null
  isLoading: boolean
  itemCount: number
  addItem: (variantId: string, quantity?: number) => Promise<void>
  updateItem: (lineItemId: string, quantity: number) => Promise<void>
  removeItem: (lineItemId: string) => Promise<void>
  setEmail: (email: string) => Promise<boolean>
  setContact: (contact: CartContact) => Promise<boolean>
  applyPromoCode: (code: string) => Promise<void>
  removePromoCode: (code: string) => Promise<void>
  // With a cart id, clears only if that is the cart this browser holds, so a
  // stale confirmation link cannot empty a different, live cart.
  clearCart: (cartId?: string) => void
  /** The visitor's currency (D021), null until /api/region has answered. */
  currency: Currency | null
  /** Lines that had no price in the visitor's currency when a stored cart was moved to it. */
  droppedOnSwitch: string[]
}

const CartCtx = createContext<CartContextType | null>(null)

export function useCart(): CartContextType {
  const ctx = useContext(CartCtx)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export function formatPrice(amountInCents: number, currencyCode = 'zar'): string {
  // Guard against a missing amount. Medusa omits several money fields unless
  // they are explicitly requested, and dividing undefined by 100 rendered the
  // literal string "RNaN" on the cart and checkout pages.
  const amount = Number.isFinite(amountInCents) ? amountInCents / 100 : 0
  if (currencyCode.toLowerCase() === 'usd') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// GET /store/carts/:id does not return per-line subtotal/total unless they are
// asked for by name, so every line row rendered "RNaN" next to a correct order
// summary. Derive them from the fields Medusa does send. A line subtotal is
// unit price times quantity by definition, so this is the same number Medusa
// would have computed, not an approximation.
function normaliseCart(cart: Cart): Cart {
  return {
    ...cart,
    promotions: cart.promotions ?? [],
    items: (cart.items ?? []).map((item) => {
      const derived = (item.unit_price ?? 0) * (item.quantity ?? 0)
      return {
        ...item,
        subtotal: Number.isFinite(item.subtotal) ? item.subtotal : derived,
        total: Number.isFinite(item.total) ? item.total : derived,
      }
    }),
  }
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

interface RegionAnswer {
  regionId: string
  currency: Currency | null
  usdEnabled: boolean
  /** The currency is still a browser-language guess (location unknown). */
  auto: boolean
}

function asCurrency(value: unknown): Currency | null {
  return value === 'zar' || value === 'usd' ? value : null
}

// The server's answer for this visitor (cookie, then Accept-Language; D021).
async function fetchRegion(): Promise<RegionAnswer | null> {
  try {
    const res = await fetch('/api/region')
    if (res.ok) {
      const data = (await res.json()) as Partial<{ regionId: string; currency: string; usdEnabled: boolean; auto: boolean }>
      if (data.regionId) {
        return {
          regionId: data.regionId,
          currency: asCurrency(data.currency),
          usdEnabled: data.usdEnabled === true,
          auto: data.auto === true,
        }
      }
    }
  } catch {
    // fall through to the pinned ZAR region
  }
  const regionId = await fetchFallbackRegionId()
  return regionId ? { regionId, currency: 'zar', usdEnabled: false, auto: false } : null
}

// Record a currency server-side (cookie, when the location is unknown) and get its region back.
async function chooseCurrency(currency: Currency): Promise<RegionAnswer | null> {
  try {
    const res = await fetch('/api/region', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { regionId?: string; currency?: string }
    if (!data.regionId) return null
    return { regionId: data.regionId, currency: asCurrency(data.currency), usdEnabled: true, auto: false }
  } catch {
    return null
  }
}

// Many South African browsers send en-US or en-GB, so the Accept-Language
// guess says USD. A browser on South African time is moved to ZAR, once, and
// only while the currency is still a guess (D021).
function looksSouthAfrican(): boolean {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone === 'Africa/Johannesburg'
  } catch {
    return false
  }
}

async function fetchFallbackRegionId(): Promise<string | null> {
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
    return normaliseCart(data.cart)
  } catch {
    return null
  }
}

// One line into a cart. 'refused' is Medusa saying no (no price in this
// region, sold out); 'failed' may be temporary and is worth one more try.
async function postLineItem(
  cartId: string,
  item: Pick<CartItem, 'variant_id' | 'quantity' | 'metadata'>,
): Promise<Cart | 'refused' | 'failed'> {
  try {
    const res = await fetch(`${getMedusaBase()}/store/carts/${cartId}/line-items`, {
      method: 'POST',
      headers: getMedusaHeaders(),
      body: JSON.stringify({
        variant_id: item.variant_id,
        quantity: item.quantity,
        ...(item.metadata ? { metadata: item.metadata } : {}),
      }),
    })
    if (res.status >= 400 && res.status < 500) return 'refused'
    if (!res.ok) return 'failed'
    return normaliseCart(((await res.json()) as { cart: Cart }).cart)
  } catch {
    return 'failed'
  }
}

// Empty the cart left behind by a rebuild, so the abandoned-cart reminders
// (which skip empty carts) never mail the buyer prices in the old currency.
async function emptyCart(cart: Cart): Promise<void> {
  await Promise.all(
    cart.items.map((item) =>
      fetch(`${getMedusaBase()}/store/carts/${cart.id}/line-items/${item.id}`, {
        method: 'DELETE',
        headers: getMedusaHeaders(),
      }).catch(() => null),
    ),
  )
}

function rememberCartId(id: string | null): void {
  try {
    if (id) localStorage.setItem(CART_ID_KEY, id)
    else localStorage.removeItem(CART_ID_KEY)
  } catch {
    // Storage blocked (private mode): the cart still works for this page view.
  }
}

/**
 * Put a cart into another region (currency). Medusa re-prices every line on a
 * region change, and refuses the whole change when one line has no price in
 * the new region. Then a fresh cart is built in the new region from the lines
 * that do have a price, with the email and voucher carried over, and the rest
 * are reported back so the buyer can be told.
 */
async function moveCartToRegion(cart: Cart, regionId: string): Promise<{ cart: Cart; dropped: string[] } | null> {
  try {
    const res = await fetch(`${getMedusaBase()}/store/carts/${cart.id}`, {
      method: 'POST',
      headers: getMedusaHeaders(),
      body: JSON.stringify({ region_id: regionId }),
    })
    if (res.ok) {
      const moved = normaliseCart(((await res.json()) as { cart: Cart }).cart)
      if (moved.region_id === regionId) return { cart: moved, dropped: [] }
    }
  } catch {
    // rebuild below
  }

  const fresh = await createCart(regionId)
  if (!fresh) return null
  let next: Cart = fresh
  const dropped: string[] = []
  for (const item of cart.items) {
    let added: Cart | 'refused' | 'failed' = item.variant_id ? await postLineItem(next.id, item) : 'refused'
    if (added === 'failed') added = await postLineItem(next.id, item)
    if (typeof added === 'object') next = added
    else dropped.push(item.title)
  }
  const extras: Record<string, unknown> = {}
  if (cart.email) extras.email = cart.email
  if (Object.keys(extras).length > 0) {
    const res = await fetch(`${getMedusaBase()}/store/carts/${next.id}`, {
      method: 'POST',
      headers: getMedusaHeaders(),
      body: JSON.stringify(extras),
    }).catch(() => null)
    if (res?.ok) next = normaliseCart(((await res.json()) as { cart: Cart }).cart)
  }
  const codes = cart.promotions.map((p) => p.code).filter((c): c is string => Boolean(c))
  if (codes.length > 0 && next.items.length > 0) {
    const res = await fetch(`${getMedusaBase()}/store/carts/${next.id}/promotions`, {
      method: 'POST',
      headers: getMedusaHeaders(),
      body: JSON.stringify({ promo_codes: codes }),
    }).catch(() => null)
    if (res?.ok) next = normaliseCart(((await res.json()) as { cart: Cart }).cart)
  }
  await emptyCart(cart)
  return { cart: next, dropped }
}

async function fetchCart(cartId: string): Promise<Cart | null> {
  try {
    const res = await fetch(`${getMedusaBase()}/store/carts/${cartId}`, {
      headers: getMedusaHeaders(),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { cart: Cart }
    return normaliseCart(data.cart)
  } catch {
    return null
  }
}

// Only the shopping pages honour ?cartId=. The PayPal return to
// /checkout/confirmation also carries a cartId, and that cart must not be
// adopted as the live cart there.
const RECOVERY_PATHS = new Set(['/checkout', '/cart'])
const CART_ID_RE = /^cart_[A-Za-z0-9]{10,40}$/

function readRecoveryCartId(): string | null {
  if (typeof window === 'undefined') return null
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  if (!RECOVERY_PATHS.has(path)) return null
  const id = new URLSearchParams(window.location.search).get('cartId')
  return id && CART_ID_RE.test(id) ? id : null
}

interface CartProviderProps {
  children: React.ReactNode
  /**
   * Called after the visitor's currency changed, so server-rendered prices
   * (shop cards, product page) re-render with the new cookie. Providers.tsx
   * passes router.refresh.
   */
  onCurrencyChange?: () => void
}

export function CartProvider({ children, onCurrencyChange }: CartProviderProps) {
  const [cart, setCartState] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currency, setCurrencyState] = useState<Currency | null>(null)
  const [droppedOnSwitch, setDroppedOnSwitch] = useState<string[]>([])
  const regionIdRef = useRef<string | null>(null)
  const onCurrencyChangeRef = useRef(onCurrencyChange)
  onCurrencyChangeRef.current = onCurrencyChange
  // The cart as of the last commit, readable from inside an async callback
  // after an await (the `cart` closure value is stale by then).
  const cartRef = useRef<Cart | null>(null)
  // Resolves once the stored cart has been checked. Writes wait for it (KI066):
  // an Add to Cart one second after load used to create a second cart while the
  // stored one was still being fetched; init then either overwrote the state
  // with the stored cart (item gone until a reload) or, when the stored cart was
  // already an order, deleted the new cart's id from localStorage.
  const initDoneRef = useRef<Promise<void>>(Promise.resolve())

  const setCart = useCallback((next: Cart | null) => {
    cartRef.current = next
    setCartState(next)
  }, [])

  const applyRegion = useCallback((answer: RegionAnswer) => {
    regionIdRef.current = answer.regionId
    if (answer.currency) setCurrencyState(answer.currency)
  }, [])

  useEffect(() => {
    // Resolve the visitor's region once: the server's answer, corrected to ZAR
    // for a browser on South African time while that answer is still a guess.
    async function resolveRegion(): Promise<RegionAnswer | null> {
      const answer = await fetchRegion()
      if (!answer) return null
      if (answer.auto && answer.usdEnabled && answer.currency === 'usd' && looksSouthAfrican()) {
        const corrected = await chooseCurrency('zar')
        if (corrected) {
          onCurrencyChangeRef.current?.()
          return corrected
        }
      }
      return answer
    }

    async function init() {
      const regionPromise = resolveRegion()
      // Cart-recovery links in the abandonment emails open
      // /checkout?cartId=<id>, often on another device, so that id wins over
      // whatever this browser had stored. The reminder showed that cart's
      // prices, so it is kept in its own region and the visitor's currency
      // follows it.
      const recoveryId = readRecoveryCartId()
      if (recoveryId) {
        const [recovered, region] = await Promise.all([fetchCart(recoveryId), regionPromise])
        if (region) applyRegion(region)
        if (recovered && !recovered.completed_at) {
          if (region && recovered.region_id !== region.regionId) {
            const own = asCurrency(recovered.currency_code?.toLowerCase())
            const chosen = own ? await chooseCurrency(own) : null
            if (chosen) {
              applyRegion(chosen)
              onCurrencyChangeRef.current?.()
            }
            // USD switched off since the reminder went out: the server only
            // offers ZAR, so the cart moves there.
            const target = regionIdRef.current
            if (target && recovered.region_id !== target) {
              const moved = await moveCartToRegion(recovered, target)
              if (moved) {
                rememberCartId(moved.cart.id)
                setCart(moved.cart)
                setDroppedOnSwitch(moved.dropped)
                return
              }
            }
          }
          rememberCartId(recovered.id)
          setCart(recovered)
          return
        }
      }

      const cartId = localStorage.getItem(CART_ID_KEY)
      if (cartId && cartId !== recoveryId) {
        // Both requests at once: the cart page waited for them in series.
        const [existing, region] = await Promise.all([fetchCart(cartId), regionPromise])
        if (region) applyRegion(region)
        if (existing && !existing.completed_at) {
          // A cart from another region (the visitor moved, or one from before USD
          // went live) is moved to the visitor's region, not thrown away.
          const resolved = regionIdRef.current
          if (!resolved || existing.region_id === resolved) {
            setCart(existing)
            return
          }
          const moved = await moveCartToRegion(existing, resolved)
          if (moved) {
            rememberCartId(moved.cart.id)
            setCart(moved.cart)
            setDroppedOnSwitch(moved.dropped)
            return
          }
        }
        localStorage.removeItem(CART_ID_KEY)
      } else {
        if (cartId) localStorage.removeItem(CART_ID_KEY)
        const region = await regionPromise
        if (region) applyRegion(region)
      }
    }
    // Never a rejected promise: localStorage can throw (private mode, storage
    // blocked) and every later write awaits this ref.
    initDoneRef.current = init()
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [setCart, applyRegion])

  const getOrCreateCart = useCallback(async (): Promise<Cart | null> => {
    await initDoneRef.current
    if (cartRef.current) return cartRef.current

    let regionId = regionIdRef.current
    if (!regionId) {
      const region = await fetchRegion()
      if (region) applyRegion(region)
      regionId = regionIdRef.current
    }
    if (!regionId) return null

    const newCart = await createCart(regionId)
    if (newCart) {
      localStorage.setItem(CART_ID_KEY, newCart.id)
      setCart(newCart)
    }
    return newCart
  }, [setCart, applyRegion])


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
      setCart(normaliseCart(data.cart))
    },
    [getOrCreateCart, setCart]
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
    [cart, setCart]
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
    [cart, setCart]
  )

  const setEmail = useCallback(
    async (email: string) => {
      const currentCart = await getOrCreateCart()
      if (!currentCart) return false
      try {
        const res = await fetch(`${getMedusaBase()}/store/carts/${currentCart.id}`, {
          method: 'POST',
          headers: getMedusaHeaders(),
          body: JSON.stringify({ email }),
        })
        if (!res.ok) return false
        const data = (await res.json()) as { cart: Cart }
        setCart(normaliseCart(data.cart))
        return true
      } catch {
        // The caller decides what to show; a free order needs the email on the cart.
        return false
      }
    },
    [getOrCreateCart, setCart]
  )

  const setContact = useCallback(
    async ({ email, firstName, lastName, countryCode, company, metadata }: CartContact) => {
      const currentCart = await getOrCreateCart()
      if (!currentCart) return false
      try {
        const res = await fetch(`${getMedusaBase()}/store/carts/${currentCart.id}`, {
          method: 'POST',
          headers: getMedusaHeaders(),
          body: JSON.stringify({
            email,
            billing_address: {
              first_name: firstName,
              last_name: lastName,
              ...(countryCode ? { country_code: countryCode.toLowerCase() } : {}),
              ...(company !== undefined ? { company } : {}),
            },
            // Medusa merges metadata: unsent keys stay, an empty value deletes the key.
            ...(metadata ? { metadata } : {}),
          }),
        })
        if (!res.ok) return false
        const data = (await res.json()) as { cart: Cart }
        setCart(normaliseCart(data.cart))
        return true
      } catch {
        return false
      }
    },
    [getOrCreateCart, setCart]
  )

  // Voucher codes. POST adds, DELETE removes; both return the recalculated cart.
  // Medusa answers 200 with the code silently missing from cart.promotions when
  // it is unknown or inactive, so the caller checks the cart, not the status.
  // Medusa matches codes case-sensitively and every code is stored in capitals,
  // while both voucher boxes only *display* capitals (CSS), so the typed text
  // is sent in capitals too (Cassidy, 8 Oct: "ri-team-test-100" was refused).
  const applyPromoCode = useCallback(
    async (typed: string) => {
      const code = typed.trim().toUpperCase()
      const currentCart = await getOrCreateCart()
      if (!currentCart) throw new Error('Could not create cart')
      const res = await fetch(`${getMedusaBase()}/store/carts/${currentCart.id}/promotions`, {
        method: 'POST',
        headers: getMedusaHeaders(),
        body: JSON.stringify({ promo_codes: [code] }),
      })
      // Fixed copy only: Medusa's own message is not shown to the buyer.
      if (res.status === 400 || res.status === 404) throw new Error('That voucher code is not valid')
      if (!res.ok) throw new Error('Could not apply the voucher right now. Please try again.')
      const data = (await res.json()) as { cart: Cart }
      const next = normaliseCart(data.cart)
      setCart(next)
      if (!next.promotions.some((p) => p.code?.toLowerCase() === code.toLowerCase())) {
        throw new Error('That voucher code is not valid')
      }
    },
    [getOrCreateCart, setCart]
  )

  const removePromoCode = useCallback(
    async (code: string) => {
      if (!cart) return
      const res = await fetch(`${getMedusaBase()}/store/carts/${cart.id}/promotions`, {
        method: 'DELETE',
        headers: getMedusaHeaders(),
        body: JSON.stringify({ promo_codes: [code] }),
      })
      if (!res.ok) throw new Error('Could not remove the voucher right now. Please try again.')
      const data = (await res.json()) as { cart: Cart }
      setCart(normaliseCart(data.cart))
    },
    [cart, setCart]
  )

  const clearCart = useCallback((cartId?: string) => {
    if (cartId && localStorage.getItem(CART_ID_KEY) !== cartId) {
      // Not this browser's cart. Still drop it from state if it is the one shown.
      if (cartRef.current?.id === cartId) setCart(null)
      return
    }
    localStorage.removeItem(CART_ID_KEY)
    setCart(null)
  }, [setCart])

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
      setContact,
      applyPromoCode,
      removePromoCode,
      clearCart,
      currency,
      droppedOnSwitch,
    }),
    [cart, isLoading, itemCount, addItem, updateItem, removeItem, setEmail, setContact, applyPromoCode, removePromoCode, clearCart, currency, droppedOnSwitch]
  )

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}
