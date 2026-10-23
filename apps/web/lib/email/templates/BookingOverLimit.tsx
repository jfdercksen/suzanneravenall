import {
  Body,
  Button,
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
import type { BookingOverLimitEmailData } from '../types'
import { COMPANY_CONTACT_EMAIL, companyPhysicalAddress } from '../company'

const NAVY = '#012B43'
const BLUE = '#1719F4'
const LIGHT_GRAY = '#F5F7FA'
const MEDIUM_GRAY = '#64748B'

/** Shared with the plain-text part so the two never disagree. */
export function overLimitIntro(hasPackage: boolean): string {
  return hasPackage
    ? 'All the sessions in your package are already booked, so we cannot confirm this extra booking.'
    : 'We could not find a session purchase with a session left for this email address, so we cannot confirm this booking.'
}

export const OVER_LIMIT_CANCEL_LINE =
  'Our team will cancel the booking in the calendar for you, so the time is freed. You do not need to do anything for that.'

export default function BookingOverLimit({
  firstName,
  dateLabel,
  timeLabel,
  hasPackage,
  buyMoreUrl,
  appointmentsUrl,
}: BookingOverLimitEmailData) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`About your booking on ${dateLabel}`}</Preview>
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
              About your booking, {firstName ?? 'there'}
            </Heading>

            <Section style={{ borderLeft: `3px solid ${BLUE}`, padding: '4px 0 4px 16px', margin: '0 0 24px' }}>
              <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 6px' }}>
                The booking
              </Text>
              <Text style={{ color: NAVY, fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                {dateLabel}, {timeLabel}
              </Text>
            </Section>

            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.7', margin: '0 0 12px' }}>
              {overLimitIntro(hasPackage)}
            </Text>
            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.7', margin: '0 0 24px' }}>
              {OVER_LIMIT_CANCEL_LINE}
            </Text>

            <Text style={{ color: NAVY, fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>
              Would you like more sessions?
            </Text>
            <Text style={{ color: '#334155', fontSize: '15px', lineHeight: '1.7', margin: '0 0 20px' }}>
              Buy another session or package and you will receive a new booking link straight away.
            </Text>
            <Section style={{ textAlign: 'center', margin: '0 0 24px' }}>
              <Button
                href={buyMoreUrl}
                style={{
                  backgroundColor: NAVY,
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '700',
                  padding: '14px 36px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Buy more sessions
              </Button>
            </Section>

            <Text style={{ color: '#334155', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
              Your booked sessions are listed in{' '}
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
