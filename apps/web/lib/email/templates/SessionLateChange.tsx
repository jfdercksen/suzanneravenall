import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { SessionLateChangeEmailData } from '../types'
import { COMPANY_CONTACT_EMAIL, companyPhysicalAddress } from '../company'

const NAVY = '#012B43'
const BLUE = '#1719F4'
const LIGHT_GRAY = '#F5F7FA'
const MEDIUM_GRAY = '#64748B'

/** Shared with the plain-text part so the two never disagree. */
export function lateChangeIntro(kind: SessionLateChangeEmailData['kind']): string {
  return kind === 'rescheduled'
    ? 'You moved this session less than 48 working hours before it was due to start, so this session counts as used.'
    : 'You cancelled this session less than 48 working hours before it was due to start, so this session counts as used.'
}

export const NOTICE_RULE_LINE =
  'Sessions need at least 48 working hours notice to cancel or move them. Working hours are Monday to Friday, 08:00 to 17:00 South African time, public holidays excluded.'

export const LATE_CHANGE_EXCEPTION_LINE =
  'If something exceptional happened, reply to this email and our team will look at it with you.'

export function newTimeLine(data: Pick<SessionLateChangeEmailData, 'kind' | 'newDateLabel' | 'newTimeLabel'>): string | null {
  if (data.kind !== 'rescheduled' || !data.newDateLabel) return null
  const when = data.newTimeLabel ? `${data.newDateLabel}, ${data.newTimeLabel}` : data.newDateLabel
  return `Your new booking on ${when} uses another session from your package.`
}

export default function SessionLateChange(data: SessionLateChangeEmailData) {
  const { firstName, dateLabel, timeLabel, kind, appointmentsUrl } = data
  const moved = newTimeLine(data)
  return (
    <Html lang="en">
      <Head />
      <Preview>{`Your session on ${dateLabel}`}</Preview>
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
              About your session, {firstName ?? 'there'}
            </Heading>

            <Section style={{ borderLeft: `3px solid ${BLUE}`, padding: '4px 0 4px 16px', margin: '0 0 24px' }}>
              <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 6px' }}>
                The session
              </Text>
              <Text style={{ color: NAVY, fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                {dateLabel}, {timeLabel}
              </Text>
            </Section>

            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.7', margin: '0 0 12px' }}>
              {lateChangeIntro(kind)}
            </Text>
            <Text style={{ color: '#334155', fontSize: '15px', lineHeight: '1.7', margin: '0 0 12px' }}>
              {NOTICE_RULE_LINE}
            </Text>
            {moved && (
              <Text style={{ color: '#334155', fontSize: '15px', lineHeight: '1.7', margin: '0 0 12px' }}>
                {moved}
              </Text>
            )}
            <Text style={{ color: '#334155', fontSize: '15px', lineHeight: '1.7', margin: '0 0 24px' }}>
              {LATE_CHANGE_EXCEPTION_LINE}
            </Text>

            <Text style={{ color: '#334155', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
              Your sessions are listed in{' '}
              <Link href={appointmentsUrl} style={{ color: BLUE, textDecoration: 'none' }}>
                your portal
              </Link>
              . Questions? Reply to this email or write to{' '}
              <Link href={`mailto:${COMPANY_CONTACT_EMAIL}`} style={{ color: BLUE, textDecoration: 'none' }}>
                {COMPANY_CONTACT_EMAIL}
              </Link>
              .
            </Text>

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
