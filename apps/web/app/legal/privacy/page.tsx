import type { Metadata } from 'next'
import LegalPrivacyContent from './LegalPrivacyContent'

export const metadata: Metadata = {
  title: 'Privacy Notice',
  description:
    'Privacy Notice for suzanneravenall.com: how we collect, process, and protect your personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA).',
}

export default function PrivacyPolicyPage() {
  return <LegalPrivacyContent />
}
