import { randomBytes } from 'crypto'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface QuizSubscriberRow {
  id: string
  quiz_slug: string
  first_name: string
  last_name: string
  email: string
  access_token: string
  status: 'pending' | 'started' | 'completed'
  answers: Record<string, number> | null
  result_key: string | null
  email_sent_at: string | null
  created_at: string
  updated_at: string
}

// Access tokens are the sole credential for this table (no auth.uid()) — cap
// how long an emailed link stays valid so a leaked/forwarded link doesn't
// grant indefinite access to someone's stored quiz answers (PII, POPIA).
const TOKEN_TTL_DAYS = 30

/**
 * Service-role Supabase client for quiz-subscriber writes. Quiz-takers never
 * have a Supabase Auth session — there is no auth.uid() to scope RLS to — so
 * this bypasses RLS entirely, same pattern as
 * apps/web/app/api/auth/signup-sync/route.ts. Never expose this client or
 * the underlying key to the browser.
 *
 * Returns null when required env vars are missing so callers can fail loudly
 * (500 "Server configuration error") rather than silently degrade.
 */
export function getServiceRoleClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return null

  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  })
}

function generateAccessToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Creates or refreshes a quiz-subscriber row for this email + quiz. A retake
 * resets progress (answers/result/status) to a fresh 'pending' cycle rather
 * than accumulating duplicate rows, and issues a new access token so a stale
 * emailed link can't be reused against reset data.
 */
export async function upsertSubscriber(
  supabase: SupabaseClient,
  input: { quizSlug: string; firstName: string; lastName: string; email: string }
): Promise<{ id: string; accessToken: string }> {
  const accessToken = generateAccessToken()

  const { data, error } = await supabase
    .from('quiz_subscribers')
    .upsert(
      {
        quiz_slug: input.quizSlug,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        access_token: accessToken,
        status: 'pending',
        answers: null,
        result_key: null,
        email_sent_at: null,
        started_at: null,
        completed_at: null,
      },
      { onConflict: 'email,quiz_slug' }
    )
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`[quiz] upsertSubscriber failed: ${error?.message ?? 'unknown error'}`)
  }

  return { id: data.id as string, accessToken }
}

export async function markEmailSent(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from('quiz_subscribers')
    .update({ email_sent_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`[quiz] markEmailSent failed: ${error.message}`)
}

export async function getSubscriberByToken(
  supabase: SupabaseClient,
  quizSlug: string,
  token: string
): Promise<QuizSubscriberRow | null> {
  const { data, error } = await supabase
    .from('quiz_subscribers')
    .select('*')
    .eq('quiz_slug', quizSlug)
    .eq('access_token', token)
    .maybeSingle()

  if (error) throw new Error(`[quiz] getSubscriberByToken failed: ${error.message}`)
  const row = (data as QuizSubscriberRow | null) ?? null
  if (!row) return null

  // Treat an expired token identically to "not found" — don't leak whether
  // a token ever existed. Tokens issued before an invite email was sent
  // (email_sent_at null) haven't started their TTL clock yet.
  if (row.email_sent_at) {
    const ageMs = Date.now() - new Date(row.email_sent_at).getTime()
    if (ageMs > TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000) return null
  }

  return row
}

export async function markStarted(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from('quiz_subscribers')
    .update({ status: 'started', started_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`[quiz] markStarted failed: ${error.message}`)
}

export async function markCompleted(
  supabase: SupabaseClient,
  id: string,
  answers: Record<string, number>,
  resultKey: string
): Promise<void> {
  const { error } = await supabase
    .from('quiz_subscribers')
    .update({
      status: 'completed',
      answers,
      result_key: resultKey,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(`[quiz] markCompleted failed: ${error.message}`)
}
