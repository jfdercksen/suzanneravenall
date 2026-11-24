import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from '@react-email/components'
import type { AnswerGroup } from '../../staff/present'
import { AnswerList } from './AnswerList'

/**
 * A completed intake form, for the team (H-12): who, which order, service and
 * form, when, then every question with its answer under the form's headings.
 * The answers are in the mail by Suzanne's decision of 20 Nov 2026 ("we do
 * allow email", DECISIONS.md D025). The website keeps its copy in
 * intake_submissions, readable on the staff page behind the CMS login
 * (KI125); the mail links to it as the backup.
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
  /** Every question with its answer, grouped as the staff page shows them. */
  answers: AnswerGroup[]
  /** /staff/submissions/intake/<id> on the site. */
  answersUrl: string
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
  answers,
  answersUrl,
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
          <AnswerList groups={answers} />
          <Text style={{ color: INK, fontSize: '14px', lineHeight: '1.6', margin: '16px 0 0' }}>
            The website keeps a copy:{' '}
            <Link href={answersUrl} style={{ color: INK, textDecoration: 'underline' }}>
              open it on the staff page
            </Link>{' '}
            (log in with your staff CMS account).
          </Text>
          <Hr style={{ borderColor: BORDER, margin: '24px 0 12px' }} />
          <Text style={{ color: MUTED, fontSize: '12px', lineHeight: '1.5', margin: 0 }}>
            Personal and health information: keep this mail within the team. Reply to this mail to write to the client.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
