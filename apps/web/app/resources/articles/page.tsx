import type { Metadata } from 'next'
import ArticlesContent from '@/components/resources/ArticlesContent'

export function generateMetadata(): Metadata {
  return {
    title: 'Articles & Publications',
    description:
      'Thought leadership from Dr. Suzanne Ravenall, published in CEO Magazine, Leadership Magazine and other business publications.',
  }
}

// Public since 10 Nov 2026 (Johan: "Move to Public"): press, articles and awards
// are marketing content. The portal pages keep their access check.
export default function ArticlesPage() {
  return <ArticlesContent />
}
