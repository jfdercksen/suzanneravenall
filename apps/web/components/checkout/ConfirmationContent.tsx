'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Mail, Calendar, ArrowRight } from 'lucide-react'
import { useCart } from '@/lib/cart'

export default function ConfirmationContent() {
  const { clearCart } = useCart()
  const searchParams = useSearchParams()

  const paymentId = searchParams.get('pf_payment_id') ?? null
  const orderId = searchParams.get('m_payment_id') ?? null

  // Clear the cart once the confirmation page is reached
  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="w-full bg-brand-primary py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 mb-6"
          >
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Payment Received
            </p>
            <h1 className="text-4xl lg:text-5xl font-light text-white mb-4">
              Thank You!
            </h1>
            <p className="text-white/60 text-lg max-w-md mx-auto">
              Your purchase is confirmed. We&apos;re excited to support your transformation journey.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Details */}
      <section className="w-full bg-white py-16 lg:py-20">
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
                className="bg-gray-50 rounded-2xl p-6"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-accent/10 text-brand-accent mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{heading}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>

          {/* Order reference */}
          {(paymentId ?? orderId) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mb-10 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-500 space-y-1"
            >
              {orderId && (
                <p>
                  <span className="font-medium text-gray-700">Order reference:</span>{' '}
                  <code className="font-mono">{orderId}</code>
                </p>
              )}
              {paymentId && (
                <p>
                  <span className="font-medium text-gray-700">Payment ID:</span>{' '}
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
              className="inline-block text-center py-4 px-8 rounded-button text-base font-semibold bg-brand-accent-600 hover:bg-brand-accent-700 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Browse More Programmes
            </Link>
            <Link
              href="/contact"
              className="inline-block text-center py-4 px-8 rounded-button text-base font-semibold border-2 border-gray-200 text-gray-700 hover:border-brand-accent hover:text-brand-accent transition-all duration-300"
            >
              Contact Dr. Ravenall
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
