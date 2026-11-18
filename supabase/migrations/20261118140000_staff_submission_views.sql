-- =============================================================================
-- Migration: 20261118140000_staff_submission_views
-- Description: Access log for the staff submissions pages (KI125, Johan's
--              brief of 18 Nov; Suzanne's POPIA rules of 8 Nov 2026 ask for
--              access logging). Every time a staff member opens one quiz or
--              intake submission at /staff/submissions/<type>/<id>, the web
--              app writes one row here BEFORE it shows the answers: who (the
--              Payload CMS account), which submission and when. If the write
--              fails, the page shows no answers.
--              Append-only: triggers refuse UPDATE, DELETE and TRUNCATE, so
--              a row cannot be changed or removed through the API, the
--              service role included.
-- Created: 2026-11-18
-- Apply on: the self-hosted Supabase on aimate-db1 (Johan), BEFORE the web
--           deploy that opens the pages (without the table every detail
--           page says the answers are unavailable). Then NOTIFY pgrst.
-- POPIA: who looked at whose health answers. Service-role only, never add
--        policies for anon or authenticated.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.staff_submission_views (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- The Payload CMS user (payload.users.id) and their email and role at the time.
  viewer_id        TEXT NOT NULL CHECK (viewer_id <> ''),
  viewer_email     TEXT NOT NULL CHECK (viewer_email <> ''),
  viewer_role      TEXT NOT NULL CHECK (viewer_role <> ''),
  -- quiz = public.quiz_subscribers, intake = public.intake_submissions.
  submission_type  TEXT NOT NULL CHECK (submission_type IN ('quiz', 'intake')),
  submission_id    UUID NOT NULL,
  viewed_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- "Who opened this submission?"
CREATE INDEX IF NOT EXISTS staff_submission_views_submission_idx
  ON public.staff_submission_views (submission_type, submission_id, viewed_at DESC);

-- "What did this person open?"
CREATE INDEX IF NOT EXISTS staff_submission_views_viewer_idx
  ON public.staff_submission_views (viewer_email, viewed_at DESC);

COMMENT ON TABLE public.staff_submission_views IS
  'Access log (POPIA): one row per staff view of a quiz or intake submission on /staff/submissions, written by the web app before the answers are shown. Append-only (trigger). Service-role only. Never add policies for anon/authenticated.';

ALTER TABLE public.staff_submission_views ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_submission_views FROM anon, authenticated;

-- Deliberately NO policies for anon/authenticated: deny by default. The web
-- app's server writes with the service role.

-- Append-only: an access log that can be edited proves nothing.
CREATE OR REPLACE FUNCTION public.staff_submission_views_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'staff_submission_views is append-only';
END;
$$;

DROP TRIGGER IF EXISTS staff_submission_views_append_only ON public.staff_submission_views;
CREATE TRIGGER staff_submission_views_append_only
  BEFORE UPDATE OR DELETE ON public.staff_submission_views
  FOR EACH ROW EXECUTE FUNCTION public.staff_submission_views_append_only();

DROP TRIGGER IF EXISTS staff_submission_views_no_truncate ON public.staff_submission_views;
CREATE TRIGGER staff_submission_views_no_truncate
  BEFORE TRUNCATE ON public.staff_submission_views
  FOR EACH STATEMENT EXECUTE FUNCTION public.staff_submission_views_append_only();

NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- DOWN
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS staff_submission_views_no_truncate ON public.staff_submission_views;
-- DROP TRIGGER IF EXISTS staff_submission_views_append_only ON public.staff_submission_views;
-- DROP FUNCTION IF EXISTS public.staff_submission_views_append_only();
-- DROP INDEX IF EXISTS staff_submission_views_viewer_idx;
-- DROP INDEX IF EXISTS staff_submission_views_submission_idx;
-- DROP TABLE IF EXISTS public.staff_submission_views;
-- NOTIFY pgrst, 'reload schema';
