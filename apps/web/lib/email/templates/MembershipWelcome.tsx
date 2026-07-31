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
import type { MembershipEmailData } from '../types'

const NAVY = '#012B43'
const BLUE = '#1719F4'
const LIGHT_GRAY = '#F5F7FA'
const MEDIUM_GRAY = '#64748B'

const TIER_BENEFITS: Record<MembershipEmailData['tier'], string[]> = {
  free: [
    'Access to the blog and resource library',
    'Dr. Suzanne\'s curated reading list',
    'Member-only newsletter',
  ],
  silver: [
    'Full resource and media library',
    'Recorded group coaching sessions',
    'Self-study programme access',
    'Assessment tools and workbooks',
  ],
  gold: [
    'Everything in Silver',
    'Live session recordings',
    'Full programme library access',
    'Priority booking for live events',
  ],
  practitioner: [
    'Everything in Gold',
    'Practitioner certification materials',
    'Exclusive practitioner-only resources',
    'Mentorship programme access',
  ],
}

export default function MembershipWelcome({
  firstName,
  tier,
  tierLabel,
  siteUrl,
}: MembershipEmailData) {
  const greeting = firstName ? `Welcome, ${firstName}!` : 'Welcome!'
  const benefits = TIER_BENEFITS[tier] ?? TIER_BENEFITS.free

  return (
    <Html lang="en">
      <Head />
      <Preview>
        {firstName
          ? `${firstName}, your ${tierLabel} membership is now active`
          : `Your ${tierLabel} membership is now active`}
      </Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>

          {/* Header — celebratory accent strip */}
          <Section style={{ backgroundColor: NAVY, padding: '32px 40px 0' }}>
            <Text style={{ color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: '0 0 4px' }}>
              Dr Suzanne Ravenall
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 0' }}>
              Ravenall Institute
            </Text>
          </Section>
          <Section style={{ backgroundColor: BLUE, padding: '8px 40px' }}>
            <Text style={{ color: '#ffffff', fontSize: '11px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
              {tierLabel} — Active
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: '40px' }}>
            <Heading
              as="h1"
              style={{ color: NAVY, fontSize: '28px', fontWeight: '300', margin: '0 0 20px', lineHeight: '1.3' }}
            >
              {greeting}
            </Heading>
            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px' }}>
              I&apos;m thrilled to welcome you as a <strong>{tierLabel}</strong> of the Ravenall Institute.
              This is the beginning of something truly transformative.
            </Text>
            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.7', margin: '0 0 32px' }}>
              Your membership is now active and your portal is ready. Here&apos;s everything
              you have access to:
            </Text>

            {/* Benefits list */}
            <Section style={{ backgroundColor: LIGHT_GRAY, borderRadius: '4px', padding: '24px 32px', marginBottom: '32px' }}>
              <Text style={{ color: MEDIUM_GRAY, fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>
                Your {tierLabel} Includes
              </Text>
              {benefits.map((benefit) => (
                <Text key={benefit} style={{ color: '#334155', fontSize: '15px', margin: '0 0 10px', paddingLeft: '0' }}>
                  ✓ {benefit}
                </Text>
              ))}
            </Section>

            {/* Primary CTA */}
            <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Button
                href={`${siteUrl}/portal/dashboard`}
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
                Enter Your Portal
              </Button>
            </Section>

            {/* Quick links */}
            <Section style={{ marginBottom: '32px' }}>
              <Text style={{ color: MEDIUM_GRAY, fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>
                Jump straight in
              </Text>
              <Text style={{ color: '#334155', fontSize: '15px', margin: '0 0 8px' }}>
                <a href={`${siteUrl}/portal/programmes`} style={{ color: BLUE, textDecoration: 'none' }}>
                  My Programmes →
                </a>
              </Text>
              <Text style={{ color: '#334155', fontSize: '15px', margin: '0 0 8px' }}>
                <a href={`${siteUrl}/portal/resources`} style={{ color: BLUE, textDecoration: 'none' }}>
                  Resource Library →
                </a>
              </Text>
              <Text style={{ color: '#334155', fontSize: '15px', margin: 0 }}>
                <a href={`${siteUrl}/community`} style={{ color: BLUE, textDecoration: 'none' }}>
                  Community →
                </a>
              </Text>
            </Section>

            <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

            <Text style={{ color: '#334155', fontSize: '15px', lineHeight: '1.7', margin: '0 0 8px' }}>
              If you ever have questions or need support on your journey, simply reply to this email — I read every message personally.
            </Text>
            <Text style={{ color: '#334155', fontSize: '15px', margin: '16px 0 0' }}>
              With warmth,<br />
              <strong>Dr Suzanne Ravenall</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: LIGHT_GRAY, padding: '24px 40px', borderTop: '1px solid #e2e8f0' }}>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: '0 0 4px' }}>
              Ravenall Institute · Cape Town, South Africa
            </Text>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: 0 }}>
              {/* TODO: Replace with real unsubscribe link once email management is configured (POPIA compliance) */}
              <a href={`${siteUrl}/portal/account`} style={{ color: MEDIUM_GRAY }}>Manage your membership</a>
              {' · '}
              <a href={`${siteUrl}/portal/account`} style={{ color: MEDIUM_GRAY }}>Unsubscribe</a>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
