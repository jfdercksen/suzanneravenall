-- =============================================================================
-- Migration: 20261118090000_popia_consent
-- Description: POPIA consent records (Suzanne's rules of 8 Nov 2026, Johan's
--              brief of 18 Nov). Adds to the three tables that hold form
--              submissions:
--                * the marketing opt-in: yes/no, the channels chosen (email,
--                  whatsapp, sms), when the choice was made and the version
--                  of the opt-in wording (apps/web/lib/consent/marketing.ts);
--                * quiz_subscribers: the required consent to process quiz
--                  answers (consented_at + consent_form_version,
--                  apps/web/lib/consent/quiz.ts; the version marks the
--                  interim wording until her Part B arrives);
--                * intake_submissions: the version of the intake form the
--                  answers were given on (form key + Payload updatedAt).
--              Existing rows read as "not opted in" with no choice time.
-- Created: 2026-11-18
-- Apply on: the self-hosted Supabase on aimate-db1 (Johan), BEFORE the web
--           deploy that writes these columns: without them the lead, quiz and
--           intake writes fail. Then NOTIFY pgrst so PostgREST sees them.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

-- leads ---------------------------------------------------------------------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS marketing_opt_in       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_channels     TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS marketing_choice_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_form_version TEXT;

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_marketing_channels_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_marketing_channels_check
  CHECK (marketing_channels <@ ARRAY['email', 'whatsapp', 'sms']::TEXT[]
         AND (marketing_opt_in OR cardinality(marketing_channels) = 0)
         -- opted in only with at least one channel, as the app enforces
         AND (NOT marketing_opt_in OR cardinality(marketing_channels) > 0));

-- Marketing sends read the opted-in leads.
CREATE INDEX IF NOT EXISTS leads_marketing_opt_in_idx
  ON public.leads (email)
  WHERE marketing_opt_in;

-- quiz_subscribers ----------------------------------------------------------
ALTER TABLE public.quiz_subscribers
  ADD COLUMN IF NOT EXISTS marketing_opt_in       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_channels     TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS marketing_choice_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_form_version TEXT,
  ADD COLUMN IF NOT EXISTS consented_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_form_version   TEXT;

ALTER TABLE public.quiz_subscribers DROP CONSTRAINT IF EXISTS quiz_subscribers_marketing_channels_check;
ALTER TABLE public.quiz_subscribers ADD CONSTRAINT quiz_subscribers_marketing_channels_check
  CHECK (marketing_channels <@ ARRAY['email', 'whatsapp', 'sms']::TEXT[]
         AND (marketing_opt_in OR cardinality(marketing_channels) = 0)
         -- opted in only with at least one channel, as the app enforces
         AND (NOT marketing_opt_in OR cardinality(marketing_channels) > 0));

-- A consent time always comes with the version of the wording consented to.
ALTER TABLE public.quiz_subscribers DROP CONSTRAINT IF EXISTS quiz_subscribers_consent_version_check;
ALTER TABLE public.quiz_subscribers ADD CONSTRAINT quiz_subscribers_consent_version_check
  CHECK (consented_at IS NULL OR consent_form_version IS NOT NULL);

COMMENT ON COLUMN public.quiz_subscribers.consented_at IS
  'When the quiz taker ticked the consent to process their answers (health and wellbeing information) before the first question. Set with the answers by /api/quiz/complete.';
COMMENT ON COLUMN public.quiz_subscribers.consent_form_version IS
  'The consent wording version (apps/web/lib/consent/quiz.ts CONSENT_FORM_VERSION). quiz-consent-interim-* = interim wording until RI-F-POPIA-09 Part B.';

-- intake_submissions --------------------------------------------------------
ALTER TABLE public.intake_submissions
  ADD COLUMN IF NOT EXISTS marketing_opt_in       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_channels     TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS marketing_choice_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_form_version TEXT,
  ADD COLUMN IF NOT EXISTS form_version           TEXT;

ALTER TABLE public.intake_submissions DROP CONSTRAINT IF EXISTS intake_submissions_marketing_channels_check;
ALTER TABLE public.intake_submissions ADD CONSTRAINT intake_submissions_marketing_channels_check
  CHECK (marketing_channels <@ ARRAY['email', 'whatsapp', 'sms']::TEXT[]
         AND (marketing_opt_in OR cardinality(marketing_channels) = 0)
         -- opted in only with at least one channel, as the app enforces
         AND (NOT marketing_opt_in OR cardinality(marketing_channels) > 0));

COMMENT ON COLUMN public.intake_submissions.form_version IS
  'The intake form version the answers were given on: "<formKey>@<Payload updatedAt>". With completed_at it dates each submission (POPIA).';

NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- DOWN
-- ---------------------------------------------------------------------------
-- ALTER TABLE public.intake_submissions DROP CONSTRAINT IF EXISTS intake_submissions_marketing_channels_check;
-- ALTER TABLE public.intake_submissions
--   DROP COLUMN IF EXISTS form_version,
--   DROP COLUMN IF EXISTS marketing_form_version,
--   DROP COLUMN IF EXISTS marketing_choice_at,
--   DROP COLUMN IF EXISTS marketing_channels,
--   DROP COLUMN IF EXISTS marketing_opt_in;
-- ALTER TABLE public.quiz_subscribers DROP CONSTRAINT IF EXISTS quiz_subscribers_consent_version_check;
-- ALTER TABLE public.quiz_subscribers DROP CONSTRAINT IF EXISTS quiz_subscribers_marketing_channels_check;
-- ALTER TABLE public.quiz_subscribers
--   DROP COLUMN IF EXISTS consent_form_version,
--   DROP COLUMN IF EXISTS consented_at,
--   DROP COLUMN IF EXISTS marketing_form_version,
--   DROP COLUMN IF EXISTS marketing_choice_at,
--   DROP COLUMN IF EXISTS marketing_channels,
--   DROP COLUMN IF EXISTS marketing_opt_in;
-- DROP INDEX IF EXISTS leads_marketing_opt_in_idx;
-- ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_marketing_channels_check;
-- ALTER TABLE public.leads
--   DROP COLUMN IF EXISTS marketing_form_version,
--   DROP COLUMN IF EXISTS marketing_choice_at,
--   DROP COLUMN IF EXISTS marketing_channels,
--   DROP COLUMN IF EXISTS marketing_opt_in;
-- NOTIFY pgrst, 'reload schema';
