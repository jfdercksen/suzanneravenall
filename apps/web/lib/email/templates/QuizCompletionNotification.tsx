import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import type { QuizCompletionEmailData } from '../types'

const NAVY = '#012B43'
const BLUE = '#1719F4'
const LIGHT_GRAY = '#F5F7FA'
const MEDIUM_GRAY = '#64748B'

export default function QuizCompletionNotification({
  firstName,
  lastName,
  email,
  quizTitle,
  resultTitle,
  resultSubtitle,
  questions,
}: QuizCompletionEmailData) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`${firstName} ${lastName} completed the ${quizTitle} diagnostic — result: ${resultTitle}`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>

          <Section style={{ backgroundColor: NAVY, padding: '32px 40px' }}>
            <Text style={{ color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: '0 0 4px' }}>
              New Diagnostic Completed
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
              {quizTitle}
            </Text>
          </Section>

          <Section style={{ padding: '40px 40px 24px' }}>
            <Heading
              as="h1"
              style={{ color: NAVY, fontSize: '24px', fontWeight: '300', margin: '0 0 20px', lineHeight: '1.3' }}
            >
              {firstName} {lastName}
            </Heading>
            <Text style={{ color: '#334155', fontSize: '15px', lineHeight: '1.7', margin: '0 0 4px' }}>
              <a href={`mailto:${email}`} style={{ color: BLUE, textDecoration: 'none' }}>{email}</a>
            </Text>

            <Section style={{ backgroundColor: LIGHT_GRAY, borderRadius: '4px', padding: '20px 24px', margin: '24px 0' }}>
              <Text style={{ color: MEDIUM_GRAY, fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                Result
              </Text>
              <Text style={{ color: NAVY, fontSize: '20px', fontWeight: '700', margin: '0 0 4px' }}>
                {resultTitle}
              </Text>
              <Text style={{ color: '#334155', fontSize: '14px', margin: 0 }}>
                {resultSubtitle}
              </Text>
            </Section>
          </Section>

          <Section style={{ padding: '0 40px 40px' }}>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>
              Full Answers
            </Text>
            {questions.map((question, index) => (
              <Row key={question.text} style={{ marginBottom: '12px' }}>
                <Column>
                  <Text style={{ color: '#334155', fontSize: '14px', lineHeight: '1.6', margin: '0 0 2px' }}>
                    {index + 1}. {question.text}
                  </Text>
                  <Text style={{ color: BLUE, fontSize: '14px', fontWeight: '700', margin: 0 }}>
                    {question.answerLabel}
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

            <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: 0 }}>
              Reply directly to this email to respond to {firstName}.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
