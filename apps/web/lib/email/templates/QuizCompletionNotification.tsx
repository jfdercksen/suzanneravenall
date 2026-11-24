import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from '@react-email/components'
import type { QuizCompletionEmailData } from '../types'
import { AnswerList } from './AnswerList'

/**
 * Staff notice that someone completed a diagnostic: who, which quiz, the
 * result and every answer. The answers are in the mail by Suzanne's decision
 * of 20 Nov 2026 ("we do allow email", DECISIONS.md D025). The
 * website keeps its copy in quiz_subscribers, readable on the staff page
 * behind the CMS login (KI125); the mail links to it as the backup.
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
  answers,
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
          <Text style={{ color: MUTED, fontSize: '12px', lineHeight: '1.5', margin: '0 0 12px' }}>
            Answers. Scale: Never (0) to Almost Always (4).
          </Text>
          <AnswerList groups={[{ section: null, items: answers }]} />
          <Text style={{ color: INK, fontSize: '14px', lineHeight: '1.6', margin: '16px 0 0' }}>
            The website keeps a copy:{' '}
            <Link href={answersUrl} style={{ color: INK, textDecoration: 'underline' }}>
              open it on the staff page
            </Link>{' '}
            (log in with your staff CMS account).
          </Text>
          <Hr style={{ borderColor: BORDER, margin: '24px 0 12px' }} />
          <Text style={{ color: MUTED, fontSize: '12px', lineHeight: '1.5', margin: 0 }}>
            These answers can include health and wellbeing information: keep this mail within the team. Reply to this
            email to respond to {firstName}.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
