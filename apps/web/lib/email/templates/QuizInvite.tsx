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
import type { QuizInviteEmailData } from '../types'
import { companyPhysicalAddress } from '../company'

const NAVY = '#012B43'
const BLUE = '#1719F4'
const LIGHT_GRAY = '#F5F7FA'
const MEDIUM_GRAY = '#64748B'

export default function QuizInvite({ firstName, quizTitle, link, requestedAt }: QuizInviteEmailData) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`${firstName}, your diagnostic is ready: ${quizTitle}`}</Preview>
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
              {firstName}, your diagnostic is ready
            </Heading>
            {/* The quiz title is a question, so it stands on its own line rather
                than inside a sentence (client QA 5 Oct). */}
            <Section style={{ borderLeft: `3px solid ${BLUE}`, padding: '4px 0 4px 16px', margin: '0 0 24px' }}>
              <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 6px' }}>
                Your diagnostic
              </Text>
              <Text style={{ color: NAVY, fontSize: '20px', fontWeight: '700', lineHeight: '1.4', margin: 0 }}>
                {quizTitle}
              </Text>
            </Section>
            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.7', margin: '0 0 24px' }}>
              This short, focused assessment reveals the pattern quietly shaping this
              part of your life, and what to do about it.
            </Text>

            <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Button
                href={link}
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
                Start the Diagnostic
              </Button>
            </Section>

            <Text style={{ color: MEDIUM_GRAY, fontSize: '13px', lineHeight: '1.6', margin: '0 0 24px' }}>
              Takes about 2 minutes. Your result, and what it means, is shown to you
              immediately after your last answer.
            </Text>

            {requestedAt && (
              <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', lineHeight: '1.6', margin: '0 0 24px' }}>
                Requested {requestedAt}. If you asked more than once, every copy of this link works.
              </Text>
            )}

            <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

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
