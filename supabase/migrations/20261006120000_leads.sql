-- =============================================================================
-- Migration: 20261006120000_leads
-- Description: Our own copy of every website lead form submission (lead
--              magnet, masterclass, community, newsletter, quizzes, ...).
--              Written by /api/lead-magnet BEFORE the lead is sent to Vtiger,
--              so a Vtiger outage never loses a lead. Rows that did not reach
--              Vtiger stay 'pending' / 'failed' and are resent by
--              POST /api/leads/retry (n8n migration step 3).
-- Created: 2026-10-06
-- Apply on: the self-hosted Supabase on aimate-db1 (Johan).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.leads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 TEXT NOT NULL,
  first_name            TEXT,
  last_name             TEXT,
  source                TEXT NOT NULL,
  quiz_result           TEXT,
  -- pending: waiting for Vtiger; synced: in Vtiger; failed: last attempt
  -- failed, retry picks it up; n8n: handed to the old n8n webhook
  -- (LEADS_AUTOMATION=n8n); skipped: LEADS_AUTOMATION=off.
  vtiger_status         TEXT NOT NULL DEFAULT 'pending'
                        CHECK (vtiger_status IN ('pending', 'synced', 'failed', 'n8n', 'skipped')),
  vtiger_contact_id     TEXT,
  vtiger_event_id       TEXT,
  sync_attempts         INTEGER NOT NULL DEFAULT 0,
  -- Error text only, emails masked by the app (POPIA).
  last_sync_error       TEXT,
  last_sync_attempt_at  TIMESTAMPTZ,
  synced_at             TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- The retry reads the unsynced rows oldest first.
CREATE INDEX IF NOT EXISTS leads_unsynced_idx
  ON public.leads (created_at)
  WHERE vtiger_status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS leads_email_idx
  ON public.leads (email);

COMMENT ON TABLE public.leads IS
  'One row per website lead form submission. Durable copy kept before the lead is sent to Vtiger. Visitors never sign in, so there is no auth.uid(): write and read access is service-role only, from /api/lead-magnet and /api/leads/retry. Never add policies for anon/authenticated.';

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Deliberately NO policies for anon/authenticated: deny by default. All access
-- is via the service-role client from server routes (apps/web/lib/leads/store.ts).

DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- DOWN
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
-- DROP INDEX IF EXISTS leads_email_idx;
-- DROP INDEX IF EXISTS leads_unsynced_idx;
-- DROP TABLE IF EXISTS public.leads;
