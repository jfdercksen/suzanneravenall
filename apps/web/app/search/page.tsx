import type { Metadata } from 'next'
import { SearchResultsContent } from './SearchResultsContent'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export function generateMetadata(): Metadata {
  return {
    title: 'Search | Dr. Suzanne Ravenall',
    description: 'Search programmes, transformation topics, and resources.',
    robots: { index: false },
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '' } = await searchParams
  return <SearchResultsContent initialQuery={q} />
}
