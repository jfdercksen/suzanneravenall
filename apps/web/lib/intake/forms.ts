import { INTAKE_FIELD_TYPES, type IntakeField, type IntakeFieldType, type IntakeForm, type IntakeService } from './types'

/**
 * The intake forms from the Payload CMS (collection intake-forms), read over
 * the internal network. Payload runs under basePath /cms, so the REST API is
 * at http://payload:3001/cms/api. PAYLOAD_INTERNAL_URL overrides it (local dev).
 */

export function payloadBaseUrl(): string {
  return (process.env.PAYLOAD_INTERNAL_URL || 'http://payload:3001/cms').replace(/\/+$/, '')
}

function str(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function isFieldType(value: unknown): value is IntakeFieldType {
  return typeof value === 'string' && (INTAKE_FIELD_TYPES as readonly string[]).includes(value)
}

function toField(raw: unknown, index: number): IntakeField | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const label = str(row.label)
  if (!label || !isFieldType(row.type)) return null
  const options = (str(row.options) ?? '')
    .split(/\r?\n/)
    .map((o) => o.trim())
    .filter(Boolean)
  return {
    id: str(row.id) ?? `field-${index}`,
    type: row.type,
    label,
    helpText: str(row.helpText),
    options,
    required: row.required === true,
    withDetail: row.withDetail === true,
  }
}

function toService(raw: unknown): IntakeService | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const productHandle = str(row.productHandle)
  const label = str(row.label)
  if (!productHandle || !label) return null
  return { productHandle, label, introduction: str(row.introduction) }
}

/** A Payload document as the page and routes use it; null when it is unusable. */
export function toIntakeForm(raw: unknown): IntakeForm | null {
  if (!raw || typeof raw !== 'object') return null
  const doc = raw as Record<string, unknown>
  const id = doc.id
  const formKey = str(doc.formKey)
  const title = str(doc.title)
  if ((typeof id !== 'string' && typeof id !== 'number') || !formKey || !title) return null
  const fields = (Array.isArray(doc.fields) ? doc.fields : [])
    .map(toField)
    .filter((f): f is IntakeField => f !== null)
  // A choice question without choices cannot be answered: drop it rather than block the form.
  const usable = fields.filter((f) => (f.type === 'select' || f.type === 'checkbox-group' ? f.options.length > 0 : true))
  return {
    id: String(id),
    formKey,
    title,
    active: doc.active !== false,
    isDefault: doc.isDefault === true,
    services: (Array.isArray(doc.services) ? doc.services : []).map(toService).filter((s): s is IntakeService => s !== null),
    intro: str(doc.intro),
    acknowledgement: str(doc.acknowledgement),
    fields: usable,
    recipientEmail: str(doc.recipientEmail),
  }
}

/** Every intake form. Throws when Payload cannot be read, so callers retry rather than skip. */
export async function fetchIntakeForms(fetchImpl: typeof fetch = fetch): Promise<IntakeForm[]> {
  const res = await fetchImpl(`${payloadBaseUrl()}/api/intake-forms?limit=100&depth=0&sort=createdAt`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Payload intake-forms answered HTTP ${res.status}`)
  const body = (await res.json()) as { docs?: unknown[] }
  return (body.docs ?? []).map(toIntakeForm).filter((f): f is IntakeForm => f !== null)
}

/** One form by its Payload id; null when it was deleted. Throws when Payload cannot be read. */
export async function fetchIntakeForm(id: string, fetchImpl: typeof fetch = fetch): Promise<IntakeForm | null> {
  const res = await fetchImpl(`${payloadBaseUrl()}/api/intake-forms/${encodeURIComponent(id)}?depth=0`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Payload intake-forms/${id} answered HTTP ${res.status}`)
  return toIntakeForm(await res.json())
}

export interface FormChoice {
  form: IntakeForm
  serviceName: string
  introduction: string | null
}

/**
 * The form for one purchased product: the first active form (oldest first)
 * that lists its handle; else, for a private session or a product listed on
 * an inactive form (a placeholder such as Group Family Coaching), the active
 * default form; else none (not a service that takes an intake form).
 */
export function chooseForm(
  forms: IntakeForm[],
  line: { handle: string; title: string; session: boolean },
): FormChoice | null {
  for (const form of forms) {
    if (!form.active) continue
    const service = form.services.find((s) => s.productHandle === line.handle)
    if (service) return { form, serviceName: service.label, introduction: service.introduction }
  }
  const onInactiveForm = forms.some((f) => !f.active && f.services.some((s) => s.productHandle === line.handle))
  if (!line.session && !onInactiveForm) return null
  const fallback = forms.find((f) => f.active && f.isDefault)
  return fallback ? { form: fallback, serviceName: line.title, introduction: null } : null
}

/** The per-service introduction for a record's product, from the form as it is now. */
export function serviceIntroduction(form: IntakeForm, productHandle: string): string | null {
  return form.services.find((s) => s.productHandle === productHandle)?.introduction ?? null
}
