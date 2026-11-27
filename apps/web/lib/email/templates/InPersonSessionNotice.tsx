import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'

/**
 * Staff notice that a client bought an in-person session. In-person sessions
 * are never self-booked: Suzanne sets aside one day a month and the team
 * contacts the client to agree the day (Shayna, 27 Nov 2026).
 */

export interface InPersonSessionLine {
  product: string
  variant: string | null
  quantity: number
}

export interface InPersonSessionNoticeData {
  /** SR-00042, the invoice number of the order. */
  reference: string
  displayId: number | null
  customerName: string | null
  email: string | null
  phone: string | null
  /** ISO date of the order. */
  orderDate: string | null
  lines: InPersonSessionLine[]
}

const INK = '#0A0A0A'
const MUTED = '#696969'
const SAND = '#F6F6F7'
const BORDER = '#E5E5E5'

export const IN_PERSON_NOTICE_ACTION = 'Contact the client to agree the day.'
export const IN_PERSON_NOTICE_FOOTER = 'This mail holds customer details: keep it within the team.'

export function inPersonLineText(line: InPersonSessionLine): string {
  return `${line.product}${line.variant ? ` (${line.variant})` : ''} x${line.quantity}`
}

export function inPersonOrderDate(iso: string | null): string {
  if (!iso) return 'Not known'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Not known'
  return date.toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg', day: 'numeric', month: 'long', year: 'numeric' })
}

export function inPersonDetailRows(data: InPersonSessionNoticeData): [string, string][] {
  return [
    ['Client', data.customerName ?? 'Name not given'],
    ['Email', data.email ?? 'Not given'],
    ['Phone', data.phone ?? 'Not given'],
    ['Order', data.reference],
    ['Order date', inPersonOrderDate(data.orderDate)],
  ]
}

export default function InPersonSessionNotice(data: InPersonSessionNoticeData) {
  const who = data.customerName ?? data.email ?? 'A client'
  return (
    <Html lang="en">
      <Head />
      <Preview>{`${who} bought an in-person session (${data.reference}). ${IN_PERSON_NOTICE_ACTION}`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <Heading as="h1" style={{ color: INK, fontSize: '22px', fontWeight: '400', margin: '0 0 16px' }}>
            In-person session to arrange
          </Heading>
          <Section style={{ backgroundColor: SAND, borderRadius: '4px', padding: '16px 20px', marginBottom: '24px' }}>
            {inPersonDetailRows(data).map(([k, v]) => (
              <Text key={k} style={{ color: INK, fontSize: '14px', lineHeight: '1.5', margin: '0 0 4px' }}>
                <strong>{k}:</strong> {v}
              </Text>
            ))}
          </Section>
          <Text style={{ color: MUTED, fontSize: '12px', lineHeight: '1.5', margin: '0 0 8px' }}>Bought</Text>
          {data.lines.map((line, i) => (
            <Text key={`${line.product}-${i}`} style={{ color: INK, fontSize: '14px', lineHeight: '1.5', margin: '0 0 4px' }}>
              {inPersonLineText(line)}
            </Text>
          ))}
          <Text style={{ color: INK, fontSize: '14px', lineHeight: '1.6', margin: '16px 0 0' }}>{IN_PERSON_NOTICE_ACTION}</Text>
          <Hr style={{ borderColor: BORDER, margin: '24px 0 12px' }} />
          <Text style={{ color: MUTED, fontSize: '12px', lineHeight: '1.5', margin: 0 }}>{IN_PERSON_NOTICE_FOOTER}</Text>
        </Container>
      </Body>
    </Html>
  )
}
