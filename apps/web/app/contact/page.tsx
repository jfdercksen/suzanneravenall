import type { Metadata } from 'next'
import ContactHero from './ContactHero'
import ContactOptions from './ContactOptions'
import ContactFAQ from './ContactFAQ'
import ContactFinalCTA from './ContactFinalCTA'

export const metadata: Metadata = {
  title: 'Contact | Dr. Suzanne Ravenall',
  description:
    'Book a discovery call, send a message, or find out which coaching path is right for you.',
}

export default function ContactPage() {
  return (
    <main>
      <ContactHero />
      <ContactOptions />
      <ContactFAQ />
      <ContactFinalCTA />
    </main>
  )
}
