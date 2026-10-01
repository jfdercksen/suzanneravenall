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
import type { QuizReportEmailData } from '../types'
import { companyPhysicalAddress } from '../company'

const NAVY = '#012B43'
const BLUE = '#1719F4'
const LIGHT_GRAY = '#F5F7FA'
const MEDIUM_GRAY = '#64748B'

const label = {
  color: BLUE,
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}
const body = { color: '#334155', fontSize: '16px', lineHeight: '1.7', margin: '0 0 28px' }
const item = { color: '#334155', fontSize: '16px', lineHeight: '1.6', margin: '0 0 8px' }

export default function QuizReport({
  firstName,
  quizTitle,
  resultTitle,
  resultSubtitle,
  mirror,
  mechanism,
  impact,
  shift,
  ctaLabel,
  ctaLink,
}: QuizReportEmailData) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`${firstName}, your result: ${resultTitle}`}</Preview>
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
            <Text style={{ color: MEDIUM_GRAY, fontSize: '14px', margin: '0 0 12px' }}>
              {firstName}, here is your full report for: {quizTitle}
            </Text>
            <Heading
              as="h1"
              style={{ color: NAVY, fontSize: '28px', fontWeight: '300', margin: '0 0 8px', lineHeight: '1.3' }}
            >
              {resultTitle}
            </Heading>
            <Text style={{ color: BLUE, fontSize: '16px', margin: '0 0 32px' }}>{resultSubtitle}</Text>

            <Text style={label}>Mirror</Text>
            <Text style={body}>{mirror}</Text>

            <Text style={label}>What&apos;s Really Happening</Text>
            <Text style={body}>{mechanism}</Text>

            <Text style={label}>If This Continues</Text>
            {impact.map((line) => (
              <Text key={line} style={item}>• {line}</Text>
            ))}

            <Text style={{ ...label, marginTop: '28px' }}>The Shift</Text>
            {shift.map((line) => (
              <Text key={line} style={item}>• {line}</Text>
            ))}

            <Section style={{ textAlign: 'center', margin: '36px 0 8px' }}>
              <Button
                href={ctaLink}
                style={{
                  backgroundColor: BLUE,
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '700',
                  padding: '16px 40px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                {ctaLabel}
              </Button>
            </Section>

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
