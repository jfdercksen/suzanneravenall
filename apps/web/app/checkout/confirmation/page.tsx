import type { Metadata } from 'next'
import ConfirmationContent from '@/components/checkout/ConfirmationContent'

export const metadata: Metadata = {
  title: 'Order Confirmed',
  description: 'Thank you for your purchase. Your order has been received.',
}

export default function ConfirmationPage() {
  return <ConfirmationContent />
}
