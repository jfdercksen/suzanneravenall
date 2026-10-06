import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { LeadWelcomeEmailProps } from '../types'
import { companyPhysicalAddress } from '../company'
import { siteUrl } from '../site-url'
import { LEAD_WELCOME_CONTENT } from '../lead-welcome-content'

const NAVY = '#012B43'
const BLUE = '#1719F4'
const LIGHT_GRAY = '#F5F7FA'
const MEDIUM_GRAY = '#64748B'

export default function LeadWelcome({ firstName, source, unsubscribeUrl }: LeadWelcomeEmailProps) {
  const content = LEAD_WELCOME_CONTENT[source]
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'

  return (
    <Html lang="en">
      <Head />
      <Preview>{content.next}</Preview>
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
              {content.heading}
            </Heading>
            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px' }}>
              {greeting}
            </Text>
            {content.intro.map((paragraph) => (
              <Text key={paragraph} style={{ color: '#334155', fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px' }}>
                {paragraph}
              </Text>
            ))}

            <Section style={{ borderLeft: `3px solid ${BLUE}`, padding: '4px 0 4px 16px', margin: '8px 0 32px' }}>
              <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 6px' }}>
                What happens next
              </Text>
              <Text style={{ color: NAVY, fontSize: '16px', lineHeight: '1.6', margin: 0 }}>
                {content.next}
              </Text>
            </Section>

            <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Button
                href={`${siteUrl()}${content.link.path}`}
                style={{
                  backgroundColor: BLUE,
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '700',
                  padding: '16px 48px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                {content.link.label}
              </Button>
            </Section>

            <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

            <Text style={{ color: '#334155', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
              With warmth,<br />
              <strong>Dr Suzanne Ravenall</strong>
            </Text>
          </Section>

          <Section style={{ backgroundColor: LIGHT_GRAY, padding: '24px 40px', borderTop: '1px solid #e2e8f0' }}>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: '0 0 4px' }}>
              You are receiving this because {content.reason}.
            </Text>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: '0 0 4px' }}>
              Ravenall Institute · {companyPhysicalAddress()}
            </Text>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: 0 }}>
              <a href={unsubscribeUrl} style={{ color: MEDIUM_GRAY }}>Unsubscribe</a> from these emails
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
