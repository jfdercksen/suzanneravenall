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

const WHAT_YOULL_LOSE: Record<MembershipEmailData['tier'], string[]> = {
  free: ['Access to your member dashboard'],
  silver: [
    'Resource and media library',
    'Recorded group coaching sessions',
    'Self-study programme access',
  ],
  gold: [
    'Resource and media library',
    'Recorded group sessions and live session archives',
    'Full programme library',
    'Priority event booking',
  ],
  practitioner: [
    'Practitioner certification materials',
    'Full programme and session library',
    'Practitioner mentorship access',
  ],
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function MembershipRenewalReminder({
  firstName,
  tier,
  tierLabel,
  renewalDate,
  siteUrl,
}: MembershipEmailData) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'
  const lossItems = WHAT_YOULL_LOSE[tier] ?? WHAT_YOULL_LOSE.silver
  const formattedDate = renewalDate ? formatDate(renewalDate) : 'in 7 days'

  return (
    <Html lang="en">
      <Head />
      <Preview>
        Your {tierLabel} membership renews {formattedDate} — keep your progress going.
      </Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>

          {/* Header */}
          <Section style={{ backgroundColor: NAVY, padding: '32px 40px' }}>
            <Text style={{ color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: '0 0 4px' }}>
              Dr Suzanne Ravenall
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
              Ravenall Institute
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: '40px' }}>
            <Heading
              as="h1"
              style={{ color: NAVY, fontSize: '26px', fontWeight: '300', margin: '0 0 20px', lineHeight: '1.3' }}
            >
              Your membership renews {formattedDate}
            </Heading>
            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px' }}>
              {greeting}
            </Text>
            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.7', margin: '0 0 24px' }}>
              Just a friendly heads-up — your <strong>{tierLabel}</strong> membership renews on{' '}
              <strong>{formattedDate}</strong>. No action is needed if you&apos;d like to continue.
            </Text>

            {/* What you'd lose */}
            <Section style={{ backgroundColor: LIGHT_GRAY, borderRadius: '4px', padding: '24px 32px', marginBottom: '32px' }}>
              <Text style={{ color: MEDIUM_GRAY, fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>
                What you&apos;ll keep if you renew
              </Text>
              {lossItems.map((item) => (
                <Text key={item} style={{ color: '#334155', fontSize: '15px', margin: '0 0 8px' }}>
                  ✓ {item}
                </Text>
              ))}
            </Section>

            {/* Primary CTA */}
            <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Button
                href={`${siteUrl}/portal/account`}
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
                Manage My Membership
              </Button>
            </Section>

            {/* Upgrade nudge */}
            <Text style={{ color: MEDIUM_GRAY, fontSize: '14px', textAlign: 'center', margin: '0 0 32px' }}>
              Want more? You can{' '}
              <a href={`${siteUrl}/portal/upgrade`} style={{ color: BLUE }}>
                upgrade your tier
              </a>{' '}
              before your renewal date.
            </Text>

            <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

            <Text style={{ color: '#334155', fontSize: '15px', lineHeight: '1.7', margin: '0 0 8px' }}>
              If you have any questions about your membership or billing, reply to this email and I&apos;ll help you directly.
            </Text>
            <Text style={{ color: '#334155', fontSize: '15px', margin: '16px 0 0' }}>
              Warm regards,<br />
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
