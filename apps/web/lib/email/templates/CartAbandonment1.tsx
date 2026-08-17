import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
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

export default function CartAbandonment1({
  firstName,
  items,
  total,
  cartUrl,
  currency,
  unsubscribeUrl,
}: CartEmailProps) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'

  return (
    <Html lang="en">
      <Head />
      <Preview>
        {firstName
          ? `${firstName}, you left something in your cart`
          : 'You left something in your cart'}
      </Preview>
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

          {/* Body */}
          <Section style={{ padding: '40px' }}>
            <Heading
              as="h1"
              style={{ color: NAVY, fontSize: '26px', fontWeight: '300', margin: '0 0 16px' }}
            >
              You left something behind
            </Heading>
            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.6', margin: '0 0 24px' }}>
              {greeting}
            </Text>
            <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.6', margin: '0 0 32px' }}>
              It looks like you didn&apos;t complete your purchase. Your cart is still saved —
              just pick up where you left off.
            </Text>

            {/* Cart items */}
            <Section style={{ backgroundColor: LIGHT_GRAY, borderRadius: '4px', padding: '24px', marginBottom: '32px' }}>
              <Text style={{ color: MEDIUM_GRAY, fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>
                Your Cart
              </Text>
              {items.map((item) => (
                <Row key={item.id} style={{ marginBottom: '12px' }}>
                  {item.thumbnail ? (
                    <Column style={{ width: '60px', verticalAlign: 'top' }}>
                      <Img
                        src={item.thumbnail}
                        width={52}
                        height={52}
                        alt={item.title}
                        style={{ borderRadius: '4px', objectFit: 'cover' }}
                      />
                    </Column>
                  ) : null}
                  <Column style={{ verticalAlign: 'top', paddingLeft: item.thumbnail ? '12px' : '0' }}>
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
                  <Text style={{ color: NAVY, fontSize: '15px', fontWeight: '700', margin: 0 }}>
                    Total
                  </Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ color: NAVY, fontSize: '15px', fontWeight: '700', margin: 0 }}>
                    {formatAmount(total, currency)}
                  </Text>
                </Column>
              </Row>
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
                Complete Your Order
              </Button>
            </Section>

            <Text style={{ color: MEDIUM_GRAY, fontSize: '14px', lineHeight: '1.6', margin: '0 0 8px' }}>
              If you have any questions, simply reply to this email — I&apos;m happy to help.
            </Text>
            <Text style={{ color: '#334155', fontSize: '14px', margin: '16px 0 0' }}>
              Warm regards,<br />
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
