import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import type { CartEmailData } from '../types'
import { formatAmount } from '../utils'

const NAVY = '#012B43'
const BLUE = '#1719F4'
const LIGHT_GRAY = '#F5F7FA'
const MEDIUM_GRAY = '#64748B'
const GREEN = '#16A34A'

export default function CartAbandonment3({
  firstName,
  items,
  total,
  cartUrl,
  currency,
}: CartEmailData) {
  const greeting = firstName ? `${firstName},` : 'Friend,'

  return (
    <Html lang="en">
      <Head />
      <Preview>Last chance to secure your place — your cart expires today</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>

          {/* Urgency banner */}
          <Section style={{ backgroundColor: NAVY, padding: '16px 40px', textAlign: 'center' }}>
            <Text style={{ color: '#f59e0b', fontSize: '12px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
              Final Reminder — Cart Expiring Today
            </Text>
          </Section>

          {/* Header */}
          <Section style={{ backgroundColor: '#f8fafc', padding: '24px 40px', borderBottom: '1px solid #e2e8f0' }}>
            <Text style={{ color: NAVY, fontSize: '20px', fontWeight: '700', margin: 0 }}>
              Dr Suzanne Ravenall
            </Text>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '13px', margin: '4px 0 0' }}>
              Ravenall Institute
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: '40px' }}>
            <Heading
              as="h1"
              style={{ color: NAVY, fontSize: '26px', fontWeight: '300', margin: '0 0 16px', lineHeight: '1.3' }}
            >
              Last chance to secure your place
            </Heading>
            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.6', margin: '0 0 24px' }}>
              {greeting} this is my final reminder. Your cart will expire after today and your
              reserved spot will be released.
            </Text>

            {/* Testimonial placeholder */}
            <Section style={{ backgroundColor: LIGHT_GRAY, borderRadius: '4px', padding: '24px', marginBottom: '32px' }}>
              <Text style={{ color: MEDIUM_GRAY, fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>
                What Others Are Saying
              </Text>
              {/* TODO: Replace with a real client testimonial once Suzanne provides quotes */}
              <Text style={{ color: NAVY, fontSize: '15px', fontStyle: 'italic', lineHeight: '1.6', margin: '0 0 12px' }}>
                &ldquo;Working with Dr Suzanne completely shifted how I understand myself and
                my purpose. The tools she shares are practical, profound, and lasting.&rdquo;
              </Text>
              <Text style={{ color: MEDIUM_GRAY, fontSize: '13px', fontWeight: '600', margin: 0 }}>
                — Client Name, Location
              </Text>
            </Section>

            {/* Cart summary */}
            <Section style={{ border: `2px solid ${NAVY}`, borderRadius: '4px', padding: '24px', marginBottom: '32px' }}>
              <Text style={{ color: MEDIUM_GRAY, fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>
                Your Order
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

            {/* Primary CTA */}
            <Section style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Button
                href={cartUrl}
                style={{
                  backgroundColor: GREEN,
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '700',
                  padding: '16px 40px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Complete Now
              </Button>
            </Section>

            {/* Secondary CTA */}
            <Section style={{ textAlign: 'center', marginBottom: '40px' }}>
              <Text style={{ color: MEDIUM_GRAY, fontSize: '14px', margin: '0 0 8px' }}>
                Not sure? I&apos;d love to answer your questions.
              </Text>
              <Link
                href="https://suzanneravenall.com/contact"
                style={{ color: BLUE, fontSize: '14px', fontWeight: '600', textDecoration: 'underline' }}
              >
                Book a free 15-minute call →
              </Link>
            </Section>

            <Hr style={{ borderColor: '#e2e8f0', marginBottom: '24px' }} />

            <Text style={{ color: '#334155', fontSize: '14px', margin: '0 0 0' }}>
              Warmly,<br />
              <strong>Dr Suzanne Ravenall</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: LIGHT_GRAY, padding: '24px 40px', borderTop: '1px solid #e2e8f0' }}>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: '0 0 4px' }}>
              Ravenall Institute · Cape Town, South Africa
            </Text>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: 0 }}>
              {/* TODO: Replace with real unsubscribe link once email management is configured */}
              <a href="#" style={{ color: MEDIUM_GRAY }}>Unsubscribe</a> from cart reminder emails
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
