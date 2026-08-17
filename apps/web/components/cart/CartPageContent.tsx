'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingBag, Lock, ShieldCheck, RefreshCw } from 'lucide-react'
import { useCart, formatPrice } from '@/lib/cart'

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

function QuantityControl({
  quantity,
  onIncrease,
  onDecrease,
  isUpdating,
}: {
  quantity: number
  onIncrease: () => void
  onDecrease: () => void
  isUpdating: boolean
}) {
  return (
    <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onDecrease}
        disabled={isUpdating || quantity <= 1}
        aria-label="Decrease quantity"
        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 text-center text-sm font-medium text-gray-900 tabular-nums">
        {quantity}
      </span>
      <button
        onClick={onIncrease}
        disabled={isUpdating}
        aria-label="Increase quantity"
        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
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
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
        <ShoppingBag className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="text-2xl font-light text-gray-900 mb-3">Your cart is empty</h2>
      <p className="text-gray-500 mb-8 max-w-sm mx-auto">
        Explore our programmes and find the transformation that&apos;s right for you.
      </p>
      <Link
        href="/shop"
        className="inline-block py-4 px-8 rounded-button text-base font-semibold bg-brand-accent-600 hover:bg-brand-accent-700 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
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
      <div className="min-h-screen bg-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-6 py-6 border-b border-gray-100">
                <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const hasItems = cart && cart.items.length > 0

  return (
    <div className="min-h-screen bg-white">
      {/* Hero strip */}
      <section className="w-full bg-brand-primary py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-3">
              {hasItems ? `${cart.items.reduce((s, i) => s + i.quantity, 0)} item${cart.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}` : 'Empty'}
            </p>
            <h1 className="text-4xl lg:text-5xl font-light text-white">Your Cart</h1>
          </motion.div>
        </div>
      </section>

      {/* Cart body */}
      <section className="w-full bg-white py-12 lg:py-16">
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
                  className="divide-y divide-gray-100"
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
      <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100">
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
        <p className="text-sm font-semibold text-gray-900 leading-snug">{item.title}</p>
        {item.subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
        )}
        <p className="text-sm font-medium text-gray-700 mt-2">
          {formatPrice(item.unit_price, currencyCode)}
        </p>

        <div className="flex items-center gap-4 mt-3">
          <QuantityControl
            quantity={item.quantity}
            onIncrease={() => wrap(onIncrease)}
            onDecrease={() => wrap(onDecrease)}
            isUpdating={isUpdating}
          />
          <button
            onClick={onRemove}
            aria-label={`Remove ${item.title} from cart`}
            className="text-gray-400 hover:text-red-500 transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Line total */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-semibold text-gray-900 tabular-nums">
          {formatPrice(item.subtotal, currencyCode)}
        </p>
      </div>
    </motion.li>
  )
}

function OrderSummary({ cart }: { cart: import('@/lib/cart').Cart }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 space-y-4 sticky top-8">
      <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium text-gray-900 tabular-nums">
            {formatPrice(cart.subtotal, cart.currency_code)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Shipping</span>
          <span className="font-medium text-gray-900">Free</span>
        </div>
        {cart.tax_total > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Tax</span>
            <span className="font-medium text-gray-900 tabular-nums">
              {formatPrice(cart.tax_total, cart.currency_code)}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4 flex justify-between">
        <span className="font-semibold text-gray-900">Total</span>
        <span className="font-bold text-xl text-gray-900 tabular-nums">
          {formatPrice(cart.total, cart.currency_code)}
        </span>
      </div>

      <Link
        href="/checkout"
        className="w-full block text-center py-4 px-6 rounded-button text-base font-semibold bg-brand-accent-600 hover:bg-brand-accent-700 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      >
        Proceed to Checkout
      </Link>

      {/* Trust badges */}
      <div className="pt-2 space-y-2">
        {[
          { icon: Lock, label: 'Secure checkout' },
          { icon: ShieldCheck, label: 'PayFast payment gateway' },
          { icon: RefreshCw, label: 'Cancel anytime' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-gray-400">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
