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
import type { MembershipEmailData, MembershipEmailProps } from '../types'
import { companyPhysicalAddress } from '../company'
import { memberEmailTestimonial } from '@/data/testimonials'

const NAVY = '#012B43'
const BLUE = '#1719F4'
const LIGHT_GRAY = '#F5F7FA'
const MEDIUM_GRAY = '#64748B'

const WHAT_YOU_HAD: Record<MembershipEmailData['tier'], string[]> = {
  free: ['Your member dashboard and profile'],
  silver: [
    'Resource and media library',
    'Recorded group coaching sessions',
    'Self-study programme access',
    'Assessment tools and workbooks',
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
    'All Gold member benefits',
  ],
}

export default function MembershipExpired({
  firstName,
  tier,
  tierLabel,
  siteUrl,
  unsubscribeUrl,
}: MembershipEmailProps) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'
  const hadItems = WHAT_YOU_HAD[tier] ?? WHAT_YOU_HAD.silver

  return (
    <Html lang="en">
      <Head />
      <Preview>
        {firstName
          ? `${firstName}, your ${tierLabel} has expired — come back whenever you're ready`
          : `Your ${tierLabel} has expired — come back whenever you're ready`}
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
              Your membership has expired
            </Heading>
            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px' }}>
              {greeting}
            </Text>
            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.7', margin: '0 0 24px' }}>
              Your <strong>{tierLabel}</strong> membership has expired. There&apos;s no judgement here —
              life gets busy, and I know how that feels. Your journey isn&apos;t over. Whenever you&apos;re
              ready to return, your place is waiting.
            </Text>

            {/* What you've lost access to */}
            <Section style={{ backgroundColor: LIGHT_GRAY, borderRadius: '4px', padding: '24px 32px', marginBottom: '32px' }}>
              <Text style={{ color: MEDIUM_GRAY, fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>
                What you had access to
              </Text>
              {hadItems.map((item) => (
                <Text key={item} style={{ color: MEDIUM_GRAY, fontSize: '15px', margin: '0 0 8px', textDecoration: 'line-through' }}>
                  {item}
                </Text>
              ))}
            </Section>

            {/* Primary CTA */}
            <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Button
                href={`${siteUrl}/shop?filter=memberships`}
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
                Rejoin the Ravenall Institute
              </Button>
            </Section>

            {/* Grace period note */}
            <Section style={{ backgroundColor: '#FEF9EC', borderRadius: '4px', padding: '20px 24px', marginBottom: '32px', border: '1px solid #FDE68A' }}>
              <Text style={{ color: '#92400E', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                <strong>Good news:</strong> Your account and all your progress data are kept for 30 days.{' '}
                {/* TODO for Suzanne: confirm the grace period before go-live */}
                If you rejoin within that window, everything is exactly as you left it.
              </Text>
            </Section>

            {/* Member testimonial — sourced from data/testimonials.ts (single
                source of truth). Omitted entirely until Suzanne signs off a
                real member quote. */}
            {memberEmailTestimonial && (
              <Section style={{ borderLeft: `3px solid ${BLUE}`, paddingLeft: '20px', marginBottom: '32px' }}>
                <Text style={{ color: '#334155', fontSize: '15px', lineHeight: '1.7', fontStyle: 'italic', margin: '0 0 8px' }}>
                  &ldquo;{memberEmailTestimonial.quote}&rdquo;
                </Text>
                <Text style={{ color: MEDIUM_GRAY, fontSize: '13px', margin: 0 }}>
                  — {memberEmailTestimonial.attribution}
                </Text>
              </Section>
            )}

            <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

            <Text style={{ color: '#334155', fontSize: '15px', lineHeight: '1.7', margin: '0 0 8px' }}>
              If there&apos;s something that stopped you from continuing, I&apos;d genuinely love to hear from you.
              Simply reply to this email.
            </Text>
            <Text style={{ color: '#334155', fontSize: '15px', margin: '16px 0 0' }}>
              With care,<br />
              <strong>Dr Suzanne Ravenall</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: LIGHT_GRAY, padding: '24px 40px', borderTop: '1px solid #e2e8f0' }}>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: '0 0 4px' }}>
              Ravenall Institute · {companyPhysicalAddress()}
            </Text>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: 0 }}>
              <a href={unsubscribeUrl} style={{ color: MEDIUM_GRAY }}>Unsubscribe</a> from membership emails
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
