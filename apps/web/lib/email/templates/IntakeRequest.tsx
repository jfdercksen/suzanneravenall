import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from '@react-email/components'
import { companyPhysicalAddress } from '../company'
import {
  RR_INTRO_COUPON,
  RR_INTRO_COURSE_NAME,
  RR_INTRO_COURSE_URL,
  ZOOM_URL,
} from '../intake-content'

/**
 * "Please complete your intake form": sent once after a private-session
 * purchase (reminder 0) and as reminders 1 to 6 until the form is in (H-12).
 *
 * Wording: Shayna's own intake mail (support, 21 Oct 2026), adapted only
 * where our flow differs (an online form behind a button instead of an
 * attachment). The Rapid Repatterning introduction steps show only for Rapid
 * Repatterning; the Zoom link only for online sessions (Johan, 22 Oct).
 * Monochrome, per the site's design standard.
 */

const BLACK = '#000000'
const ACCENT = '#171717'
const INK = '#0A0A0A'
const MUTED = '#696969'
const SAND = '#F6F6F7'
const BORDER = '#E5E5E5'

const P = { color: INK, fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px' } as const

export interface IntakeRequestProps {
  firstName: string | null
  serviceName: string
  formUrl: string
  /** 0 for the first mail, 1 to 6 for the reminders. */
  reminder: number
  supportEmail: string
  /** Show the Rapid Repatterning introduction course steps. */
  rapidRepatterning: boolean
  /** Show the Zoom link (online sessions). */
  online: boolean
}

export default function IntakeRequest({
  firstName,
  serviceName,
  formUrl,
  reminder,
  supportEmail,
  rapidRepatterning,
  online,
}: IntakeRequestProps) {
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
              {isReminder ? 'Your intake form is still open' : 'Your intake form'}
            </Heading>
            <Text style={P}>{greeting}</Text>
            {isReminder ? (
              <Text style={P}>
                I hope you&apos;re doing well. This is a friendly reminder that we have not yet received your intake
                form for your <strong>{serviceName}</strong>.
              </Text>
            ) : (
              <Text style={P}>
                I hope you&apos;re doing well, and thank you so much for purchasing and booking your{' '}
                <strong>{serviceName}</strong>.
              </Text>
            )}
            <Text style={P}>
              May I kindly ask you to please complete your intake form at least <strong>3 days before your session</strong>,
              as this helps ensure you get the best session possible. We work holistically, and therefore want to
              understand more about your overall wellbeing, so we know how to work with you, and how hard to push! But
              if any questions feel uncomfortable, feel free not to answer them.
            </Text>

            <Section style={{ textAlign: 'center', margin: '8px 0 28px' }}>
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

            {rapidRepatterning ? (
              <Section style={{ marginBottom: '8px' }}>
                <Text style={P}>
                  To get you started on your journey we have given you access to a short program of information about
                  what will happen in the session and also short informative videos, along with an understanding of how
                  our system works and a little information about what is going on inside of you that causes
                  stuckness, flow, pain, illness. We hope you enjoy this gift.
                </Text>
                <Text style={{ ...P, fontWeight: '700', margin: '0 0 8px' }}>Steps to access the short programme</Text>
                <Text style={{ ...P, margin: '0 0 6px' }}>
                  Step 1: Go to{' '}
                  <Link href={RR_INTRO_COURSE_URL} style={{ color: INK, textDecoration: 'underline' }}>
                    {RR_INTRO_COURSE_NAME}
                  </Link>{' '}
                  and open a free account.
                </Text>
                <Text style={{ ...P, margin: '0 0 6px' }}>Step 2: Select this course.</Text>
                <Text style={{ ...P, margin: '0 0 16px' }}>
                  Step 3: Check out using this code: <strong>{RR_INTRO_COUPON}</strong>
                </Text>
              </Section>
            ) : null}

            {online ? (
              <Text style={P}>
                Your session will be via Zoom. Click on this link at the time of your session:{' '}
                <Link href={ZOOM_URL} style={{ color: INK, textDecoration: 'underline' }}>
                  {ZOOM_URL}
                </Link>
              </Text>
            ) : null}

            <Text style={P}>
              If you have any questions at all, please don&apos;t hesitate to reach out: reply to this email or write
              to {supportEmail}.
            </Text>

            <Section style={{ backgroundColor: SAND, borderRadius: '4px', padding: '16px 24px', margin: '8px 0 24px' }}>
              <Text style={{ color: MUTED, fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
                This link is personal to you; please do not forward it. If the button does not work, copy this address
                into your browser: {formUrl}
              </Text>
            </Section>

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
