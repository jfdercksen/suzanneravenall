'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, ChevronRight, Lock, Tag, X } from 'lucide-react'
import { useCart, formatPrice } from '@/lib/cart'

type Step = 1 | 2 | 3

interface ContactForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  country: 'ZA' | 'INTL'
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  country?: string
}

function validateContact(form: ContactForm): FormErrors {
  const errors: FormErrors = {}
  if (!form.firstName.trim()) errors.firstName = 'First name is required'
  if (!form.lastName.trim()) errors.lastName = 'Last name is required'
  if (!form.email.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email address'
  }
  if (!['ZA', 'INTL'].includes(form.country)) {
    errors.country = 'Please select a billing country'
  }
  return errors
}

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: 'Contact' },
    { n: 2, label: 'Payment' },
    { n: 3, label: 'Processing' },
  ]

  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map(({ n, label }, i) => {
        const isDone = step > n
        const isCurrent = step === n

        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  isDone
                    ? 'bg-brand-primary-900 text-white'
                    : isCurrent
                      ? 'bg-brand-accent-600 text-white'
                      : 'bg-brand-border text-brand-primary-500'
                }`}
              >
                {isDone ? '✓' : n}
              </div>
              <span
                className={`text-xs font-medium transition-colors duration-300 ${
                  isCurrent ? 'text-brand-ink' : 'text-brand-muted'
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px w-16 sm:w-24 mx-2 mb-5 transition-colors duration-300 ${
                  step > n ? 'bg-brand-primary-900' : 'bg-brand-primary-300'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function OrderSideBar() {
  const { cart } = useCart()
  if (!cart || cart.items.length === 0) return null

  const voucherCode = cart.promotions.find((p) => p.code)?.code ?? null

  return (
    <div className="bg-white rounded-2xl border border-brand-border p-6">
      <h3 className="text-sm font-medium text-brand-ink mb-4">Order Summary</h3>
      <ul className="space-y-3 mb-4">
        {cart.items.map((item) => (
          <li key={item.id} className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-brand-sand flex-shrink-0">
              {item.thumbnail ? (
                <Image
                  src={item.thumbnail}
                  alt={item.title}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-primary/10">
                  <ShoppingBag className="w-4 h-4 text-brand-primary/40" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-brand-ink leading-snug">{item.title}</p>
              {item.subtitle && (
                <p className="text-xs text-brand-muted">{item.subtitle}</p>
              )}
              <p className="text-xs text-brand-muted">Qty: {item.quantity}</p>
            </div>
            <p className="text-xs font-semibold text-brand-ink tabular-nums flex-shrink-0">
              {formatPrice(item.subtotal, cart.currency_code)}
            </p>
          </li>
        ))}
      </ul>
      <div className="border-t border-brand-border pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-brand-muted">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatPrice(cart.subtotal, cart.currency_code)}</span>
        </div>
        {cart.discount_total > 0 && (
          <div className="flex justify-between text-brand-muted">
            <span>Voucher{voucherCode ? ` (${voucherCode})` : ''}</span>
            <span className="tabular-nums">-{formatPrice(cart.discount_total, cart.currency_code)}</span>
          </div>
        )}
        {cart.tax_total > 0 && (
          <div className="flex justify-between text-brand-muted">
            <span>Tax</span>
            <span className="tabular-nums">{formatPrice(cart.tax_total, cart.currency_code)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-brand-ink pt-1">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(cart.total, cart.currency_code)}</span>
        </div>
      </div>
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-600">{message}</p>
}

function InputField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  error,
  required,
  autoComplete,
}: {
  label: string
  id: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
  required?: boolean
  autoComplete?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-brand-ink mb-1.5">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full px-4 py-3 rounded-xl border text-brand-ink placeholder-brand-muted text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent ${
          error ? 'border-red-600 bg-red-50' : 'border-brand-primary-300 bg-white hover:border-brand-primary-400'
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Hidden PayFast form that auto-submits on mount
function PayFastRedirectForm({
  params,
  endpoint,
}: {
  params: Record<string, string>
  endpoint: string
}) {
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      formRef.current?.submit()
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <form ref={formRef} method="POST" action={endpoint} className="hidden" aria-hidden="true">
      {Object.entries(params).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
    </form>
  )
}

// PayPal redirect: uses window.location since PayPal uses GET approval URL
function PayPalRedirect({ approvalUrl }: { approvalUrl: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = approvalUrl
    }, 1200)
    return () => clearTimeout(timer)
  }, [approvalUrl])

  return null
}

export default function CheckoutContent() {
  const router = useRouter()
  const { cart, setContact: saveContact, applyPromoCode, removePromoCode } = useCart()

  const [step, setStep] = useState<Step>(1)
  const [contact, setContact] = useState<ContactForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'ZA',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [payFastData, setPayFastData] = useState<{
    params: Record<string, string>
    endpoint: string
  } | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [payPalApprovalUrl, setPayPalApprovalUrl] = useState<string | null>(null)
  const [voucherInput, setVoucherInput] = useState('')
  const [voucherBusy, setVoucherBusy] = useState(false)
  const [voucherError, setVoucherError] = useState<string | null>(null)

  const appliedVoucher = cart?.promotions.find((p) => p.code)?.code ?? null
  // A cart the voucher has taken to zero skips the gateway entirely. Number()
  // because Medusa's money fields are not always plain numbers on the wire.
  const isFreeOrder = Boolean(cart && appliedVoucher && Number(cart.total) === 0)

  // Redirect to /cart if cart is empty (after initial load)
  useEffect(() => {
    if (cart !== null && cart.items.length === 0) {
      router.replace('/cart')
    }
  }, [cart, router])

  function updateContact(field: keyof ContactForm, value: string) {
    setContact((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validation = validateContact(contact)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }
    setIsSubmitting(true)
    // Names go on the billing address: a guest customer has none, and Thinkific,
    // Vtiger and the invoice read them from there.
    const saved = await saveContact({
      email: contact.email,
      firstName: contact.firstName.trim(),
      lastName: contact.lastName.trim(),
      countryCode: contact.country === 'ZA' ? 'za' : undefined,
    })
    setIsSubmitting(false)
    if (!saved) {
      setErrors({ email: 'We could not save your email address. Please check your connection and try again.' })
      return
    }
    setStep(2)
  }

  async function handlePayWithPayFast() {
    if (!cart) return
    setIsSubmitting(true)
    setPaymentError(null)

    try {
      const firstItem = cart.items[0]
      const itemName =
        cart.items.length === 1 && firstItem
          ? firstItem.title
          : `Dr. Suzanne Ravenall Programme${cart.items.length > 1 ? 's' : ''}`

      const res = await fetch('/api/checkout/payfast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountInCents: cart.total,
          itemName,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          cartId: cart.id,
        }),
      })

      if (!res.ok) {
        throw new Error('Payment configuration error')
      }

      const data = (await res.json()) as {
        params: Record<string, string>
        endpoint: string
      }
      setPayFastData(data)
      setStep(3)
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : 'Unable to initialise payment. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePayWithPayPal() {
    if (!cart) return
    setIsSubmitting(true)
    setPaymentError(null)

    try {
      const firstItem = cart.items[0]
      const itemName =
        cart.items.length === 1 && firstItem
          ? firstItem.title
          : `Dr. Suzanne Ravenall Programme${cart.items.length > 1 ? 's' : ''}`

      const res = await fetch('/api/checkout/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountInCents: cart.total,
          currencyCode: 'ZAR',
          itemName,
          cartId: cart.id,
        }),
      })

      if (!res.ok) {
        throw new Error('Payment configuration error')
      }

      const data = (await res.json()) as { orderId: string; approvalUrl: string }
      setPayPalApprovalUrl(data.approvalUrl)
      setStep(3)
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : 'Unable to initialise PayPal payment. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleApplyVoucher(e: React.FormEvent) {
    e.preventDefault()
    const code = voucherInput.trim()
    if (!code) return
    setVoucherBusy(true)
    setVoucherError(null)
    try {
      await applyPromoCode(code)
      setVoucherInput('')
    } catch (err) {
      setVoucherError(err instanceof Error ? err.message : 'That voucher code is not valid')
    } finally {
      setVoucherBusy(false)
    }
  }

  async function handleRemoveVoucher() {
    if (!appliedVoucher) return
    setVoucherBusy(true)
    setVoucherError(null)
    try {
      await removePromoCode(appliedVoucher)
    } catch (err) {
      setVoucherError(err instanceof Error ? err.message : 'Could not remove the voucher')
    } finally {
      setVoucherBusy(false)
    }
  }

  async function handlePlaceFreeOrder() {
    if (!cart) return
    setIsSubmitting(true)
    setPaymentError(null)
    try {
      const res = await fetch('/api/checkout/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId: cart.id }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        alreadyPlaced?: boolean
        order?: { id: string; display_id: number }
      }
      if (res.status === 409 && data.alreadyPlaced) {
        // A retry after a dropped response: the first attempt did place it.
        router.push('/checkout/confirmation?free=1')
        return
      }
      if (!res.ok || !data.order) {
        throw new Error(data.error ?? 'Could not place the order. Please try again.')
      }
      // The confirmation page clears the cart once it mounts.
      router.push(`/checkout/confirmation?free=1&order=${encodeURIComponent(String(data.order.display_id))}`)
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Could not place the order. Please try again.')
      setIsSubmitting(false)
    }
  }

  const slideProps = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 },
  }

  return (
    <div className="min-h-screen bg-brand-sand py-12 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to cart */}
        {step < 3 && (
          <div className="mb-6">
            <Link
              href="/cart"
              className="text-sm text-brand-muted hover:text-brand-ink transition-colors duration-200 inline-flex items-center gap-1"
            >
              ← Back to cart
            </Link>
          </div>
        )}

        <StepIndicator step={step} />

        <div className="lg:grid lg:grid-cols-5 lg:gap-10">
          {/* Main form area: 3 cols */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 lg:p-8">
              <AnimatePresence mode="wait">
                {/* Step 1: Contact Details */}
                {step === 1 && (
                  <motion.div key="step1" {...slideProps}>
                    <h2 className="text-xl font-medium text-brand-ink mb-6">
                      Contact Details
                    </h2>
                    <form onSubmit={handleContactSubmit} noValidate className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <InputField
                          label="First name"
                          id="firstName"
                          value={contact.firstName}
                          onChange={(v) => updateContact('firstName', v)}
                          error={errors.firstName}
                          required
                          autoComplete="given-name"
                        />
                        <InputField
                          label="Last name"
                          id="lastName"
                          value={contact.lastName}
                          onChange={(v) => updateContact('lastName', v)}
                          error={errors.lastName}
                          required
                          autoComplete="family-name"
                        />
                      </div>
                      <InputField
                        label="Email address"
                        id="email"
                        type="email"
                        value={contact.email}
                        onChange={(v) => updateContact('email', v)}
                        error={errors.email}
                        required
                        autoComplete="email"
                      />
                      <InputField
                        label="Phone number"
                        id="phone"
                        type="tel"
                        value={contact.phone}
                        onChange={(v) => updateContact('phone', v)}
                        autoComplete="tel"
                      />

                      {/* Country: determines payment provider */}
                      <div>
                        <label
                          htmlFor="country"
                          className="block text-sm font-medium text-brand-ink mb-1.5"
                        >
                          Billing country
                        </label>
                        <select
                          id="country"
                          value={contact.country}
                          onChange={(e) =>
                            updateContact('country', e.target.value as 'ZA' | 'INTL')
                          }
                          className="w-full px-4 py-3 rounded-xl border border-brand-primary-300 bg-white text-brand-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-colors duration-200"
                        >
                          <option value="ZA">South Africa</option>
                          <option value="INTL">Outside South Africa (International)</option>
                        </select>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-4 px-6 rounded-button text-base font-medium bg-brand-accent-600 hover:bg-brand-accent-700 disabled:opacity-60 disabled:cursor-wait text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? 'Saving...' : 'Continue to Payment'}
                          {!isSubmitting && <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Step 2: Payment */}
                {step === 2 && (
                  <motion.div key="step2" {...slideProps}>
                    <h2 className="text-xl font-medium text-brand-ink mb-2">
                      Payment
                    </h2>
                    <p className="text-sm text-brand-muted mb-6">
                      {isFreeOrder
                        ? 'Your voucher covers the full amount. There is nothing to pay.'
                        : contact.country === 'ZA'
                          ? 'You will be securely redirected to PayFast to complete your payment.'
                          : 'You will be securely redirected to PayPal to complete your payment.'}
                    </p>

                    {/* Billing summary */}
                    <div className="bg-brand-sand rounded-xl p-4 mb-6 space-y-1 text-sm">
                      <p className="text-brand-ink">
                        <span className="font-medium">Name:</span>{' '}
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-brand-ink">
                        <span className="font-medium">Email:</span> {contact.email}
                      </p>
                      <p className="text-brand-ink">
                        <span className="font-medium">Billing country:</span>{' '}
                        {contact.country === 'ZA' ? 'South Africa' : 'International'}
                      </p>
                      <button
                        onClick={() => setStep(1)}
                        className="text-brand-accent text-xs underline underline-offset-4 hover:text-brand-primary transition-colors duration-200 mt-1"
                      >
                        Edit
                      </button>
                    </div>

                    {/* Voucher code */}
                    <div className="mb-6">
                      {appliedVoucher ? (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-sand px-4 py-3 text-sm">
                          <span className="inline-flex items-center gap-2 text-brand-ink">
                            <Tag className="w-4 h-4" aria-hidden="true" />
                            Voucher <span className="font-mono font-medium">{appliedVoucher}</span> applied
                          </span>
                          <button
                            type="button"
                            onClick={handleRemoveVoucher}
                            disabled={voucherBusy || isSubmitting}
                            aria-label={`Remove voucher ${appliedVoucher}`}
                            className="inline-flex items-center gap-1 text-xs text-brand-muted hover:text-brand-ink underline underline-offset-4 disabled:opacity-60 transition-colors duration-200"
                          >
                            <X className="w-3 h-3" aria-hidden="true" />
                            Remove
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyVoucher} noValidate className="flex gap-2">
                          <div className="flex-1">
                            <label htmlFor="voucher" className="sr-only">
                              Voucher code
                            </label>
                            <input
                              id="voucher"
                              type="text"
                              value={voucherInput}
                              onChange={(e) => {
                                setVoucherInput(e.target.value)
                                if (voucherError) setVoucherError(null)
                              }}
                              placeholder="Voucher code"
                              autoComplete="off"
                              autoCapitalize="characters"
                              aria-invalid={!!voucherError}
                              aria-describedby={voucherError ? 'voucher-error' : undefined}
                              className={`w-full px-4 py-3 rounded-xl border text-brand-ink placeholder-brand-muted text-sm uppercase transition-colors duration-200 outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent ${
                                voucherError ? 'border-red-600 bg-red-50' : 'border-brand-primary-300 bg-white hover:border-brand-primary-400'
                              }`}
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={voucherBusy || isSubmitting || !voucherInput.trim()}
                            className="px-5 py-3 rounded-xl text-sm font-medium border border-brand-primary-300 text-brand-ink hover:bg-brand-sand disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
                          >
                            {voucherBusy ? 'Applying...' : 'Apply'}
                          </button>
                        </form>
                      )}
                      {voucherError && (
                        <p id="voucher-error" className="mt-1 text-xs text-red-600" role="alert">
                          {voucherError}
                        </p>
                      )}
                    </div>

                    {paymentError && (
                      <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
                        {paymentError}
                      </div>
                    )}

                    {isFreeOrder ? (
                      <>
                        <button
                          onClick={handlePlaceFreeOrder}
                          disabled={isSubmitting || voucherBusy}
                          className="w-full py-4 px-6 rounded-button text-base font-medium bg-brand-accent-600 hover:bg-brand-accent-700 disabled:opacity-60 disabled:cursor-wait text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <Lock className="w-4 h-4" />
                          {isSubmitting ? 'Placing your order...' : 'Place order'}
                        </button>
                        <p className="text-xs text-brand-muted text-center mt-4">
                          No payment needed · Your confirmation will arrive by email
                        </p>
                      </>
                    ) : contact.country === 'ZA' ? (
                      <>
                        <button
                          onClick={handlePayWithPayFast}
                          disabled={isSubmitting}
                          className="w-full py-4 px-6 rounded-button text-base font-medium bg-brand-accent-600 hover:bg-brand-accent-700 disabled:opacity-60 disabled:cursor-wait text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <Lock className="w-4 h-4" />
                          {isSubmitting ? 'Preparing payment...' : 'Pay with PayFast'}
                        </button>
                        <p className="text-xs text-brand-muted text-center mt-4">
                          Secured by PayFast · South Africa&apos;s leading payment gateway
                        </p>
                      </>
                    ) : (
                      <>
                        {/* PayPal's own blue was the last colour on the site;
                            Johan asked for it black on 16 Sep, so it now uses
                            the same accent fill as the PayFast button. */}
                        <button
                          onClick={handlePayWithPayPal}
                          disabled={isSubmitting}
                          className="w-full py-4 px-6 rounded-button text-base font-medium bg-brand-accent-600 hover:bg-brand-accent-700 disabled:opacity-60 disabled:cursor-wait text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <Lock className="w-4 h-4" />
                          {isSubmitting ? 'Preparing payment...' : 'Pay with PayPal'}
                        </button>
                        <p className="text-xs text-brand-muted text-center mt-4">
                          Secured by PayPal · Accepted worldwide
                        </p>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Redirecting */}
                {step === 3 && (
                  <motion.div key="step3" {...slideProps} className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-accent/10 mb-6">
                      <Lock className="w-6 h-6 text-brand-accent" />
                    </div>
                    <h2 className="text-xl font-medium text-brand-ink mb-2">
                      {payPalApprovalUrl ? 'Redirecting to PayPal' : 'Redirecting to PayFast'}
                    </h2>
                    <p className="text-sm text-brand-muted mb-6">
                      Please wait, you are being securely redirected to complete your payment.
                    </p>
                    <div className="flex justify-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-brand-accent"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.4 }}
                        />
                      ))}
                    </div>

                    {payFastData && (
                      <PayFastRedirectForm
                        params={payFastData.params}
                        endpoint={payFastData.endpoint}
                      />
                    )}

                    {payPalApprovalUrl && (
                      <PayPalRedirect approvalUrl={payPalApprovalUrl} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Order summary: 2 cols */}
          <div className="mt-8 lg:mt-0 lg:col-span-2">
            <OrderSideBar />
          </div>
        </div>
      </div>
    </div>
  )
}
