import type { Metadata } from 'next'
import ConfirmationContent from '@/components/checkout/ConfirmationContent'

export const metadata: Metadata = {
  title: 'Your Order',
  description: 'The status of your order with Dr Suzanne Ravenall.',
}

export default function ConfirmationPage() {
  return <ConfirmationContent />
}
