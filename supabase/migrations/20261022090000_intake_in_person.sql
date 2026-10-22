-- =============================================================================
-- Migration: 20261022090000_intake_in_person
-- Description: Intake forms (H-12): remember whether the session was bought as
--              an in-person session (variant title says "in-person"), so the
--              intake mail and its reminders leave the Zoom link out for it
--              (Johan, 22 Oct 2026, on Shayna's mail template).
-- Created: 2026-10-22
-- Apply on: the self-hosted Supabase on aimate-db1 (then NOTIFY pgrst), BEFORE
--           the web deploy that writes it.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

ALTER TABLE public.intake_submissions
  ADD COLUMN IF NOT EXISTS in_person BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.intake_submissions.in_person IS
  'True when every purchased variant of this service is in-person; the intake mail then has no Zoom link.';

-- ---------------------------------------------------------------------------
-- DOWN
-- ---------------------------------------------------------------------------
-- ALTER TABLE public.intake_submissions DROP COLUMN IF EXISTS in_person;
