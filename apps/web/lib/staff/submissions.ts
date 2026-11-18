import type { SupabaseClient } from '@supabase/supabase-js'
import type { MarketingChannel } from '@/lib/consent/marketing'
import type { IntakeAnswers } from '@/lib/intake/types'
import type { StaffViewer } from './payload-session'

/**
 * Read-only access to the quiz and intake submissions for /staff/submissions
 * (KI125), with the service role (both tables have no RLS policies by design).
 * Nothing here writes to the submissions: the only write is the access log,
 * one row in public.staff_submission_views per opened submission
 * (supabase/migrations/20261118140000_staff_submission_views.sql), written
 * BEFORE the answers are shown. If that write fails, no answers are shown.
 *
 * Secrets are never selected: not quiz_subscribers.access_token, not
 * intake_submissions.token.
 */

export const SUBMISSION_TYPES = ['quiz', 'intake'] as const
export type SubmissionType = (typeof SUBMISSION_TYPES)[number]

export const VIEW_LOG_TABLE = 'staff_submission_views'
export const PAGE_SIZE = 50

const TABLE: Record<SubmissionType, string> = {
  quiz: 'quiz_subscribers',
  intake: 'intake_submissions',
}

const SEARCH_COLUMNS: Record<SubmissionType, string[]> = {
  quiz: ['first_name', 'last_name', 'email'],
  intake: ['first_name', 'last_name', 'customer_email'],
}

const LIST_COLUMNS: Record<SubmissionType, string> = {
  quiz: 'id, quiz_slug, first_name, last_name, email, completed_at',
  intake: 'id, first_name, last_name, customer_email, service_name, order_display_id, order_id, completed_at',
}

const MARKETING_COLUMNS = 'marketing_opt_in, marketing_channels, marketing_choice_at, marketing_form_version'

const DETAIL_COLUMNS: Record<SubmissionType, string> = {
  quiz: `id, quiz_slug, first_name, last_name, email, answers, result_key, completed_at, consented_at, consent_form_version, ${MARKETING_COLUMNS}`,
  intake: `id, order_id, order_display_id, customer_email, first_name, last_name, service_name, form_key, form_version, answers, completed_at, ${MARKETING_COLUMNS}`,
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export class StaffDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StaffDataError'
  }
}

export function isSubmissionType(value: unknown): value is SubmissionType {
  return typeof value === 'string' && (SUBMISSION_TYPES as readonly string[]).includes(value)
}

export function isSubmissionId(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

/**
 * The search box: up to four words, each matched against first name, last
 * name or email (every word must match one of them, so "Jane Smith" finds
 * Jane Smith). Characters with a meaning in a PostgREST filter or a LIKE
 * pattern are dropped, so a search can never change the query's shape.
 */
export function searchTerms(q: string | undefined | null): string[] {
  if (!q) return []
  return q
    .slice(0, 100)
    .replace(/[%_*,()"'\\:]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 4)
}

export function termFilter(term: string, columns: string[]): string {
  return columns.map((column) => `${column}.ilike."%${term}%"`).join(',')
}

export function pageNumber(raw: string | undefined | null): number {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 && n <= 10_000 ? n : 1
}

export interface QuizListRow {
  id: string
  quiz_slug: string
  first_name: string
  last_name: string
  email: string
  completed_at: string | null
}

export interface IntakeListRow {
  id: string
  first_name: string | null
  last_name: string | null
  customer_email: string
  service_name: string
  order_display_id: string | null
  order_id: string
  completed_at: string | null
}

export interface SubmissionList<Row> {
  rows: Row[]
  total: number
  page: number
}

interface MarketingColumns {
  marketing_opt_in: boolean | null
  marketing_channels: MarketingChannel[] | null
  marketing_choice_at: string | null
  marketing_form_version: string | null
}

export interface QuizDetailRow extends MarketingColumns {
  id: string
  quiz_slug: string
  first_name: string
  last_name: string
  email: string
  answers: Record<string, number> | null
  result_key: string | null
  completed_at: string | null
  consented_at: string | null
  consent_form_version: string | null
}

export interface IntakeDetailRow extends MarketingColumns {
  id: string
  order_id: string
  order_display_id: string | null
  customer_email: string
  first_name: string | null
  last_name: string | null
  service_name: string
  form_key: string | null
  form_version: string | null
  answers: IntakeAnswers | null
  completed_at: string | null
}

type ListRow<T extends SubmissionType> = T extends 'quiz' ? QuizListRow : IntakeListRow
type DetailRow<T extends SubmissionType> = T extends 'quiz' ? QuizDetailRow : IntakeDetailRow

/** Completed submissions, newest first, optionally narrowed by the search box. */
export async function listSubmissions<T extends SubmissionType>(
  supabase: SupabaseClient,
  type: T,
  q: string | undefined,
  page: number,
): Promise<SubmissionList<ListRow<T>>> {
  let query = supabase
    .from(TABLE[type])
    .select(LIST_COLUMNS[type], { count: 'exact' })
    .eq('status', 'completed')
  for (const term of searchTerms(q)) {
    query = query.or(termFilter(term, SEARCH_COLUMNS[type]))
  }
  const from = (page - 1) * PAGE_SIZE
  const { data, error, count } = await query
    .order('completed_at', { ascending: false, nullsFirst: false })
    .range(from, from + PAGE_SIZE - 1)
  if (error) {
    // A page past the end (the list shrank, or a hand-edited ?page=) is
    // PostgREST's 416: show the first page rather than an error.
    if (page > 1 && (error.code === 'PGRST103' || /range not satisfiable/i.test(error.message))) {
      return listSubmissions(supabase, type, q, 1)
    }
    throw new StaffDataError(`${type} list failed: ${error.message}`)
  }
  return { rows: (data ?? []) as unknown as ListRow<T>[], total: count ?? 0, page }
}

async function getSubmission<T extends SubmissionType>(
  supabase: SupabaseClient,
  type: T,
  id: string,
): Promise<DetailRow<T> | null> {
  const { data, error } = await supabase
    .from(TABLE[type])
    .select(DETAIL_COLUMNS[type])
    .eq('id', id)
    .eq('status', 'completed')
    .maybeSingle()
  if (error) throw new StaffDataError(`${type} read failed: ${error.message}`)
  return (data as unknown as DetailRow<T> | null) ?? null
}

/** One row in the access log: who opened which submission (the time is the row's default). */
export async function logSubmissionView(
  supabase: SupabaseClient,
  viewer: StaffViewer,
  type: SubmissionType,
  id: string,
): Promise<void> {
  const { error } = await supabase.from(VIEW_LOG_TABLE).insert({
    viewer_id: viewer.id,
    viewer_email: viewer.email,
    viewer_role: viewer.role,
    submission_type: type,
    submission_id: id,
  })
  if (error) throw new StaffDataError(`access log write failed: ${error.message}`)
}

export type OpenResult<T extends SubmissionType> =
  | { status: 'ok'; row: DetailRow<T> }
  | { status: 'not-found' }
  | { status: 'log-failed'; error: unknown }

/**
 * Reads one completed submission for a staff member and logs the view first.
 * An unknown id logs nothing; a failed log write returns no row (fail closed:
 * every view that shows answers is on record).
 */
export async function openSubmission<T extends SubmissionType>(
  supabase: SupabaseClient,
  viewer: StaffViewer,
  type: T,
  id: string,
): Promise<OpenResult<T>> {
  if (!isSubmissionId(id)) return { status: 'not-found' }
  const row = await getSubmission(supabase, type, id)
  if (!row) return { status: 'not-found' }
  try {
    await logSubmissionView(supabase, viewer, type, id)
  } catch (error) {
    return { status: 'log-failed', error }
  }
  return { status: 'ok', row }
}
