import type { Metadata } from 'next'
import LegalCookiesContent from './LegalCookiesContent'

export const metadata: Metadata = {
  title: 'Cookie Policy | Dr. Suzanne Ravenall',
  description:
    'Cookie Policy for suzanneravenall.com: what cookies we use, why, and how you can control them.',
}

export default function CookiePolicyPage() {
  return <LegalCookiesContent />
}
