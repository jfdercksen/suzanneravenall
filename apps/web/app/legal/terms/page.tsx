import type { Metadata } from 'next'
import { sessionTermsMode } from '@/lib/legal/session-terms'
import LegalTermsContent from './LegalTermsContent'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service for suzanneravenall.com: the legal agreement governing your use of our website, programmes, and membership services.',
}

interface PageProps {
  searchParams: Promise<{ draft?: string | string[] }>
}

// Read per request: the session rules section goes live with an env switch,
// not a rebuild (D024).
export const dynamic = 'force-dynamic'

export default async function TermsOfServicePage({ searchParams }: PageProps) {
  const { draft } = await searchParams
  return <LegalTermsContent sessionTerms={sessionTermsMode(draft)} />
}
