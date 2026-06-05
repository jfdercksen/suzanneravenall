import {
  Body,
  Button,
  Column,
  Container,
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
import type { OrderEmailData, OrderProductType } from '../lib/email/types'
import { formatAmount } from '../lib/email/utils'

const NAVY = '#012B43'
const BLUE = '#1719F4'
const LIGHT_GRAY = '#F5F7FA'
const MEDIUM_GRAY = '#64748B'
const DARK_TEXT = '#334155'

interface OrderConfirmationProps extends OrderEmailData {
  invoiceUrl: string | null
}

interface NextStep {
  step: string
  text: string
}

function getNextSteps(productType: OrderProductType | undefined): NextStep[] {
  switch (productType) {
    case 'session':
      return [
        { step: '01', text: 'Your booking link is above — schedule your session at your convenience.' },
        { step: '02', text: 'Prepare any questions, topics, or intentions you want to explore.' },
        { step: '03', text: 'Join your session — Suzanne will guide the rest.' },
      ]
    case 'self-paced':
      return [
        { step: '01', text: 'Create your member portal account at suzanneravenall.com/portal — your programme content will be waiting.' },
        { step: '02', text: 'Work through the materials at your own pace — no deadlines, no pressure.' },
        { step: '03', text: 'Reach out to support@ravenallinstitute.com any time you need guidance.' },
      ]
    case 'live':
      return [
        { step: '01', text: 'Watch your email for joining instructions and Zoom details.' },
        { step: '02', text: 'Joining instructions are sent 48 hours before your first session.' },
        { step: '03', text: 'Join the live session — Suzanne will be there to guide you through every step.' },
      ]
    case 'group':
      return [
        { step: '01', text: 'Your Zoom link will be emailed 24 hours before the session.' },
        { step: '02', text: 'Sessions are recorded — you will receive the recording link after.' },
        { step: '03', text: 'Reach out if you have any questions before the session.' },
      ]
    default:
      return [
        { step: '01', text: 'You will receive access details and confirmation within 24 hours.' },
        { step: '02', text: 'Check your email for further details and instructions.' },
        { step: '03', text: 'Reach out to support@ravenallinstitute.com with any questions.' },
      ]
  }
}

export default function OrderConfirmation({
  displayId,
  createdAt,
  currency,
  firstName,
  items,
  subtotal,
  taxTotal,
  total,
  invoiceUrl,
  productType,
  calBookingUrl,
}: OrderConfirmationProps) {
  const greeting = `Dear ${firstName ?? 'valued customer'},`
  const formattedDate = new Date(createdAt).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const nextSteps = getNextSteps(productType)

  return (
    <Html lang="en">
      <Head />
      <Preview>Your transformation begins — Order #{displayId}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: "'Poppins', Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>

          {/* Header */}
          <Section style={{ backgroundColor: NAVY, padding: '32px 40px 0' }}>
            <Text style={{ color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: '0 0 4px' }}>
              Dr Suzanne Ravenall
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 24px' }}>
              Ravenall Institute
            </Text>
            <Hr style={{ borderColor: BLUE, borderWidth: '2px', margin: '0 0 28px' }} />
            <Heading
              as="h1"
              style={{ color: '#ffffff', fontSize: '28px', fontWeight: '700', margin: '0 0 32px', lineHeight: '1.3' }}
            >
              Thank you for your order
            </Heading>
          </Section>

          {/* Greeting */}
          <Section style={{ padding: '40px 40px 0' }}>
            <Text style={{ color: DARK_TEXT, fontSize: '16px', lineHeight: '1.6', margin: '0 0 8px' }}>
              {greeting}
            </Text>
            <Text style={{ color: DARK_TEXT, fontSize: '16px', lineHeight: '1.6', margin: '0 0 32px' }}>
              You&apos;ve taken a powerful step towards transformation.{' '}
              We&apos;re honoured to be part of your journey.
            </Text>
          </Section>

          {/* Cal.com booking — only shown for private session purchases */}
          {calBookingUrl && (
            <Section style={{ backgroundColor: NAVY, padding: '32px 40px', marginBottom: '0' }}>
              <Text style={{ color: BLUE, fontSize: '11px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 12px' }}>
                Book Your Session
              </Text>
              <Text style={{ color: '#ffffff', fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>
                Your payment is confirmed — schedule now
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
                Click below to choose a date and time that works for you.
                Sessions are typically available within 2–3 business days.
              </Text>
              <Section style={{ textAlign: 'center', marginBottom: '16px' }}>
                <Button
                  href={calBookingUrl}
                  style={{
                    backgroundColor: BLUE,
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: '700',
                    padding: '14px 36px',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  Book Your Session Now →
                </Button>
              </Section>
              <Text style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', margin: 0 }}>
                Or copy this link:{' '}
                <Link href={calBookingUrl} style={{ color: BLUE, textDecoration: 'none' }}>
                  {calBookingUrl}
                </Link>
              </Text>
            </Section>
          )}

          {/* Order Summary */}
          <Section style={{ padding: '32px 40px 0' }}>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '11px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px' }}>
              Order Summary
            </Text>
            <Section style={{ backgroundColor: LIGHT_GRAY, borderRadius: '4px', padding: '24px', marginBottom: '32px' }}>
              <Row style={{ marginBottom: '12px' }}>
                <Column>
                  <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: 0 }}>Order Reference</Text>
                  <Text style={{ color: NAVY, fontSize: '15px', fontWeight: '700', margin: '2px 0 0' }}>
                    #{displayId}
                  </Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: 0 }}>Date</Text>
                  <Text style={{ color: NAVY, fontSize: '14px', margin: '2px 0 0' }}>
                    {formattedDate}
                  </Text>
                </Column>
              </Row>

              <Hr style={{ borderColor: '#e2e8f0', margin: '16px 0' }} />

              {/* Column headers */}
              <Row style={{ marginBottom: '8px' }}>
                <Column style={{ width: '60%' }}>
                  <Text style={{ color: MEDIUM_GRAY, fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                    Programme
                  </Text>
                </Column>
                <Column style={{ width: '20%', textAlign: 'center' }}>
                  <Text style={{ color: MEDIUM_GRAY, fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                    Qty
                  </Text>
                </Column>
                <Column style={{ width: '20%', textAlign: 'right' }}>
                  <Text style={{ color: MEDIUM_GRAY, fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                    Price
                  </Text>
                </Column>
              </Row>

              {/* Line items */}
              {items.map((item) => (
                <Row key={item.id} style={{ marginBottom: '8px' }}>
                  <Column style={{ width: '60%', verticalAlign: 'top' }}>
                    <Text style={{ color: NAVY, fontSize: '14px', fontWeight: '600', margin: '0 0 2px' }}>
                      {item.title}
                    </Text>
                    {item.variantTitle ? (
                      <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: 0 }}>
                        {item.variantTitle}
                      </Text>
                    ) : null}
                  </Column>
                  <Column style={{ width: '20%', verticalAlign: 'top', textAlign: 'center' }}>
                    <Text style={{ color: DARK_TEXT, fontSize: '14px', margin: 0 }}>
                      {item.quantity}
                    </Text>
                  </Column>
                  <Column style={{ width: '20%', verticalAlign: 'top', textAlign: 'right' }}>
                    <Text style={{ color: DARK_TEXT, fontSize: '14px', margin: 0 }}>
                      {formatAmount(item.unitPrice, currency)}
                    </Text>
                  </Column>
                </Row>
              ))}

              <Hr style={{ borderColor: '#e2e8f0', margin: '16px 0 12px' }} />

              {/* Totals */}
              <Row style={{ marginBottom: '4px' }}>
                <Column>
                  <Text style={{ color: MEDIUM_GRAY, fontSize: '13px', margin: 0 }}>Subtotal</Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ color: DARK_TEXT, fontSize: '13px', margin: 0 }}>
                    {formatAmount(subtotal, currency)}
                  </Text>
                </Column>
              </Row>
              <Row style={{ marginBottom: '12px' }}>
                <Column>
                  <Text style={{ color: MEDIUM_GRAY, fontSize: '13px', margin: 0 }}>VAT (15%)</Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ color: DARK_TEXT, fontSize: '13px', margin: 0 }}>
                    {formatAmount(taxTotal, currency)}
                  </Text>
                </Column>
              </Row>
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
          </Section>

          {/* What Happens Next — dynamic per product type */}
          <Section style={{ backgroundColor: LIGHT_GRAY, padding: '32px 40px', marginBottom: '0' }}>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '11px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 20px' }}>
              What Happens Next
            </Text>
            {nextSteps.map(({ step, text }) => (
              <Row key={step} style={{ marginBottom: '16px' }}>
                <Column style={{ width: '48px', verticalAlign: 'top' }}>
                  <Text style={{ color: BLUE, fontSize: '18px', fontWeight: '700', margin: 0 }}>
                    {step}
                  </Text>
                </Column>
                <Column style={{ verticalAlign: 'top' }}>
                  <Text style={{ color: DARK_TEXT, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                    {text}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* Invoice Section */}
          <Section style={{ padding: '32px 40px', borderTop: `3px solid ${BLUE}` }}>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '11px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 12px' }}>
              Your Tax Invoice
            </Text>
            {invoiceUrl ? (
              <>
                <Text style={{ color: DARK_TEXT, fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px' }}>
                  Your invoice is ready. Use the button below to download it.
                </Text>
                <Section style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <Button
                    href={invoiceUrl}
                    style={{
                      backgroundColor: BLUE,
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: '700',
                      padding: '14px 36px',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      display: 'inline-block',
                    }}
                  >
                    Download Invoice (PDF)
                  </Button>
                </Section>
                <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', lineHeight: '1.5', margin: 0 }}>
                  This invoice is VAT compliant for South African tax purposes.
                </Text>
              </>
            ) : (
              <Text style={{ color: DARK_TEXT, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                Your VAT-compliant tax invoice is being generated and will be sent to you in a
                separate email shortly.
              </Text>
            )}
          </Section>

          {/* Support Section */}
          <Section style={{ padding: '32px 40px', borderTop: '1px solid #e2e8f0' }}>
            <Text style={{ color: NAVY, fontSize: '16px', fontWeight: '600', margin: '0 0 12px' }}>
              Questions? We&apos;re here to help.
            </Text>
            <Text style={{ color: DARK_TEXT, fontSize: '14px', lineHeight: '1.6', margin: '0 0 8px' }}>
              Email:{' '}
              <Link
                href="mailto:support@ravenallinstitute.com"
                style={{ color: BLUE, textDecoration: 'none' }}
              >
                support@ravenallinstitute.com
              </Link>
            </Text>
            <Text style={{ color: DARK_TEXT, fontSize: '14px', margin: 0 }}>
              <Link
                href="https://suzanneravenall.com/contact"
                style={{ color: BLUE, textDecoration: 'none' }}
              >
                Contact us online →
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: NAVY, padding: '28px 40px' }}>
            <Text style={{ color: '#ffffff', fontSize: '15px', fontWeight: '700', margin: '0 0 4px' }}>
              Dr Suzanne Ravenall
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 16px' }}>
              Ravenall Institute · Cape Town, South Africa
            </Text>
            {/* TODO: Replace with real physical address — required for POPIA compliance */}
            <Text style={{ color: '#64748b', fontSize: '11px', margin: '0 0 8px' }}>
              [Physical address — required for POPIA compliance — to be confirmed]
            </Text>
            <Text style={{ color: '#64748b', fontSize: '11px', margin: '0 0 12px' }}>
              {/* TODO: Replace with real unsubscribe link once email management is configured */}
              <a href="#" style={{ color: '#64748b' }}>Unsubscribe</a> from transactional emails
            </Text>
            <Text style={{ color: '#475569', fontSize: '11px', margin: 0 }}>
              Powered by Ai Dynamic Advisory
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
