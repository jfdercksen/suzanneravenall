import type { Metadata } from 'next'
import LegalTermsContent from './LegalTermsContent'

export const metadata: Metadata = {
  title: 'Terms of Service | Dr. Suzanne Ravenall',
  description:
    'Terms of Service for suzanneravenall.com: the legal agreement governing your use of our website, programmes, and membership services.',
}

export default function TermsOfServicePage() {
  return <LegalTermsContent />
}
