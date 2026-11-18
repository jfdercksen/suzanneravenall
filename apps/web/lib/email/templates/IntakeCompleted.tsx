import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'

/**
 * A completed intake form, for the team (H-12): who, which order, service and
 * form, and when. The answers are NOT in this mail: they hold personal and
 * health information, which is never sent by plain email (POPIA, Suzanne's
 * rules of 8 Nov 2026). They stay in intake_submissions.
 */

const INK = '#0A0A0A'
const MUTED = '#696969'
const SAND = '#F6F6F7'
const BORDER = '#E5E5E5'

export interface IntakeCompletedProps {
  clientName: string
  clientEmail: string
  orderNumber: string
  serviceName: string
  formTitle: string
  completedAt: string
  acknowledged: boolean
  /** "Opted in: Email, SMS" or "Not opted in". */
  marketing: string
}

export default function IntakeCompleted({
  clientName,
  clientEmail,
  orderNumber,
  serviceName,
  formTitle,
  completedAt,
  acknowledged,
  marketing,
}: IntakeCompletedProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`Intake form from ${clientName}, order ${orderNumber}, ${serviceName}`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '680px', margin: '0 auto', padding: '24px' }}>
          <Heading as="h1" style={{ color: INK, fontSize: '22px', fontWeight: '400', margin: '0 0 16px' }}>
            Intake form completed
          </Heading>
          <Section style={{ backgroundColor: SAND, borderRadius: '4px', padding: '16px 20px', marginBottom: '24px' }}>
            {[
              ['Client', clientName],
              ['Email', clientEmail],
              ['Order', orderNumber],
              ['Service', serviceName],
              ['Form', formTitle],
              ['Completed', completedAt],
              ['Acknowledgement', acknowledged ? 'Ticked' : 'Not on this form'],
              ['Marketing', marketing],
            ].map(([k, v]) => (
              <Text key={k} style={{ color: INK, fontSize: '14px', lineHeight: '1.5', margin: '0 0 4px' }}>
                <strong>{k}:</strong> {v}
              </Text>
            ))}
          </Section>
          <Text style={{ color: INK, fontSize: '14px', lineHeight: '1.6', margin: '0 0 16px' }}>
            The answers are not in this email. They hold personal and health information, so they stay in the website
            database and are never sent by email.
          </Text>
          <Hr style={{ borderColor: BORDER, margin: '24px 0 12px' }} />
          <Text style={{ color: MUTED, fontSize: '12px', lineHeight: '1.5', margin: 0 }}>
            Reply to this mail to write to the client.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
