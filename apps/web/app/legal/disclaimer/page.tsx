import type { Metadata } from 'next'
import LegalDisclaimerContent from './LegalDisclaimerContent'

export const metadata: Metadata = {
  title: 'Disclaimer | Dr. Suzanne Ravenall',
  description:
    'Disclaimer for sessions, practices and online programmes by Dr. Suzanne Ravenall / Ravenall Institute: educational purposes, no substitute for medical advice, personal responsibility, and limitation of liability.',
}

export default function DisclaimerPage() {
  return <LegalDisclaimerContent />
}
