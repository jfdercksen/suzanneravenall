import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import type { CartEmailProps } from '../types'
import { companyPhysicalAddress } from '../company'
import { formatAmount } from '../utils'

const NAVY = '#012B43'
const BLUE = '#1719F4'
const LIGHT_GRAY = '#F5F7FA'
const MEDIUM_GRAY = '#64748B'

export default function CartAbandonment2({
  firstName,
  items,
  total,
  cartUrl,
  currency,
  unsubscribeUrl,
}: CartEmailProps) {
  const greeting = firstName ? `${firstName},` : 'Friend,'

  return (
    <Html lang="en">
      <Head />
      <Preview>Your transformation is one step away — your place is still reserved</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>

          {/* Header */}
          <Section style={{ backgroundColor: NAVY, padding: '32px 40px' }}>
            <Text style={{ color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: 0 }}>
              Dr Suzanne Ravenall
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>
              Ravenall Institute
            </Text>
          </Section>

          {/* Hero */}
          <Section style={{ backgroundColor: '#f0f4ff', padding: '40px', borderLeft: `4px solid ${BLUE}` }}>
            <Text style={{ color: BLUE, fontSize: '11px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 12px' }}>
              Your Journey
            </Text>
            <Heading
              as="h1"
              style={{ color: NAVY, fontSize: '26px', fontWeight: '300', margin: '0 0 16px', lineHeight: '1.3' }}
            >
              Your transformation is<br />one step away
            </Heading>
            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.6', margin: 0 }}>
              {greeting} the programme you selected is designed to create lasting change.
              Hundreds of clients have walked this path — and you were this close to beginning yours.
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: '40px' }}>
            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.6', margin: '0 0 24px' }}>
              Everything you need is already waiting for you. The tools, the frameworks, the
              breakthroughs — they&apos;re built into what you were about to purchase.
            </Text>

            {/* Cart items */}
            <Section style={{ backgroundColor: LIGHT_GRAY, borderRadius: '4px', padding: '24px', marginBottom: '24px' }}>
              <Text style={{ color: MEDIUM_GRAY, fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>
                Reserved for You
              </Text>
              {items.map((item) => (
                <Row key={item.id} style={{ marginBottom: '12px' }}>
                  <Column>
                    <Text style={{ color: NAVY, fontSize: '14px', fontWeight: '600', margin: '0 0 2px' }}>
                      {item.title}
                    </Text>
                    {item.variant_title ? (
                      <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: '0 0 2px' }}>
                        {item.variant_title}
                      </Text>
                    ) : null}
                    <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: 0 }}>
                      Qty {item.quantity} · {formatAmount(item.unit_price, currency)}
                    </Text>
                  </Column>
                </Row>
              ))}
              <Hr style={{ borderColor: '#e2e8f0', margin: '16px 0' }} />
              <Row>
                <Column>
                  <Text style={{ color: NAVY, fontSize: '15px', fontWeight: '700', margin: 0 }}>Total</Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ color: NAVY, fontSize: '15px', fontWeight: '700', margin: 0 }}>
                    {formatAmount(total, currency)}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Urgency note */}
            <Section style={{ backgroundColor: '#fffbeb', borderLeft: '3px solid #f59e0b', padding: '16px', marginBottom: '32px' }}>
              <Text style={{ color: '#92400e', fontSize: '14px', margin: 0 }}>
                <strong>Note:</strong> Spaces in our live programmes are limited.
                Your reservation will expire in 24 hours.
              </Text>
            </Section>

            {/* CTA */}
            <Section style={{ textAlign: 'center', marginBottom: '40px' }}>
              <Button
                href={cartUrl}
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
                Claim Your Place
              </Button>
            </Section>

            <Text style={{ color: '#334155', fontSize: '14px', margin: '16px 0 0' }}>
              With belief in your potential,<br />
              <strong>Dr Suzanne Ravenall</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: LIGHT_GRAY, padding: '24px 40px', borderTop: '1px solid #e2e8f0' }}>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: '0 0 4px' }}>
              Ravenall Institute · {companyPhysicalAddress()}
            </Text>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: 0 }}>
              <a href={unsubscribeUrl} style={{ color: MEDIUM_GRAY }}>Unsubscribe</a> from cart reminder emails
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
