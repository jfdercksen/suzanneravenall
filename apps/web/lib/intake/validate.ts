import type { IntakeAnswer, IntakeAnswers, IntakeField, IntakeForm } from './types'

/**
 * Checks a submitted intake form against the form definition. Used by the
 * page (to show errors before sending) and by the submit route (the real
 * check). Pure, so both sides run the same rules.
 */

export const MAX_TEXT = 500
export const MAX_TEXTAREA = 5_000
export const MAX_DETAIL = 2_000

export interface RawAnswer {
  value?: unknown
  detail?: unknown
}

export interface IntakeSubmission {
  acknowledged?: unknown
  answers?: Record<string, RawAnswer | undefined>
}

export type ValidationResult =
  | { ok: true; answers: IntakeAnswers }
  | { ok: false; errors: Record<string, string> }

/** The key the acknowledgement error is reported under. */
export const ACKNOWLEDGEMENT_KEY = 'acknowledgement'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isRealDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(Date.UTC(y, mo - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d && y >= 1900
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function checkField(field: IntakeField, raw: RawAnswer | undefined): { value: string | string[]; error?: string } {
  if (field.type === 'checkbox-group') {
    const picked = Array.isArray(raw?.value) ? raw.value.filter((v): v is string => typeof v === 'string') : []
    const unique = field.options.filter((o) => picked.includes(o))
    if (unique.length !== new Set(picked).size) return { value: unique, error: 'Please choose from the options shown.' }
    if (field.required && unique.length === 0) return { value: unique, error: 'Please tick at least one.' }
    return { value: unique }
  }

  const value = asText(raw?.value)
  if (value === '') return field.required ? { value, error: 'This question is required.' } : { value }

  switch (field.type) {
    case 'text':
      return value.length > MAX_TEXT ? { value, error: `Please keep this under ${MAX_TEXT} characters.` } : { value }
    case 'textarea':
      return value.length > MAX_TEXTAREA ? { value, error: `Please keep this under ${MAX_TEXTAREA} characters.` } : { value }
    case 'email':
      return EMAIL_RE.test(value) && value.length <= 254 ? { value } : { value, error: 'Please enter a valid email address.' }
    case 'date':
      return isRealDate(value) ? { value } : { value, error: 'Please enter a valid date.' }
    case 'select':
      return field.options.includes(value) ? { value } : { value, error: 'Please choose from the options shown.' }
    case 'scale': {
      const n = Number(value)
      return Number.isInteger(n) && n >= 1 && n <= 10 ? { value: String(n) } : { value, error: 'Please choose a number from 1 to 10.' }
    }
    default:
      return { value }
  }
}

export function validateSubmission(form: IntakeForm, submission: IntakeSubmission): ValidationResult {
  const errors: Record<string, string> = {}
  const items: IntakeAnswer[] = []
  const answers = submission.answers && typeof submission.answers === 'object' ? submission.answers : {}
  let section: string | undefined

  for (const field of form.fields) {
    if (field.type === 'heading') {
      section = field.label
      continue
    }
    const raw = Object.hasOwn(answers, field.id) ? answers[field.id] : undefined
    const { value, error } = checkField(field, raw)
    if (error) errors[field.id] = error

    const detail = field.withDetail ? asText(raw?.detail) : ''
    if (detail.length > MAX_DETAIL) errors[field.id] = `Please keep the details under ${MAX_DETAIL} characters.`

    items.push({
      fieldId: field.id,
      type: field.type,
      label: field.label,
      value,
      ...(detail ? { detail } : {}),
      ...(section ? { section } : {}),
    })
  }

  const acknowledged = submission.acknowledged === true
  if (form.acknowledgement && !acknowledged) errors[ACKNOWLEDGEMENT_KEY] = 'Please tick to confirm you have read this.'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, answers: { acknowledged: Boolean(form.acknowledgement) && acknowledged, items } }
}

/** An answer as one line of text, for the team mail. */
export function answerText(answer: IntakeAnswer): string {
  const main = Array.isArray(answer.value) ? answer.value.join(', ') : answer.value
  if (answer.type === 'scale' && main) return `${main} / 10`
  return main
}
