import type { Metadata } from 'next'
import ContactHero from './ContactHero'
import ContactOptions from './ContactOptions'
import ContactFAQ from './ContactFAQ'
import ContactFinalCTA from './ContactFinalCTA'
import { resolveEnquiry, resolveTopic } from './enquiry'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Book a discovery call, send a message, or find out which coaching path is right for you.',
}

interface ContactPageProps {
  // Next 15: searchParams is a Promise. ?enquiry= preselects the enquiry type,
  // ?topic= prefills the message (see ./enquiry.ts and contactHref()).
  searchParams: Promise<{ enquiry?: string | string[]; topic?: string | string[] }>
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { enquiry, topic } = await searchParams

  return (
    <>
      <ContactHero />
      <ContactOptions enquiry={resolveEnquiry(enquiry)} topic={resolveTopic(topic)} />
      <ContactFAQ />
      <ContactFinalCTA />
    </>
  )
}
