import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { MembershipWelcomeProps } from '../types'
import { companyPhysicalAddress } from '../company'

/**
 * Sent when a member's access starts (KI128): after a paid order, or for a
 * Novice when the team approves their documents. Names the level and, where
 * there is one, the programme (Suzanne, 19 Nov: levels and programmes are not
 * mixed up), and says when the year ends. One payment a year: nothing renews
 * by itself.
 */

const INK = '#0A0A0A'
const MUTED = '#696969'
const SAND = '#F6F6F7'
const BORDER = '#E5E5E5'

export default function MembershipWelcome({
  firstName,
  levelTitle,
  programmeName,
  renewalDate,
  siteUrl,
  unsubscribeUrl,
}: MembershipWelcomeProps) {
  const greeting = firstName ? `Welcome, ${firstName}` : 'Welcome'

  return (
    <Html lang="en">
      <Head />
      <Preview>{`Your ${levelTitle} is active`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Section style={{ backgroundColor: '#000000', padding: '28px 40px' }}>
            <Text style={{ color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: '0 0 4px' }}>Dr Suzanne Ravenall</Text>
            <Text style={{ color: '#DADBDF', fontSize: '13px', margin: 0 }}>Ravenall Institute</Text>
          </Section>

          <Section style={{ padding: '40px' }}>
            <Heading as="h1" style={{ color: INK, fontSize: '26px', fontWeight: '400', margin: '0 0 20px', lineHeight: '1.3' }}>
              {greeting}
            </Heading>
            <Text style={{ color: INK, fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px' }}>
              Your membership is active and your member portal is ready.
            </Text>

            <Section style={{ backgroundColor: SAND, borderRadius: '4px', padding: '20px 24px', marginBottom: '28px' }}>
              <Text style={{ color: INK, fontSize: '15px', margin: '0 0 6px' }}>
                <strong>Level:</strong> {levelTitle}
              </Text>
              {programmeName && (
                <Text style={{ color: INK, fontSize: '15px', margin: '0 0 6px' }}>
                  <strong>Programme:</strong> {programmeName}
                </Text>
              )}
              <Text style={{ color: INK, fontSize: '15px', margin: 0 }}>
                <strong>Active until:</strong> {renewalDate}
              </Text>
            </Section>

            <Text style={{ color: INK, fontSize: '15px', lineHeight: '1.7', margin: '0 0 28px' }}>
              Your membership is paid once a year and does not renew by itself. We will remind you before it ends.
            </Text>

            <Section style={{ textAlign: 'center', marginBottom: '28px' }}>
              <Button
                href={`${siteUrl}/portal/dashboard`}
                style={{
                  backgroundColor: '#171717',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '700',
                  padding: '14px 40px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Go to your member portal
              </Button>
            </Section>

            <Hr style={{ borderColor: BORDER, margin: '24px 0' }} />
            <Text style={{ color: INK, fontSize: '15px', lineHeight: '1.7', margin: '0 0 8px' }}>
              If you have a question, reply to this email and your team will help.
            </Text>
            <Text style={{ color: INK, fontSize: '15px', margin: '16px 0 0' }}>
              With warmth,
              <br />
              <strong>Dr Suzanne Ravenall</strong>
            </Text>
          </Section>

          <Section style={{ backgroundColor: SAND, padding: '24px 40px', borderTop: `1px solid ${BORDER}` }}>
            <Text style={{ color: MUTED, fontSize: '12px', margin: '0 0 4px' }}>Ravenall Institute · {companyPhysicalAddress()}</Text>
            <Text style={{ color: MUTED, fontSize: '12px', margin: 0 }}>
              <a href={`${siteUrl}/portal/account`} style={{ color: MUTED }}>
                Your membership
              </a>
              {' · '}
              <a href={unsubscribeUrl} style={{ color: MUTED }}>
                Unsubscribe
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
