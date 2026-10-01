import type { Metadata } from 'next'
import CheckoutContent from '@/components/checkout/CheckoutContent'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your purchase securely.',
}

export default function CheckoutPage() {
  return <CheckoutContent />
}
