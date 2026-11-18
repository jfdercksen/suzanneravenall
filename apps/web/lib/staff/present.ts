import type { Quiz } from '@/app/explore/quizzes/types'
import { MARKETING_CHANNEL_LABELS, type MarketingChannel } from '@/lib/consent/marketing'
import type { IntakeAnswers } from '@/lib/intake/types'
import { answerText } from '@/lib/intake/validate'
import { labelForValue } from '@/lib/quiz/scale'

/** What the staff submission pages show: plain strings, ready to render. */

const SAST = new Intl.DateTimeFormat('en-ZA', {
  timeZone: 'Africa/Johannesburg',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export const NOT_RECORDED = 'Not recorded'

/** "18 Nov 2026, 14:05 SAST", or "Not recorded". */
export function formatSast(iso: string | null | undefined): string {
  if (!iso) return NOT_RECORDED
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return NOT_RECORDED
  return `${SAST.format(date)} SAST`
}

export function personName(first: string | null | undefined, last: string | null | undefined, fallback: string): string {
  const name = [first, last].map((p) => (p ?? '').trim()).filter(Boolean).join(' ')
  return name || fallback
}

export interface MarketingFields {
  marketing_opt_in: boolean | null
  marketing_channels: MarketingChannel[] | null
  marketing_choice_at: string | null
}

/** "Opted in: Email, SMS", "Not opted in", or "No choice recorded" (rows from before 18 Nov). */
export function marketingChoiceText(row: MarketingFields): string {
  if (!row.marketing_choice_at) return 'No choice recorded'
  const channels = (row.marketing_channels ?? []).filter((c): c is MarketingChannel => c in MARKETING_CHANNEL_LABELS)
  if (!row.marketing_opt_in || channels.length === 0) return 'Not opted in'
  return `Opted in: ${channels.map((c) => MARKETING_CHANNEL_LABELS[c]).join(', ')}`
}

export interface AnswerRow {
  question: string
  answer: string
  detail?: string
}

export interface AnswerGroup {
  section: string | null
  items: AnswerRow[]
}

/**
 * Quiz answers in question order, with the question text and the scale label.
 * The text is the quiz's current wording (the answers store only question ids
 * and scale values). Answers to ids the quiz no longer has are listed last.
 */
export function quizAnswerRows(quiz: Quiz | undefined, answers: Record<string, number> | null): AnswerRow[] {
  const given = answers ?? {}
  const scale = (value: unknown): string =>
    typeof value === 'number' ? `${labelForValue(value)} (${value} of 4)` : 'Not answered'
  if (!quiz) {
    return Object.entries(given).map(([id, value]) => ({ question: `Question ${id}`, answer: scale(value) }))
  }
  const known = new Set(quiz.questions.map((q) => String(q.id)))
  const rows = quiz.questions.map((q) => ({ question: q.text, answer: scale(given[String(q.id)]) }))
  for (const [id, value] of Object.entries(given)) {
    if (!known.has(id)) rows.push({ question: `Question ${id} (no longer in this diagnostic)`, answer: scale(value) })
  }
  return rows
}

/** Intake answers grouped under their headings, with the question wording as it was when answered. */
export function intakeAnswerGroups(answers: IntakeAnswers | null): AnswerGroup[] {
  const groups: AnswerGroup[] = []
  for (const item of answers?.items ?? []) {
    const section = item.section?.trim() || null
    let group = groups[groups.length - 1]
    if (!group || group.section !== section) {
      group = { section, items: [] }
      groups.push(group)
    }
    const text = answerText(item)
    group.items.push({
      question: item.label,
      answer: text === '' ? 'Not answered' : text,
      ...(item.detail?.trim() ? { detail: item.detail.trim() } : {}),
    })
  }
  return groups
}
