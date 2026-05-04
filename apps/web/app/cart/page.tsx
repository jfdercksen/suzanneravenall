import type { Metadata } from 'next'
import CartPageContent from '@/components/cart/CartPageContent'

export const metadata: Metadata = {
  title: 'Your Cart | Dr. Suzanne Ravenall',
  description: 'Review your selected programmes and proceed to checkout.',
}

export default function CartPage() {
  return <CartPageContent />
}
