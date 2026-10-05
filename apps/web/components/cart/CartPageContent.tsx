'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingBag, Lock, ShieldCheck, RefreshCw, Tag, X } from 'lucide-react'
import { useCart, formatPrice } from '@/lib/cart'
import { isSubscriptionLine, maxQuantity } from './cartRules'

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

function QuantityControl({
  quantity,
  max,
  onIncrease,
  onDecrease,
  isUpdating,
}: {
  quantity: number
  /** Seats, sessions, courses and downloads are one per order (site check C19). */
  max: number
  onIncrease: () => void
  onDecrease: () => void
  isUpdating: boolean
}) {
  // A one-per-order item already at one has nothing to adjust.
  if (max <= 1 && quantity <= 1) {
    return <span className="text-xs text-brand-muted">Qty 1</span>
  }

  return (
    <div className="flex items-center gap-1 border border-brand-border rounded-lg overflow-hidden">
      <button
        onClick={onDecrease}
        disabled={isUpdating || quantity <= 1}
        aria-label="Decrease quantity"
        className="w-8 h-8 flex items-center justify-center text-brand-muted hover:bg-brand-sand disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 text-center text-sm font-medium text-brand-ink tabular-nums">
        {quantity}
      </span>
      <button
        onClick={onIncrease}
        disabled={isUpdating || quantity >= max}
        aria-label="Increase quantity"
        className="w-8 h-8 flex items-center justify-center text-brand-muted hover:bg-brand-sand disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  )
}

function EmptyCart() {
  return (
    <motion.div
      {...fadeUp}
      className="text-center py-24 px-4"
    >
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-sand mb-6">
        <ShoppingBag className="w-8 h-8 text-brand-muted" />
      </div>
      <h2 className="text-2xl font-medium text-brand-ink mb-3">Your cart is empty</h2>
      <p className="text-brand-muted mb-8 max-w-sm mx-auto">
        Explore our programmes and find the transformation that&apos;s right for you.
      </p>
      <Link
        href="/shop"
        className="inline-block py-4 px-8 rounded-button text-base font-medium bg-brand-accent-600 hover:bg-brand-accent-700 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      >
        Browse Programmes
      </Link>
    </motion.div>
  )
}

export default function CartPageContent() {
  const { cart, isLoading, updateItem, removeItem } = useCart()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-cream py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-6 py-6 border-b border-brand-border">
                <div className="w-24 h-24 bg-brand-border rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-brand-border rounded w-2/3" />
                  <div className="h-3 bg-brand-sand rounded w-1/3" />
                </div>
                <div className="w-20 h-6 bg-brand-border rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const hasItems = cart && cart.items.length > 0

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Hero strip */}
      <section className="w-full bg-brand-sand border-b border-brand-border py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
              {hasItems ? `${cart.items.reduce((s, i) => s + i.quantity, 0)} item${cart.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}` : 'Empty'}
            </p>
            <h1 className="text-4xl lg:text-5xl font-medium tracking-tight text-brand-primary">Your Cart</h1>
          </motion.div>
        </div>
      </section>

      {/* Cart body */}
      <section className="w-full bg-brand-cream py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {!hasItems ? (
            <EmptyCart />
          ) : (
            <div className="lg:grid lg:grid-cols-3 lg:gap-12">
              {/* Items list */}
              <div className="lg:col-span-2">
                <motion.ul
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                  className="divide-y divide-brand-border"
                >
                  {cart.items.map((item) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      currencyCode={cart.currency_code}
                      onIncrease={() => updateItem(item.id, item.quantity + 1)}
                      onDecrease={() => updateItem(item.id, item.quantity - 1)}
                      onRemove={() => removeItem(item.id)}
                    />
                  ))}
                </motion.ul>

                <div className="mt-8">
                  <Link
                    href="/shop"
                    className="text-sm text-brand-accent hover:text-brand-primary font-medium underline underline-offset-4 transition-colors duration-200"
                  >
                    ← Continue browsing
                  </Link>
                </div>
              </div>

              {/* Order summary */}
              <div className="mt-10 lg:mt-0">
                <OrderSummary cart={cart} />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function CartItemRow({
  item,
  currencyCode,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  item: import('@/lib/cart').CartItem
  currencyCode: string
  onIncrease: () => void
  onDecrease: () => void
  onRemove: () => void
}) {
  const [isUpdating, setIsUpdating] = useState(false)

  async function wrap(fn: () => void) {
    setIsUpdating(true)
    fn()
    // give a brief moment for the cart context to complete the request
    setTimeout(() => setIsUpdating(false), 800)
  }

  return (
    <motion.li
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      className="flex gap-4 sm:gap-6 py-6"
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-brand-sand">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.title}
            width={96}
            height={96}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-primary/10">
            <ShoppingBag className="w-6 h-6 text-brand-primary/40" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-ink leading-snug">{item.title}</p>
        {item.subtitle && (
          <p className="text-xs text-brand-muted mt-0.5">{item.subtitle}</p>
        )}
        <p className="text-sm font-medium text-brand-ink mt-2">
          {formatPrice(item.unit_price, currencyCode)}
        </p>

        <div className="flex items-center gap-4 mt-3">
          <QuantityControl
            quantity={item.quantity}
            max={maxQuantity(item)}
            onIncrease={() => wrap(onIncrease)}
            onDecrease={() => wrap(onDecrease)}
            isUpdating={isUpdating}
          />
          <button
            onClick={onRemove}
            aria-label={`Remove ${item.title} from cart`}
            className="text-brand-muted hover:text-red-600 transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Line total */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-semibold text-brand-ink tabular-nums">
          {formatPrice(item.subtotal, currencyCode)}
        </p>
      </div>
    </motion.li>
  )
}

function VoucherField() {
  const { cart, applyPromoCode, removePromoCode } = useCart()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const applied = cart?.promotions.find((p) => p.code)?.code ?? null

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    setBusy(true)
    setError(null)
    try {
      await applyPromoCode(trimmed)
      setCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That voucher code is not valid')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    if (!applied) return
    setBusy(true)
    setError(null)
    try {
      await removePromoCode(applied)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the voucher')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {applied ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-cream px-3 py-2 text-sm">
          <span className="inline-flex items-center gap-2 text-brand-ink">
            <Tag className="w-4 h-4" aria-hidden="true" />
            Voucher <span className="font-mono font-medium">{applied}</span> applied
          </span>
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            aria-label={`Remove voucher ${applied}`}
            className="inline-flex items-center gap-1 text-xs text-brand-muted hover:text-brand-ink underline underline-offset-4 disabled:opacity-60 transition-colors duration-200"
          >
            <X className="w-3 h-3" aria-hidden="true" />
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} noValidate className="flex gap-2">
          <label htmlFor="cart-voucher" className="sr-only">
            Voucher code
          </label>
          <input
            id="cart-voucher"
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              if (error) setError(null)
            }}
            placeholder="Voucher code"
            autoComplete="off"
            autoCapitalize="characters"
            aria-invalid={!!error}
            aria-describedby={error ? 'cart-voucher-error' : undefined}
            className={`min-w-0 flex-1 px-3 py-2 rounded-xl border text-brand-ink placeholder-brand-muted text-sm uppercase transition-colors duration-200 outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent ${
              error ? 'border-red-600 bg-red-50' : 'border-brand-primary-300 bg-white'
            }`}
          />
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-brand-primary-300 text-brand-ink hover:bg-brand-cream disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
          >
            {busy ? 'Applying...' : 'Apply'}
          </button>
        </form>
      )}
      {error && (
        <p id="cart-voucher-error" className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function OrderSummary({ cart }: { cart: import('@/lib/cart').Cart }) {
  const voucherCode = cart.promotions.find((p) => p.code)?.code ?? null
  const hasSubscription = cart.items.some(isSubscriptionLine)

  return (
    <div className="bg-brand-sand rounded-2xl p-6 space-y-4 sticky top-8">
      <h2 className="text-lg font-medium text-brand-ink">Order Summary</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-brand-muted">Subtotal</span>
          <span className="font-medium text-brand-ink tabular-nums">
            {formatPrice(cart.subtotal, cart.currency_code)}
          </span>
        </div>
        {cart.discount_total > 0 && (
          <div className="flex justify-between">
            <span className="text-brand-muted">Voucher{voucherCode ? ` (${voucherCode})` : ''}</span>
            <span className="font-medium text-brand-ink tabular-nums">
              -{formatPrice(cart.discount_total, cart.currency_code)}
            </span>
          </div>
        )}
        {/* Only shown when something is charged for delivery: sessions,
            courses and downloads have no shipping (site check C19). */}
        {cart.shipping_total > 0 && (
          <div className="flex justify-between">
            <span className="text-brand-muted">Shipping</span>
            <span className="font-medium text-brand-ink tabular-nums">
              {formatPrice(cart.shipping_total, cart.currency_code)}
            </span>
          </div>
        )}
        {cart.tax_total > 0 && (
          <div className="flex justify-between">
            <span className="text-brand-muted">Tax</span>
            <span className="font-medium text-brand-ink tabular-nums">
              {formatPrice(cart.tax_total, cart.currency_code)}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-brand-border pt-4 flex justify-between">
        <span className="font-semibold text-brand-ink">Total</span>
        <span className="font-semibold text-xl text-brand-ink tabular-nums">
          {formatPrice(cart.total, cart.currency_code)}
        </span>
      </div>

      {/* The voucher used to appear only after the contact details step. */}
      <VoucherField />

      <Link
        href="/checkout"
        className="w-full block text-center py-4 px-6 rounded-button text-base font-medium bg-brand-accent-600 hover:bg-brand-accent-700 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      >
        Proceed to Checkout
      </Link>

      {/* Trust badges */}
      <div className="pt-2 space-y-2">
        {[
          { icon: Lock, label: 'Secure checkout' },
          // Checkout sends South African billing to PayFast and international
          // billing to PayPal (components/checkout/CheckoutContent.tsx).
          { icon: ShieldCheck, label: 'PayFast (South Africa) or PayPal (international)' },
          // Only true of a subscription; one-off sessions and courses cannot be cancelled this way.
          ...(hasSubscription ? [{ icon: RefreshCw, label: 'Cancel anytime' }] : []),
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-brand-muted">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
