import type { Metadata } from 'next'
import ShopContent from './ShopContent'

export const metadata: Metadata = {
  title: 'Shop | Dr. Suzanne Ravenall',
  description: 'Programs and resources coming soon.',
}

export default function ShopPage() {
  return <ShopContent />
}
