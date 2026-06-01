import type { Metadata } from 'next'
import BookContent from '@/components/book/BookContent'

export const metadata: Metadata = {
  title: 'The Breakthrough Trilogy | Dr. Suzanne Ravenall',
  description:
    'A Quest to Find an Upgraded Version of You. Three books. One journey. The complete roadmap to decoding the patterns that keep you stuck — and upgrading every area of your life.',
}

export default function BookPage() {
  return <BookContent />
}
