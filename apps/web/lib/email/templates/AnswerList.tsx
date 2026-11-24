import { Section, Text } from '@react-email/components'
import type { AnswerGroup } from '../../staff/present'

/**
 * Every question with its answer, for the team mails of a completed
 * diagnostic or intake form. Built from the same rows as the staff page
 * (lib/staff/present.ts), so the mail and the backup copy on the site read
 * the same. Answers in the mail again: Suzanne's decision of 20 Nov 2026
 * ("we do allow email"), DECISIONS.md D025.
 */

const INK = '#0A0A0A'
const MUTED = '#696969'
const BORDER = '#E5E5E5'

export function AnswerList({ groups }: { groups: AnswerGroup[] }) {
  return (
    <>
      {groups.map((group, gi) => (
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
          {group.items.map((item, ii) => (
            <Section key={`${gi}-${ii}`} style={{ marginBottom: '12px' }}>
              <Text style={{ color: MUTED, fontSize: '13px', lineHeight: '1.5', margin: '0 0 2px' }}>{item.question}</Text>
              <Text style={{ color: INK, fontSize: '15px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                {item.answer}
              </Text>
              {item.detail ? (
                <Text style={{ color: INK, fontSize: '15px', lineHeight: '1.6', margin: '2px 0 0', whiteSpace: 'pre-wrap' }}>
                  Details: {item.detail}
                </Text>
              ) : null}
            </Section>
          ))}
        </Section>
      ))}
    </>
  )
}

/** The same rows as plain text, for the text part of the mail. */
export function answerListText(groups: AnswerGroup[]): string[] {
  const lines: string[] = []
  let n = 0
  for (const group of groups) {
    if (group.section) lines.push('', group.section.toUpperCase())
    for (const item of group.items) {
      n += 1
      // Every line of a multi-line answer is indented, so it cannot read as a new numbered row.
      const indent = (text: string) => text.split(/\r?\n/).join('\n   ')
      lines.push(`${n}. ${item.question}`, `   ${indent(item.answer)}`)
      if (item.detail) lines.push(`   Details: ${indent(item.detail)}`)
    }
  }
  return lines
}
