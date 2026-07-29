-- =============================================================================
-- Migration: 20260729120000_quiz_subscribers
-- Description: Leads captured at the Explore diagnostic quiz gate (first
--              name, last name, email) before taking a quiz, carried through
--              to their stored answers + computed result on completion.
-- Created: 2026-07-29
-- =============================================================================

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.quiz_subscribers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_slug      TEXT NOT NULL,
  first_name     TEXT NOT NULL,
  last_name      TEXT NOT NULL,
  email          TEXT NOT NULL,
  access_token   TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'started', 'completed')),
  answers        JSONB,
  result_key     TEXT,
  email_sent_at  TIMESTAMPTZ,
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT quiz_subscribers_email_quiz_unique UNIQUE (email, quiz_slug)
);

CREATE UNIQUE INDEX IF NOT EXISTS quiz_subscribers_access_token_idx
  ON public.quiz_subscribers (access_token);
CREATE INDEX IF NOT EXISTS quiz_subscribers_email_idx
  ON public.quiz_subscribers (email);
CREATE INDEX IF NOT EXISTS quiz_subscribers_quiz_slug_idx
  ON public.quiz_subscribers (quiz_slug);

COMMENT ON TABLE public.quiz_subscribers IS
  'Leads captured at the Explore quiz gate before taking a diagnostic quiz, carried through to their stored answers + result on completion. There is no auth.uid() for these rows — quiz takers never sign in. Write access is intentionally service-role only, from /api/quiz/subscribe and /api/quiz/complete. The access_token column, not the row id, identifies a returning quiz-taker and is verified server-side before any quiz content renders. Never add INSERT/UPDATE/DELETE/SELECT policies for anon/authenticated roles.';

ALTER TABLE public.quiz_subscribers ENABLE ROW LEVEL SECURITY;

-- Deliberately NO policies for anon/authenticated — deny by default. All
-- access is via the service-role client from server routes (see
-- apps/web/lib/quiz/subscriber.ts), since there is no auth.uid() to scope to.

CREATE TRIGGER quiz_subscribers_updated_at
  BEFORE UPDATE ON public.quiz_subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- DOWN
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS quiz_subscribers_updated_at ON public.quiz_subscribers;
-- DROP INDEX IF EXISTS quiz_subscribers_quiz_slug_idx;
-- DROP INDEX IF EXISTS quiz_subscribers_email_idx;
-- DROP INDEX IF EXISTS quiz_subscribers_access_token_idx;
-- DROP TABLE IF EXISTS public.quiz_subscribers;
