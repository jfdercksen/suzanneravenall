import type { Metadata } from 'next'
import BookContent from '@/components/book/BookContent'

export const metadata: Metadata = {
  title: 'The Breakthrough Trilogy',
  description:
    'Breakthrough Trilogy by Dr. Suzanne Ravenall: Overcoming the Impossible & Living Life Beyond Limitation. A quest to find an upgraded version of you. Available to pre-order.',
}

export default function BookPage() {
  return <BookContent />
}
