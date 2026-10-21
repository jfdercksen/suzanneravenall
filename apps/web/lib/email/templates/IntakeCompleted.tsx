import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { IntakeAnswer } from '../../intake/types'
import { answerText } from '../../intake/validate'

/**
 * A completed intake form for the team (H-12): who, which order and service,
 * then every question with its answer, grouped under the form's headings.
 * Skipped questions show as "Not answered" so the team sees the whole form.
 */

const INK = '#0A0A0A'
const MUTED = '#696969'
const SAND = '#F6F6F7'
const BORDER = '#E5E5E5'

export interface IntakeCompletedProps {
  clientName: string
  clientEmail: string
  orderNumber: string
  serviceName: string
  formTitle: string
  completedAt: string
  acknowledged: boolean
  items: IntakeAnswer[]
}

function groups(items: IntakeAnswer[]): { section: string | null; items: IntakeAnswer[] }[] {
  const out: { section: string | null; items: IntakeAnswer[] }[] = []
  for (const item of items) {
    const section = item.section ?? null
    const last = out[out.length - 1]
    if (last && last.section === section) last.items.push(item)
    else out.push({ section, items: [item] })
  }
  return out
}

export default function IntakeCompleted({
  clientName,
  clientEmail,
  orderNumber,
  serviceName,
  formTitle,
  completedAt,
  acknowledged,
  items,
}: IntakeCompletedProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`Intake form from ${clientName}, order ${orderNumber}, ${serviceName}`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '680px', margin: '0 auto', padding: '24px' }}>
          <Heading as="h1" style={{ color: INK, fontSize: '22px', fontWeight: '400', margin: '0 0 16px' }}>
            Intake form completed
          </Heading>
          <Section style={{ backgroundColor: SAND, borderRadius: '4px', padding: '16px 20px', marginBottom: '24px' }}>
            {[
              ['Client', clientName],
              ['Email', clientEmail],
              ['Order', orderNumber],
              ['Service', serviceName],
              ['Form', formTitle],
              ['Completed', completedAt],
              ['Acknowledgement', acknowledged ? 'Ticked' : 'Not on this form'],
            ].map(([k, v]) => (
              <Text key={k} style={{ color: INK, fontSize: '14px', lineHeight: '1.5', margin: '0 0 4px' }}>
                <strong>{k}:</strong> {v}
              </Text>
            ))}
          </Section>

          {groups(items).map((group, gi) => (
            <Section key={`${group.section ?? 'none'}-${gi}`} style={{ marginBottom: '16px' }}>
              {group.section ? (
                <Text
                  style={{
                    color: INK,
                    fontSize: '13px',
                    fontWeight: '700',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    margin: '0 0 8px',
                    borderBottom: `1px solid ${BORDER}`,
                    paddingBottom: '6px',
                  }}
                >
                  {group.section}
                </Text>
              ) : null}
              {group.items.map((item) => {
                const answer = answerText(item)
                return (
                  <Section key={item.fieldId} style={{ marginBottom: '12px' }}>
                    <Text style={{ color: MUTED, fontSize: '13px', lineHeight: '1.5', margin: '0 0 2px' }}>{item.label}</Text>
                    <Text style={{ color: INK, fontSize: '15px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {answer || 'Not answered'}
                    </Text>
                    {item.detail ? (
                      <Text style={{ color: INK, fontSize: '15px', lineHeight: '1.6', margin: '2px 0 0', whiteSpace: 'pre-wrap' }}>
                        Details: {item.detail}
                      </Text>
                    ) : null}
                  </Section>
                )
              })}
            </Section>
          ))}

          <Hr style={{ borderColor: BORDER, margin: '24px 0 12px' }} />
          <Text style={{ color: MUTED, fontSize: '12px', lineHeight: '1.5', margin: 0 }}>
            Personal and health information: keep this mail within the team. Reply to this mail to write to the client.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
