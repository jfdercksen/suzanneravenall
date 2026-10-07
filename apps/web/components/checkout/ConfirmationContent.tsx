'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Mail, Calendar, ArrowRight, Clock, Loader2, ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart'

// confirmed: Medusa says the cart is now an order (or PayPal captured it).
// pending:   a real cart, but no order yet (PayFast ITN still on its way, or
//            the payment did not go through). The cart is left alone.
// none:      nothing in the URL that identifies an order.
type OrderState = 'checking' | 'confirmed' | 'pending' | 'none'
type SettledState = Exclude<OrderState, 'checking'>

const POLL_INTERVAL_MS = 2000

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface StatusResult {
  state: SettledState
  /** The buyer-facing order number (display id), when Medusa returned one. */
  orderNumber: number | null
}

// Asks /api/checkout/status whether the cart has become an order, retrying
// while it is still pending (the PayFast ITN can land after the buyer returns).
async function checkOrderStatus(cartId: string, attempts: number): Promise<StatusResult> {
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await wait(POLL_INTERVAL_MS)
    try {
      const res = await fetch(`/api/checkout/status?cartId=${encodeURIComponent(cartId)}`, {
        cache: 'no-store',
      })
      if (res.status === 404) return { state: 'none', orderNumber: null }
      if (res.ok) {
        const data = (await res.json()) as { status?: string; orderNumber?: number | null }
        if (data.status === 'completed') {
          return { state: 'confirmed', orderNumber: typeof data.orderNumber === 'number' ? data.orderNumber : null }
        }
      }
    } catch {
      // Network blip: try again on the next round.
    }
  }
  return { state: 'pending', orderNumber: null }
}

export default function ConfirmationContent() {
  const { clearCart } = useCart()
  const searchParams = useSearchParams()
  const [orderNumber, setOrderNumber] = useState<number | null>(null)
  const [orderState, setOrderState] = useState<OrderState>('checking')

  // PayFast return params: gateway=payfast&m_payment_id=<cartId> (set in our return_url)
  const paymentId = searchParams.get('pf_payment_id') ?? null
  const payFastCartId = searchParams.get('m_payment_id') ?? null

  // PayPal return params: gateway=paypal&cartId=xxx&token=PAYPAL_ORDER_ID&PayerID=yyy
  const gateway = searchParams.get('gateway') ?? null
  const isPayPal = gateway === 'paypal'
  const payPalOrderId = searchParams.get('token') ?? null
  const payPalCartId = isPayPal ? (searchParams.get('cartId') ?? null) : null

  // Free (voucher) orders arrive already completed: free=1&order=<display id>&cartId=<id>
  const isFreeOrder = searchParams.get('free') === '1'
  const freeOrderNumber = searchParams.get('order') ?? null
  const freeCartId = isFreeOrder ? (searchParams.get('cartId') ?? null) : null

  const cartId = isPayPal ? payPalCartId : isFreeOrder ? freeCartId : payFastCartId

  // Guard against React Strict Mode double-invocation and page refreshes
  const finalisedRef = useRef(false)

  useEffect(() => {
    if (finalisedRef.current) return
    finalisedRef.current = true

    async function finalise() {
      let state: SettledState = 'none'
      let number: number | null = null

      if (isFreeOrder && freeCartId) {
        // Completed server-side by /api/checkout/free before the redirect here;
        // confirm it with Medusa rather than trust the order number in the URL.
        ;({ state, orderNumber: number } = await checkOrderStatus(freeCartId, 2))
      } else if (isPayPal && payPalOrderId && payPalCartId) {
        try {
          const res = await fetch('/api/checkout/paypal/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: payPalOrderId, cartId: payPalCartId }),
          })
          if (res.ok) {
            // The capture route only answers 200 once PayPal has captured the
            // payment for this cart.
            state = 'confirmed'
          }
        } catch {
          // Fall through to the status check below
        }
        if (state !== 'confirmed') {
          // Captured on an earlier visit (refresh) or completed by the PayPal webhook.
          ;({ state, orderNumber: number } = await checkOrderStatus(payPalCartId, 2))
        } else {
          // Captured just now: one read for the order number only.
          number = (await checkOrderStatus(payPalCartId, 1)).orderNumber
        }
      } else if (payFastCartId) {
        try {
          // The status check below decides, and reads the order number.
          await fetch('/api/checkout/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartId: payFastCartId }),
          })
        } catch {
          // The PayFast ITN completes the cart server-side; the status check decides.
        }
        ;({ state, orderNumber: number } = await checkOrderStatus(payFastCartId, 6))
      }

      setOrderNumber(number)
      setOrderState(state)
      // Only a confirmed order empties the cart, and only the cart it was for.
      if (state === 'confirmed' && cartId) {
        clearCart(cartId)
      }
    }
    void finalise()
  }, [isFreeOrder, freeCartId, isPayPal, payPalOrderId, payPalCartId, payFastCartId, cartId, clearCart])

  if (orderState !== 'confirmed') {
    return <OrderStatusMessage state={orderState} />
  }

  // Medusa's number first; the free-order URL number only once Medusa has
  // confirmed that cart (the state check above).
  const shownOrderNumber = orderNumber ?? (isFreeOrder ? freeOrderNumber : null)

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Hero */}
      <section className="w-full bg-brand-sand border-b border-brand-border py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6"
          >
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              {isFreeOrder ? 'Order Confirmed' : 'Payment Received'}
            </p>
            <h1 className="text-4xl lg:text-5xl font-medium tracking-tight text-brand-primary mb-4">
              Thank You!
            </h1>
            <p className="text-brand-muted text-lg max-w-md mx-auto">
              {shownOrderNumber
                ? `Order #${shownOrderNumber} is confirmed. We're excited to support your transformation journey.`
                : "Your purchase is confirmed. We're excited to support your transformation journey."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Details */}
      <section className="w-full bg-brand-cream py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: Mail,
                heading: 'Confirmation Email',
                body: 'A receipt has been sent to your email address.',
              },
              {
                icon: Calendar,
                heading: 'What Happens Next',
                body: 'If you bought a session, click the booking link in your email to schedule it. For programmes, your access details are in your email. If you have any issues, please email us and we\'ll be happy to help.',
              },
              {
                icon: ArrowRight,
                heading: 'Prepare Yourself',
                body: 'Reflect on what you most want to change. Your transformation begins now.',
              },
            ].map(({ icon: Icon, heading, body }, i) => (
              <motion.div
                key={heading}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="bg-brand-sand rounded-2xl p-6"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-accent/10 text-brand-accent mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-brand-ink mb-2">{heading}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>

          {/* Order reference */}
          {(paymentId ?? cartId ?? shownOrderNumber) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mb-10 p-4 bg-brand-sand rounded-xl border border-brand-border text-sm text-brand-muted space-y-1"
            >
              {shownOrderNumber ? (
                <p>
                  <span className="font-medium text-brand-ink">Order number:</span>{' '}
                  <span className="font-mono">#{shownOrderNumber}</span>
                </p>
              ) : (
                cartId && (
                  // Only when Medusa could not give the number: the cart id still
                  // lets us find the order if the buyer gets in touch.
                  <p>
                    <span className="font-medium text-brand-ink">Reference:</span>{' '}
                    <code className="font-mono">{cartId}</code>
                  </p>
                )
              )}
              {paymentId && (
                <p>
                  <span className="font-medium text-brand-ink">PayFast payment ID:</span>{' '}
                  <code className="font-mono">{paymentId}</code>
                </p>
              )}
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/shop"
              className="inline-block text-center py-4 px-8 rounded-button text-base font-medium bg-brand-accent-600 hover:bg-brand-accent-700 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Browse More Programmes
            </Link>
            <Link
              href="/contact"
              className="inline-block text-center py-4 px-8 rounded-button text-base font-medium border-2 border-brand-primary-300 text-brand-ink hover:border-brand-accent hover:text-brand-accent transition-all duration-300"
            >
              Contact Dr. Ravenall
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

function OrderStatusMessage({ state }: { state: Exclude<OrderState, 'confirmed'> }) {
  const content = {
    checking: {
      Icon: Loader2,
      eyebrow: 'One Moment',
      heading: 'Confirming your order',
      body: 'We are checking your order with our payment system. This usually takes a few seconds.',
    },
    pending: {
      Icon: Clock,
      eyebrow: 'Not Confirmed Yet',
      heading: 'We are still waiting for your payment',
      body: 'We have not received confirmation of this payment yet. If you completed the payment, your confirmation email will arrive shortly. If not, your cart is still saved and you can try again.',
    },
    none: {
      Icon: ShoppingBag,
      eyebrow: 'No Order Found',
      heading: 'There is no order to show',
      body: 'We could not find an order for this page. If you have just paid, please check your email for your confirmation.',
    },
  }[state]
  const { Icon } = content

  return (
    <div className="min-h-screen bg-brand-cream">
      <section className="w-full bg-brand-sand border-b border-brand-border py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center" role="status">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-accent/10 mb-6">
            <Icon className={`w-10 h-10 text-brand-accent${state === 'checking' ? ' animate-spin' : ''}`} />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
            {content.eyebrow}
          </p>
          <h1 className="text-4xl lg:text-5xl font-medium tracking-tight text-brand-primary mb-4">
            {content.heading}
          </h1>
          <p className="text-brand-muted text-lg max-w-md mx-auto">{content.body}</p>
          {state !== 'checking' && (
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/cart"
                className="inline-block text-center py-4 px-8 rounded-button text-base font-medium bg-brand-accent-600 hover:bg-brand-accent-700 text-white transition-all duration-300"
              >
                View Your Cart
              </Link>
              <Link
                href="/contact"
                className="inline-block text-center py-4 px-8 rounded-button text-base font-medium border-2 border-brand-primary-300 text-brand-ink hover:border-brand-accent hover:text-brand-accent transition-all duration-300"
              >
                Contact Us
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
