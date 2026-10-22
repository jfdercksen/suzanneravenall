/**
 * Intake forms (H-12): the shapes shared by the page, the routes and the
 * mails. A form comes from the Payload intake-forms collection; the answers
 * live in Supabase intake_submissions.
 */

export const INTAKE_FIELD_TYPES = [
  'heading',
  'text',
  'textarea',
  'email',
  'date',
  'select',
  'checkbox-group',
  'scale',
] as const

export type IntakeFieldType = (typeof INTAKE_FIELD_TYPES)[number]

export interface IntakeField {
  /** Payload's array row id: stable across edits, so answers key on it. */
  id: string
  type: IntakeFieldType
  label: string
  helpText: string | null
  options: string[]
  required: boolean
  withDetail: boolean
}

export interface IntakeService {
  productHandle: string
  label: string
  introduction: string | null
}

export interface IntakeForm {
  id: string
  formKey: string
  title: string
  active: boolean
  isDefault: boolean
  services: IntakeService[]
  intro: string | null
  acknowledgement: string | null
  fields: IntakeField[]
  recipientEmail: string | null
}

/** One answered question, with the question's wording as it was when answered. */
export interface IntakeAnswer {
  fieldId: string
  type: Exclude<IntakeFieldType, 'heading'>
  label: string
  /** Text for text-like fields, the chosen options for checkbox-group, '' when skipped. */
  value: string | string[]
  detail?: string
  /** The heading this question sat under, for the team mail's layout. */
  section?: string
}

export interface IntakeAnswers {
  acknowledged: boolean
  items: IntakeAnswer[]
}

export type IntakeStatus = 'pending' | 'completed' | 'cancelled'

export interface IntakeRecord {
  id: string
  token: string
  order_id: string
  order_display_id: string | null
  customer_email: string
  first_name: string | null
  last_name: string | null
  service_key: string
  service_name: string
  form_id: string
  form_key: string | null
  purchased_at: string
  /** Every purchased variant of the service is in-person: the mail has no Zoom link. */
  in_person: boolean
  status: IntakeStatus
  intake_sent_at: string | null
  reminders_sent: number
  next_reminder_at: string | null
  last_reminder_at: string | null
  expires_at: string
  answers: IntakeAnswers | null
  completed_at: string | null
  cancelled_at: string | null
  team_notified_at: string | null
  send_failures: number
  created_at: string
}
