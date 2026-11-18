import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from '@react-email/components'
import type { QuizCompletionEmailData } from '../types'

/**
 * Staff notice that someone completed a diagnostic: who, which quiz and the
 * result title. The answers are NOT in this mail: they can hold health and
 * wellbeing information, which is never sent by plain email (POPIA,
 * Suzanne's rules of 8 Nov 2026). They stay in quiz_subscribers; the mail
 * links to the staff page that shows them behind the CMS login (KI125).
 */

export type QuizCompletionNotificationProps = QuizCompletionEmailData & {
  /** /staff/submissions/quiz/<id> on the site. */
  answersUrl: string
}

const INK = '#0A0A0A'
const MUTED = '#696969'
const SAND = '#F6F6F7'
const BORDER = '#E5E5E5'

export default function QuizCompletionNotification({
  firstName,
  lastName,
  email,
  quizTitle,
  resultTitle,
  resultSubtitle,
  answersUrl,
}: QuizCompletionNotificationProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`${firstName} ${lastName} completed the ${quizTitle} diagnostic. Result: ${resultTitle}`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <Heading as="h1" style={{ color: INK, fontSize: '22px', fontWeight: '400', margin: '0 0 16px' }}>
            Diagnostic completed
          </Heading>
          <Section style={{ backgroundColor: SAND, borderRadius: '4px', padding: '16px 20px', marginBottom: '24px' }}>
            {[
              ['Name', `${firstName} ${lastName}`],
              ['Email', email],
              ['Diagnostic', quizTitle],
              ['Result', `${resultTitle}: ${resultSubtitle}`],
            ].map(([k, v]) => (
              <Text key={k} style={{ color: INK, fontSize: '14px', lineHeight: '1.5', margin: '0 0 4px' }}>
                <strong>{k}:</strong> {v}
              </Text>
            ))}
          </Section>
          <Text style={{ color: INK, fontSize: '14px', lineHeight: '1.6', margin: '0 0 16px' }}>
            The answers are not in this email. They can include health and wellbeing information, so they stay in the
            website database and are never sent by email.
          </Text>
          <Text style={{ color: INK, fontSize: '14px', lineHeight: '1.6', margin: '0 0 16px' }}>
            <Link href={answersUrl} style={{ color: INK, textDecoration: 'underline' }}>
              Read the answers on the staff page
            </Link>{' '}
            (log in with your staff CMS account).
          </Text>
          <Hr style={{ borderColor: BORDER, margin: '24px 0 12px' }} />
          <Text style={{ color: MUTED, fontSize: '12px', lineHeight: '1.5', margin: 0 }}>
            Reply to this email to respond to {firstName}.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
