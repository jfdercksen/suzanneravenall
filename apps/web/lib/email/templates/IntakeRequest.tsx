import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import { companyPhysicalAddress } from '../company'

/**
 * "Please complete your intake form": sent once after a private-session
 * purchase (reminder 0) and as reminders 1 to 6 until the form is in (H-12).
 * Monochrome, per the site's design standard (black, white, one grey).
 */

const BLACK = '#000000'
const ACCENT = '#171717'
const INK = '#0A0A0A'
const MUTED = '#696969'
const SAND = '#F6F6F7'
const BORDER = '#E5E5E5'

export interface IntakeRequestProps {
  firstName: string | null
  serviceName: string
  formUrl: string
  /** 0 for the first mail, 1 to 6 for the reminders. */
  reminder: number
  supportEmail: string
}

export default function IntakeRequest({ firstName, serviceName, formUrl, reminder, supportEmail }: IntakeRequestProps) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'
  const isReminder = reminder > 0
  return (
    <Html lang="en">
      <Head />
      <Preview>
        {isReminder
          ? `A reminder: your intake form for ${serviceName} is still open`
          : `Please complete your intake form for ${serviceName}`}
      </Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Section style={{ backgroundColor: BLACK, padding: '32px 40px 24px' }}>
            <Text style={{ color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: '0 0 4px' }}>
              Dr Suzanne Ravenall
            </Text>
            <Text style={{ color: '#DADBDF', fontSize: '13px', margin: 0 }}>Ravenall Institute</Text>
          </Section>

          <Section style={{ padding: '40px' }}>
            <Heading as="h1" style={{ color: INK, fontSize: '26px', fontWeight: '400', margin: '0 0 20px', lineHeight: '1.3' }}>
              {isReminder ? 'Your intake form is still open' : 'Before your session: your intake form'}
            </Heading>
            <Text style={{ color: INK, fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px' }}>{greeting}</Text>
            {isReminder ? (
              <Text style={{ color: INK, fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px' }}>
                We have not received your intake form for <strong>{serviceName}</strong> yet. It helps us prepare for
                your session, so please take a few minutes to complete it.
              </Text>
            ) : (
              <Text style={{ color: INK, fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px' }}>
                Thank you for booking <strong>{serviceName}</strong>. Before your session, please complete your intake
                form. It helps us understand you and prepare, so you have a great and comfortable experience.
              </Text>
            )}
            <Text style={{ color: INK, fontSize: '16px', lineHeight: '1.7', margin: '0 0 24px' }}>
              It takes about 10 to 15 minutes. Leave out anything you would prefer not to answer.
            </Text>

            <Section style={{ textAlign: 'center', marginBottom: '28px' }}>
              <Button
                href={formUrl}
                style={{
                  backgroundColor: ACCENT,
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '700',
                  padding: '16px 40px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Complete your intake form
              </Button>
            </Section>

            <Section style={{ backgroundColor: SAND, borderRadius: '4px', padding: '16px 24px', marginBottom: '24px' }}>
              <Text style={{ color: MUTED, fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
                This link is personal to you; please do not forward it. If the button does not work, copy this address
                into your browser: {formUrl}
              </Text>
            </Section>

            <Text style={{ color: INK, fontSize: '15px', lineHeight: '1.7', margin: '0 0 16px' }}>
              Questions about your form or your session? Contact us at {supportEmail} or simply reply to this email.
            </Text>

            <Hr style={{ borderColor: BORDER, margin: '24px 0' }} />

            <Text style={{ color: INK, fontSize: '15px', margin: 0 }}>
              Warm regards,
              <br />
              <strong>The Ravenall Institute team</strong>
            </Text>
          </Section>

          <Section style={{ backgroundColor: SAND, padding: '24px 40px', borderTop: `1px solid ${BORDER}` }}>
            <Text style={{ color: MUTED, fontSize: '12px', margin: 0 }}>Ravenall Institute · {companyPhysicalAddress()}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
