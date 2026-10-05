import type { Metadata } from 'next'
import CheckoutContent from '@/components/checkout/CheckoutContent'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your purchase securely.',
}

export default function CheckoutPage() {
  return (
    <>
      {/* The design has no visible page heading; screen readers and crawlers
          still get one (site check M12). */}
      <h1 className="sr-only">Checkout</h1>
      <CheckoutContent />
    </>
  )
}
