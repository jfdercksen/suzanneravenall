import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { ContactAcknowledgementEmailData } from '../types'
import { COMPANY_CONTACT_EMAIL, COMPANY_PHONE, companyPhysicalAddress } from '../company'
import { siteUrl } from '../site-url'

const NAVY = '#012B43'
const BLUE = '#1719F4'
const LIGHT_GRAY = '#F5F7FA'
const MEDIUM_GRAY = '#64748B'

/**
 * The reply promise the contact form already shows on success
 * (app/contact/ContactForm.tsx), word for word, so the email and the page
 * never disagree. The plain-text part uses it too.
 */
export const CONTACT_REPLY_PROMISE = "Suzanne's team will be in touch within 2 business days."

export default function ContactAcknowledgement({ firstName, enquiry, message }: ContactAcknowledgementEmailData) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`Thank you, ${firstName}. We received your message.`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>

          <Section style={{ backgroundColor: NAVY, padding: '32px 40px' }}>
            <Text style={{ color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: '0 0 4px' }}>
              Dr Suzanne Ravenall
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
              Ravenall Institute
            </Text>
          </Section>

          <Section style={{ padding: '40px' }}>
            <Heading
              as="h1"
              style={{ color: NAVY, fontSize: '28px', fontWeight: '300', margin: '0 0 20px', lineHeight: '1.3' }}
            >
              Thank you, {firstName}
            </Heading>
            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.7', margin: '0 0 8px' }}>
              {enquiry ? `We received your message about ${enquiry}.` : 'We received your message.'}
            </Text>
            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.7', margin: '0 0 24px' }}>
              {CONTACT_REPLY_PROMISE}
            </Text>

            <Section style={{ borderLeft: `3px solid ${BLUE}`, padding: '4px 0 4px 16px', margin: '0 0 24px' }}>
              <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 6px' }}>
                Your message
              </Text>
              <Text style={{ color: NAVY, fontSize: '15px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                {message}
              </Text>
            </Section>

            <Text style={{ color: MEDIUM_GRAY, fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
              If you want to add anything, simply reply to this email.
            </Text>

            <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

            <Text style={{ color: NAVY, fontSize: '16px', fontWeight: '600', margin: '0 0 12px' }}>
              Contact us
            </Text>
            <Text style={{ color: '#334155', fontSize: '14px', lineHeight: '1.6', margin: '0 0 4px' }}>
              Email:{' '}
              <Link href={`mailto:${COMPANY_CONTACT_EMAIL}`} style={{ color: BLUE, textDecoration: 'none' }}>
                {COMPANY_CONTACT_EMAIL}
              </Link>
            </Text>
            <Text style={{ color: '#334155', fontSize: '14px', lineHeight: '1.6', margin: '0 0 4px' }}>
              Phone:{' '}
              <Link href={`tel:${COMPANY_PHONE.replace(/\s+/g, '')}`} style={{ color: BLUE, textDecoration: 'none' }}>
                {COMPANY_PHONE}
              </Link>
            </Text>
            <Text style={{ color: '#334155', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
              <Link href={`${siteUrl()}/contact`} style={{ color: BLUE, textDecoration: 'none' }}>
                Contact us online
              </Link>
            </Text>

            <Text style={{ color: '#334155', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
              With warmth,<br />
              <strong>Dr Suzanne Ravenall</strong>
            </Text>
          </Section>

          <Section style={{ backgroundColor: LIGHT_GRAY, padding: '24px 40px', borderTop: '1px solid #e2e8f0' }}>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: 0 }}>
              Ravenall Institute · {companyPhysicalAddress()}
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
