'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Mail, Calendar, ArrowRight } from 'lucide-react'
import { useCart } from '@/lib/cart'

export default function ConfirmationContent() {
  const { clearCart } = useCart()
  const searchParams = useSearchParams()
  const [medusaOrderId, setMedusaOrderId] = useState<string | null>(null)

  // PayFast return params
  const paymentId = searchParams.get('pf_payment_id') ?? null
  const payFastCartId = searchParams.get('m_payment_id') ?? null

  // PayPal return params: gateway=paypal&cartId=xxx&token=PAYPAL_ORDER_ID&PayerID=yyy
  const gateway = searchParams.get('gateway') ?? null
  const isPayPal = gateway === 'paypal'
  const payPalOrderId = searchParams.get('token') ?? null
  const payPalCartId = searchParams.get('cartId') ?? null

  // Free (voucher) orders arrive already completed: free=1&order=<display id>
  const isFreeOrder = searchParams.get('free') === '1'
  const freeOrderNumber = searchParams.get('order') ?? null

  const cartId = isPayPal ? payPalCartId : payFastCartId

  // Guard against React Strict Mode double-invocation and page refreshes
  const finalisedRef = useRef(false)

  useEffect(() => {
    if (finalisedRef.current) return
    finalisedRef.current = true

    async function finalise() {
      if (isFreeOrder) {
        // Completed server-side by /api/checkout/free before the redirect here.
        // The order number in the URL is display only; nothing here trusts it.
      } else if (isPayPal && payPalOrderId && payPalCartId) {
        try {
          const res = await fetch('/api/checkout/paypal/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: payPalOrderId, cartId: payPalCartId }),
          })
          if (res.ok) {
            const data = (await res.json()) as { medusaOrderId?: string | null }
            if (data.medusaOrderId) {
              setMedusaOrderId(data.medusaOrderId)
            }
          }
        } catch {
          // Capture fails gracefully: payment was already received by PayPal
        }
      } else if (payFastCartId) {
        try {
          const res = await fetch('/api/checkout/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartId: payFastCartId }),
          })
          if (res.ok) {
            const data = (await res.json()) as { type?: string; order?: { id: string } }
            if (data.type === 'order' && data.order?.id) {
              setMedusaOrderId(data.order.id)
            }
          }
        } catch {
          // Cart completion fails gracefully: payment was already received by PayFast
        }
      }
      clearCart()
    }
    void finalise()
  }, [isFreeOrder, isPayPal, payPalOrderId, payPalCartId, payFastCartId, clearCart])

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
              {isFreeOrder && freeOrderNumber
                ? `Order #${freeOrderNumber} is confirmed. We're excited to support your transformation journey.`
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
                body: 'Dr. Ravenall\'s team will be in touch within 24 hours to schedule your first session.',
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
          {(paymentId ?? cartId ?? medusaOrderId) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mb-10 p-4 bg-brand-sand rounded-xl border border-brand-border text-sm text-brand-muted space-y-1"
            >
              {medusaOrderId && (
                <p>
                  <span className="font-medium text-brand-ink">Order ID:</span>{' '}
                  <code className="font-mono">{medusaOrderId}</code>
                </p>
              )}
              {cartId && !medusaOrderId && (
                <p>
                  <span className="font-medium text-brand-ink">Reference:</span>{' '}
                  <code className="font-mono">{cartId}</code>
                </p>
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
