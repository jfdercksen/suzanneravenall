import { VtigerError, vtqlString, type VtigerClient, type VtigerRecord } from './vtiger'

/**
 * Website lead -> Vtiger, ported from infra/n8n/workflows/lead-magnet-to-vtiger.json
 * as fixed in 86ea858 (KI054). Same module (Contacts), same dedupe (by email),
 * same fields, same Event. Deliberate differences, all listed in the package
 * README: existing contacts are changed with `revise` (partial) instead of a
 * replacing `update`; the Event description carries the quiz result when
 * there is one; Event date and time are both UTC.
 */

export type LeadInput = {
  email: string
  firstName?: string | null
  lastName?: string | null
  /** Form source tag, for example "masterclass", "community", "homepage". */
  source: string
  quizResult?: string | null
}

export type LeadSyncResult = {
  contactId: string
  eventId: string
  /** True when a new contact was created, false when an existing one was updated. */
  created: boolean
}

export const LEAD_SOURCE = 'Lead Magnet'
export const NEW_LEAD_STAGE = 'New Lead'

/** Values normalised exactly as the n8n "Prepare: Extract Submission Data" node did. */
export function normaliseLead(lead: LeadInput) {
  const email = lead.email.toLowerCase().trim()
  const firstName = lead.firstName || email.split('@')[0] || email
  const lastName = lead.lastName ?? ''
  const source = lead.source || LEAD_SOURCE
  return { email, firstName, lastName, source, quizResult: lead.quizResult ?? null }
}

export function findContactQuery(email: string): string {
  return `SELECT * FROM Contacts WHERE email='${vtqlString(email)}' LIMIT 1;`
}

/** n8n "Prepare: New Contact Payload". */
export function newContactElement(lead: ReturnType<typeof normaliseLead>, userId: string) {
  return {
    email: lead.email,
    firstname: lead.firstName,
    lastname: lead.lastName || lead.firstName, // Vtiger: lastname is mandatory
    assigned_user_id: userId,
    leadsource: LEAD_SOURCE,
    cf_pipeline_stage: NEW_LEAD_STAGE,
  }
}

/** n8n "Prepare: Update Existing Contact": mandatory fields travel along, lead source only if blank. */
export function existingContactElement(
  existing: VtigerRecord,
  lead: ReturnType<typeof normaliseLead>,
  userId: string,
): VtigerRecord {
  const str = (v: unknown) => (typeof v === 'string' ? v : undefined)
  return {
    id: existing.id,
    assigned_user_id: str(existing.assigned_user_id) ?? userId,
    firstname: str(existing.firstname) ?? lead.firstName,
    lastname: str(existing.lastname) || lead.lastName || lead.firstName,
    email: str(existing.email) ?? lead.email,
    leadsource: str(existing.leadsource) || LEAD_SOURCE,
  }
}

/** n8n "Prepare: Activity Payload" (an Event, KI054 e), plus the quiz result. */
export function leadEventElement(
  lead: ReturnType<typeof normaliseLead>,
  contactId: string,
  userId: string,
  now: Date,
) {
  const iso = now.toISOString()
  const day = iso.slice(0, 10)
  const time = iso.slice(11, 19)
  const quiz = lead.quizResult ? `. Quiz result: ${lead.quizResult}` : ''
  return {
    activitytype: 'Call',
    subject: `Website form - ${lead.source}`.slice(0, 255),
    description: `Source: ${lead.source}. Email: ${lead.email}${quiz}`,
    assigned_user_id: userId,
    contact_id: contactId,
    date_start: day,
    time_start: time,
    due_date: day,
    time_end: time,
    duration_hours: '0',
    duration_minutes: '15',
    eventstatus: 'Held',
  }
}

const REVISE_UNSUPPORTED = new Set(['UNKNOWN_OPERATION', 'OPERATION_NOT_SUPPORTED', 'INVALID_OPERATION'])

/**
 * Finds the contact by email, creates or updates it, then logs one Event.
 * Throws on any Vtiger failure; the caller decides what that means.
 */
export async function syncLeadToVtiger(
  client: VtigerClient,
  input: LeadInput,
  opts: { now?: Date; signal?: AbortSignal } = {},
): Promise<LeadSyncResult> {
  const lead = normaliseLead(input)
  const call = { signal: opts.signal }
  const userId = await client.userId(call)

  const [existing] = await client.query<VtigerRecord>(findContactQuery(lead.email), call)

  let contactId: string
  let created: boolean
  if (existing && typeof existing.id === 'string') {
    const element = existingContactElement(existing, lead, userId)
    try {
      contactId = (await client.revise(element, call)).id
    } catch (err) {
      if (!(err instanceof VtigerError) || !REVISE_UNSUPPORTED.has(err.code)) throw err
      // Instance without `revise`: read-merge-update, so no field is dropped.
      contactId = (await client.update({ ...existing, ...element }, call)).id
    }
    created = false
  } else {
    contactId = (await client.create('Contacts', newContactElement(lead, userId), call)).id
    created = true
  }

  const event = await client.create('Events', leadEventElement(lead, contactId, userId, opts.now ?? new Date()), call)
  return { contactId, eventId: event.id, created }
}
