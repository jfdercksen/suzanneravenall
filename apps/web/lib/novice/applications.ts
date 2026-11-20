import type { SupabaseClient } from '@supabase/supabase-js'
import { membershipBySku, type MembershipLevel } from '@suzanne/integrations'
import { activateLevel } from '@/lib/memberships/activate'

/**
 * Novice applications (Suzanne, 19 Nov 2026): a member pays for a Novice
 * level, the store opens an application (order-placed), the member uploads
 * what the pathway asks for at /portal/novice and sends it, the team reviews
 * it at /staff/novice and approves it or asks for more. Access as a Novice
 * starts on approval, for a year. Table and log: supabase/migrations/
 * 20261120090000_membership_levels.sql. Every function here takes the
 * service-role client: the caller has already checked who is asking.
 */

export const NOVICE_BUCKET = 'novice-applications'

/** Per file. Recordings can be long; the Storage server's own limit (FILE_SIZE_LIMIT on aimate-db1) also applies. */
export const MAX_FILE_BYTES = 500 * 1024 * 1024
export const MAX_FILES = 60

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/heic',
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'video/mp4',
  'video/quicktime',
  'video/webm',
] as const

/** The file endings each type may carry, so a file named "certificate.pdf" really is a PDF to the team's computer. */
export const EXTENSIONS_BY_TYPE: Record<(typeof ALLOWED_FILE_TYPES)[number], string[]> = {
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.ms-excel': ['xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  'text/csv': ['csv'],
  'text/plain': ['txt'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/heic': ['heic'],
  'audio/mpeg': ['mp3'],
  'audio/mp4': ['m4a', 'mp4'],
  'audio/x-m4a': ['m4a'],
  'audio/wav': ['wav'],
  'video/mp4': ['mp4'],
  'video/quicktime': ['mov'],
  'video/webm': ['webm'],
}

/** True when the file name ends in an ending allowed for its type. */
export function nameMatchesType(name: string, type: string): boolean {
  const ext = name.toLowerCase().split('.').pop() ?? ''
  const allowed = (EXTENSIONS_BY_TYPE as Record<string, string[] | undefined>)[type]
  return !!allowed && name.includes('.') && allowed.includes(ext)
}

/** Objects in an application's folder, registered or not: caps the signed uploads handed out. */
export const MAX_STORED_OBJECTS = MAX_FILES * 2

export type NoviceStatus = 'awaiting_documents' | 'submitted' | 'changes_requested' | 'approved'

/** How the team's screens name a status. */
export const STATUS_LABEL: Record<NoviceStatus, string> = {
  awaiting_documents: 'Waiting for documents',
  submitted: 'Ready to review',
  changes_requested: 'Sent back to the member',
  approved: 'Approved',
}

export interface NoviceFile {
  path: string
  name: string
  size: number
  type: string
  uploaded_at: string
}

export interface NoviceApplication {
  id: string
  user_id: string | null
  email: string
  first_name: string | null
  sku: string
  medusa_order_id: string
  status: NoviceStatus
  files: NoviceFile[]
  submitted_at: string | null
  reviewed_at: string | null
  reviewer_email: string | null
  reviewer_note: string | null
  approved_at: string | null
  created_at: string
}

const COLUMNS =
  'id, user_id, email, first_name, sku, medusa_order_id, status, files, submitted_at, reviewed_at, reviewer_email, reviewer_note, approved_at, created_at'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isApplicationId(id: string): boolean {
  return UUID_RE.test(id)
}

export function levelOf(app: Pick<NoviceApplication, 'sku'>): MembershipLevel | undefined {
  return membershipBySku(app.sku)
}

/** The member may add files and send while the team has nothing to review. */
export function canUpload(app: Pick<NoviceApplication, 'status'>): boolean {
  return app.status === 'awaiting_documents' || app.status === 'changes_requested'
}

/** A file name safe as a Storage key: letters, digits, dot, dash, underscore; at most 100 characters. */
export function safeFileName(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+/, '')
  return (base || 'file').slice(-100)
}

export function storagePathFor(appId: string, name: string, now: Date = new Date()): string {
  return `${appId}/${now.getTime()}-${safeFileName(name)}`
}

export interface MemberIdentity {
  id: string
  email?: string | null
  email_confirmed_at?: string | null
}

/**
 * The member's applications, newest first. An application opened for a buyer
 * who had no account at checkout is claimed here, but only by a CONFIRMED
 * email: an unconfirmed sign-up with someone else's address claims nothing.
 */
export async function memberApplications(admin: SupabaseClient, user: MemberIdentity): Promise<NoviceApplication[]> {
  if (user.email && user.email_confirmed_at) {
    const { error: claimError } = await admin
      .from('novice_applications')
      .update({ user_id: user.id })
      .is('user_id', null)
      .ilike('email', user.email.replace(/[\\%_*]/g, (c) => `\\${c}`))
    // Not fatal: the list below still shows what is already theirs.
    if (claimError) console.error(`[novice] claim by email failed: ${claimError.message}`)
  }
  const { data, error } = await admin
    .from('novice_applications')
    .select(COLUMNS)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`novice applications read: ${error.message}`)
  return (data ?? []) as NoviceApplication[]
}

/** One application of this member, or null (not theirs, or no such id). */
export async function memberApplication(admin: SupabaseClient, userId: string, id: string): Promise<NoviceApplication | null> {
  if (!isApplicationId(id)) return null
  const { data, error } = await admin.from('novice_applications').select(COLUMNS).eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) throw new Error(`novice application read: ${error.message}`)
  return (data as NoviceApplication | null) ?? null
}

export type EventAction = 'uploaded' | 'submitted' | 'viewed' | 'approved' | 'changes_requested'

export async function logEvent(
  admin: SupabaseClient,
  event: { application_id: string; actor_type: 'member' | 'staff'; actor_id: string; actor_email?: string | null; action: EventAction; detail?: string | null },
): Promise<boolean> {
  const { error } = await admin.from('novice_application_events').insert({
    application_id: event.application_id,
    actor_type: event.actor_type,
    actor_id: event.actor_id,
    actor_email: event.actor_email ?? null,
    action: event.action,
    detail: event.detail ?? null,
  })
  return !error
}

/** The private bucket, created on first use (the invoices bucket works the same way). */
export async function ensureBucket(admin: SupabaseClient): Promise<void> {
  const { error } = await admin.storage.createBucket(NOVICE_BUCKET, {
    public: false,
    fileSizeLimit: MAX_FILE_BYTES,
    allowedMimeTypes: [...ALLOWED_FILE_TYPES],
  })
  if (error && !/already exists|duplicate/i.test(error.message)) throw new Error(`bucket: ${error.message}`)
}

/** How many objects the application's folder holds, registered or not (null when Storage cannot say). */
export async function storedObjectCount(admin: SupabaseClient, appId: string): Promise<number | null> {
  const { data, error } = await admin.storage.from(NOVICE_BUCKET).list(appId, { limit: MAX_STORED_OBJECTS + 1 })
  if (error) return null
  return (data ?? []).length
}

/** Records a file the member has just uploaded, after checking it is really in Storage under this application. */
export async function addFile(
  admin: SupabaseClient,
  app: NoviceApplication,
  file: { path: string; name: string; size: number; type: string },
): Promise<{ ok: true; files: NoviceFile[] } | { ok: false; reason: string }> {
  if (!canUpload(app)) return { ok: false, reason: 'closed' }
  if (!file.path.startsWith(`${app.id}/`) || file.path.includes('..')) return { ok: false, reason: 'path' }
  if (app.files.length >= MAX_FILES) return { ok: false, reason: 'too-many' }
  if (app.files.some((f) => f.path === file.path)) return { ok: true, files: app.files }

  const objectName = file.path.slice(app.id.length + 1)
  const { data: listed, error: listError } = await admin.storage.from(NOVICE_BUCKET).list(app.id, { search: objectName, limit: 5 })
  if (listError) return { ok: false, reason: 'storage' }
  const stored = (listed ?? []).find((o) => o.name === objectName)
  if (!stored) return { ok: false, reason: 'missing' }
  // Trust what Storage holds, not what the browser says it sent.
  const meta = (stored as { metadata?: { size?: number; mimetype?: string } | null }).metadata ?? {}
  if (typeof meta.size === 'number' && meta.size !== file.size) return { ok: false, reason: 'mismatch' }
  if (typeof meta.mimetype === 'string' && meta.mimetype !== file.type) return { ok: false, reason: 'mismatch' }
  if (!nameMatchesType(file.name, file.type)) return { ok: false, reason: 'mismatch' }

  const files: NoviceFile[] = [...app.files, { ...file, uploaded_at: new Date().toISOString() }]
  const { error } = await admin.from('novice_applications').update({ files }).eq('id', app.id).in('status', ['awaiting_documents', 'changes_requested'])
  if (error) return { ok: false, reason: 'write' }
  return { ok: true, files }
}

/** Sends the application to the team. Needs at least one file. */
export async function submitApplication(admin: SupabaseClient, app: NoviceApplication): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!canUpload(app)) return { ok: false, reason: 'closed' }
  if (app.files.length === 0) return { ok: false, reason: 'no-files' }
  const { data, error } = await admin
    .from('novice_applications')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', app.id)
    .in('status', ['awaiting_documents', 'changes_requested'])
    .select('id')
  if (error) return { ok: false, reason: 'write' }
  if (!data || data.length === 0) return { ok: false, reason: 'closed' }
  return { ok: true }
}

// ── Staff ────────────────────────────────────────────────────────────────────

/** Every open application: sent ones first (oldest first, so nobody waits longest), then those still waiting on the member. */
export async function staffApplications(admin: SupabaseClient): Promise<NoviceApplication[]> {
  const { data, error } = await admin
    .from('novice_applications')
    .select(COLUMNS)
    .in('status', ['submitted', 'awaiting_documents', 'changes_requested'])
    .order('submitted_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) throw new Error(`novice applications read: ${error.message}`)
  const rows = (data ?? []) as NoviceApplication[]
  return [...rows.filter((r) => r.status === 'submitted'), ...rows.filter((r) => r.status !== 'submitted')]
}

export async function staffApplication(admin: SupabaseClient, id: string): Promise<NoviceApplication | null> {
  if (!isApplicationId(id)) return null
  const { data, error } = await admin.from('novice_applications').select(COLUMNS).eq('id', id).maybeSingle()
  if (error) throw new Error(`novice application read: ${error.message}`)
  return (data as NoviceApplication | null) ?? null
}

export type DecisionResult =
  | { ok: true; status: 'approved'; endDate: string }
  | { ok: true; status: 'changes_requested' }
  | { ok: false; reason: 'not-submitted' | 'no-account' | 'unknown-level' | 'activation' | 'write' | 'note-required'; detail?: string }

/**
 * The team's decision on a sent application. Approve: the member becomes
 * active on the Novice level for a year from now, then the application is
 * marked approved. Changes: the application goes back to the member with the
 * team's note. Only a sent application can be decided, so two team members
 * clicking at once cannot both act (conditional update on status).
 */
export async function decideApplication(
  admin: SupabaseClient,
  app: NoviceApplication,
  decision: 'approve' | 'changes',
  note: string,
  reviewerEmail: string,
  now: Date = new Date(),
): Promise<DecisionResult> {
  if (app.status !== 'submitted') return { ok: false, reason: 'not-submitted' }
  const trimmed = note.trim()

  if (decision === 'changes') {
    if (!trimmed) return { ok: false, reason: 'note-required' }
    const { data, error } = await admin
      .from('novice_applications')
      .update({ status: 'changes_requested', reviewed_at: now.toISOString(), reviewer_email: reviewerEmail, reviewer_note: trimmed })
      .eq('id', app.id)
      .eq('status', 'submitted')
      .select('id')
    if (error) return { ok: false, reason: 'write', detail: error.message }
    if (!data || data.length === 0) return { ok: false, reason: 'not-submitted' }
    return { ok: true, status: 'changes_requested' }
  }

  const level = levelOf(app)
  if (!level) return { ok: false, reason: 'unknown-level' }
  if (!app.user_id) return { ok: false, reason: 'no-account' }

  // Access first, then the status: if the process stops in between, the
  // application is still 'submitted' and the team simply approves again
  // (activateLevel rewrites the same row). Two clicks at once both write the
  // same access; only one marks the application approved.
  const activated = await activateLevel(admin, app.user_id, level, now)
  if (!activated.ok) return { ok: false, reason: 'activation', detail: activated.error }

  const { data: claimed, error: claimError } = await admin
    .from('novice_applications')
    .update({ status: 'approved', reviewed_at: now.toISOString(), approved_at: now.toISOString(), reviewer_email: reviewerEmail, reviewer_note: trimmed || null })
    .eq('id', app.id)
    .eq('status', 'submitted')
    .select('id')
  if (claimError) return { ok: false, reason: 'write', detail: claimError.message }
  if (!claimed || claimed.length === 0) return { ok: false, reason: 'not-submitted' }
  return { ok: true, status: 'approved', endDate: activated.endDate }
}
